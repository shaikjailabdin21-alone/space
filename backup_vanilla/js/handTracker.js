/**
 * MediaPipe Hands Real-time Tracking and Gesture Recognition
 * Detects 21 3D landmarks, calculates Open Hand / Closed Fist ratios,
 * and extracts hand position & zoom metrics for universe control.
 */

export class HandTracker {
  constructor(videoElement, canvasElement, options = {}) {
    this.video = videoElement;
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.onGestureChange = options.onGestureChange || (() => {});
    this.onTrackingData = options.onTrackingData || (() => {});

    this.isActive = false;
    this.cameraInstance = null;
    this.handsInstance = null;
    this.isHandDetected = false;

    // Smoothed state values
    this.openFactor = 1.0; // 0.0 = Fist, 1.0 = Open Palm
    this.handX = 0; // -1 (left) to 1 (right)
    this.handY = 0; // -1 (down) to 1 (up)
    this.handZoom = 1.0;
    this.currentState = 'palm'; // 'palm' | 'fist' | 'partial'
    this.sensitivity = 1.0;

    // MediaPipe Hand Landmark Connections
    this.HAND_CONNECTIONS = [
      [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb
      [0, 5], [5, 6], [6, 7], [7, 8],       // Index
      [5, 9], [9, 10], [10, 11], [11, 12],  // Middle
      [9, 13], [13, 14], [14, 15], [15, 16],// Ring
      [13, 17], [17, 18], [18, 19], [19, 20],// Pinky
      [0, 17]                               // Palm base
    ];
  }

  async init() {
    try {
      // Wait for MediaPipe Hands script to load if still pending
      let attempts = 0;
      while (typeof window.Hands === 'undefined' && attempts < 25) {
        await new Promise(resolve => setTimeout(resolve, 200));
        attempts++;
      }

      if (typeof window.Hands === 'undefined') {
        throw new Error('MediaPipe Hands library not loaded from CDN');
      }

      this.handsInstance = new window.Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      });

      this.handsInstance.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.55,
        minTrackingConfidence: 0.55
      });

      this.handsInstance.onResults((results) => this.processResults(results));

      return true;
    } catch (err) {
      console.error('Failed to initialize MediaPipe Hands:', err);
      return false;
    }
  }

  async startCamera() {
    try {
      if (!this.handsInstance) {
        const ok = await this.init();
        if (!ok) return false;
      }

      // Check if Camera utility is available or use direct WebRTC getUserMedia
      if (typeof window.Camera !== 'undefined') {
        this.cameraInstance = new window.Camera(this.video, {
          onFrame: async () => {
            if (this.isActive && this.handsInstance) {
              await this.handsInstance.send({ image: this.video });
            }
          },
          width: 320,
          height: 240
        });
        await this.cameraInstance.start();
      } else {
        // Fallback standard getUserMedia loop
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 320 }, height: { ideal: 240 }, facingMode: 'user' }
        });
        this.video.srcObject = stream;
        await this.video.play();
        this.startManualCaptureLoop();
      }

      this.isActive = true;
      return true;
    } catch (err) {
      console.warn('Webcam permission error or camera unavailable:', err);
      this.isActive = false;
      return false;
    }
  }

  startManualCaptureLoop() {
    const processFrame = async () => {
      if (!this.isActive) return;
      if (this.video.readyState >= 2 && this.handsInstance) {
        await this.handsInstance.send({ image: this.video });
      }
      requestAnimationFrame(processFrame);
    };
    requestAnimationFrame(processFrame);
  }

  stopCamera() {
    this.isActive = false;
    if (this.cameraInstance) {
      try { this.cameraInstance.stop(); } catch (e) {}
    }
    if (this.video && this.video.srcObject) {
      const tracks = this.video.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      this.video.srcObject = null;
    }
    this.clearCanvas();
  }

  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  processResults(results) {
    // Resize overlay canvas to match video stream
    if (this.canvas.width !== this.video.videoWidth || this.canvas.height !== this.video.videoHeight) {
      this.canvas.width = this.video.videoWidth || 320;
      this.canvas.height = this.video.videoHeight || 240;
    }

    this.ctx.save();
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      this.isHandDetected = true;
      const landmarks = results.multiHandLandmarks[0];

      // Draw futuristic skeleton overlay on HUD
      this.drawHandSkeleton(landmarks);

      // Analyze hand posture and extract controls
      this.analyzeHand(landmarks);
    } else {
      this.isHandDetected = false;
      this.onTrackingData({
        isHandDetected: false,
        openFactor: this.openFactor,
        state: this.currentState,
        handX: this.handX,
        handY: this.handY,
        handZoom: this.handZoom
      });
    }

    this.ctx.restore();
  }

  /**
   * Robust Hand Open / Fist Analysis
   */
  analyzeHand(landmarks) {
    const wrist = landmarks[0];
    const indexMcp = landmarks[5];
    const middleMcp = landmarks[9];
    const ringMcp = landmarks[13];
    const pinkyMcp = landmarks[17];

    // 1. Palm Center approximation
    const palmCenter = {
      x: (wrist.x + indexMcp.x + middleMcp.x + ringMcp.x + pinkyMcp.x) / 5,
      y: (wrist.y + indexMcp.y + middleMcp.y + ringMcp.y + pinkyMcp.y) / 5,
      z: (wrist.z + indexMcp.z + middleMcp.z + ringMcp.z + pinkyMcp.z) / 5
    };

    // 2. Hand Scale reference (distance from wrist to middle MCP)
    const handScale = Math.hypot(middleMcp.x - wrist.x, middleMcp.y - wrist.y);

    // 3. Fingertip to palm distances for the 4 long fingers (index, middle, ring, pinky)
    const fingerTips = [landmarks[8], landmarks[12], landmarks[16], landmarks[20]];
    const fingerPips = [landmarks[6], landmarks[10], landmarks[14], landmarks[18]];

    let totalTipDist = 0;
    let curledCount = 0;

    for (let i = 0; i < 4; i++) {
      const tipDist = Math.hypot(
        fingerTips[i].x - palmCenter.x,
        fingerTips[i].y - palmCenter.y,
        (fingerTips[i].z || 0) - (palmCenter.z || 0)
      );
      const pipDist = Math.hypot(
        fingerPips[i].x - palmCenter.x,
        fingerPips[i].y - palmCenter.y,
        (fingerPips[i].z || 0) - (palmCenter.z || 0)
      );

      totalTipDist += tipDist;

      // Finger is curled if tip is closer to wrist/palm than PIP
      if (tipDist < pipDist * 1.15) {
        curledCount++;
      }
    }

    // Normalized average tip distance relative to hand size
    const avgTipDist = totalTipDist / 4;
    const normalizedTipDist = avgTipDist / (handScale || 0.15);

    // Continuous openFactor calculation:
    // Tight fist: normalizedTipDist ~= 0.7 - 0.95
    // Open palm: normalizedTipDist ~= 1.5 - 2.2
    const minFist = 0.95;
    const maxOpen = 1.55;
    const rawFactor = (normalizedTipDist - minFist) / (maxOpen - minFist);
    const clampedFactor = Math.max(0.0, Math.min(1.0, rawFactor));

    // Smooth openFactor to avoid jitter
    this.openFactor += (clampedFactor - this.openFactor) * 0.22;

    // Classify discrete state
    let newState = 'partial';
    if (this.openFactor < 0.32 || curledCount >= 3) {
      newState = 'fist';
    } else if (this.openFactor > 0.68 && curledCount <= 1) {
      newState = 'palm';
    }

    if (newState !== this.currentState) {
      this.currentState = newState;
      this.onGestureChange(this.currentState, this.openFactor);
    }

    // 4. Hand Navigation Coordinates (Left/Right, Up/Down)
    // Note: camera preview is mirrored in CSS, so in landmark coords:
    // landmark.x = 0 is camera right (user's right in mirrored view)
    const normX = (palmCenter.x - 0.5) * -2.0 * this.sensitivity; // Inverted for natural mirror interaction
    const normY = (palmCenter.y - 0.5) * -2.0 * this.sensitivity; // Inverted so moving hand UP gives positive Y

    this.handX += (normX - this.handX) * 0.2;
    this.handY += (normY - this.handY) * 0.2;

    // 5. Hand Zoom / Depth (hand closer = larger scale = zoom in)
    const zoomFactor = handScale / 0.17;
    this.handZoom += (zoomFactor - this.handZoom) * 0.15;

    // Dispatch update
    this.onTrackingData({
      isHandDetected: true,
      openFactor: this.openFactor,
      state: this.currentState,
      handX: this.handX,
      handY: this.handY,
      handZoom: this.handZoom,
      curledCount
    });
  }

  /**
   * Draw Neon Cyberpunk Hand Skeleton Overlay
   */
  drawHandSkeleton(landmarks) {
    const w = this.canvas.width;
    const h = this.canvas.height;

    // 1. Draw glowing connections
    this.ctx.lineWidth = 2.5;
    this.ctx.strokeStyle = this.openFactor < 0.35 ? '#f472b6' : '#38bdf8';
    this.ctx.shadowColor = this.openFactor < 0.35 ? '#f472b6' : '#38bdf8';
    this.ctx.shadowBlur = 8;

    for (const [startIdx, endIdx] of this.HAND_CONNECTIONS) {
      const p1 = landmarks[startIdx];
      const p2 = landmarks[endIdx];

      this.ctx.beginPath();
      this.ctx.moveTo(p1.x * w, p1.y * h);
      this.ctx.lineTo(p2.x * w, p2.y * h);
      this.ctx.stroke();
    }

    // 2. Draw landmark joints
    for (let i = 0; i < landmarks.length; i++) {
      const p = landmarks[i];
      const isTip = [4, 8, 12, 16, 20].includes(i);

      this.ctx.beginPath();
      this.ctx.arc(p.x * w, p.y * h, isTip ? 4 : 2.5, 0, Math.PI * 2);
      this.ctx.fillStyle = isTip ? '#ffffff' : (this.openFactor < 0.35 ? '#fb7185' : '#7dd3fc');
      this.ctx.shadowBlur = 6;
      this.ctx.fill();
    }
  }
}
