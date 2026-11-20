import React, { useEffect, useRef, useState } from 'react';

const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],        // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8],        // Index
  [5, 9], [9, 10], [10, 11], [11, 12],   // Middle
  [9, 13], [13, 14], [14, 15], [15, 16], // Ring
  [13, 17], [17, 18], [18, 19], [19, 20],// Pinky
  [0, 17]                                 // Palm base
];

export const HandTracking = ({
  isActive,
  onGestureChange,
  onTrackingData,
  onCameraError,
  sensitivity = 1.0,
}) => {
  const videoRef   = useRef(null);
  const canvasRef  = useRef(null);
  const handsRef   = useRef(null);
  const cameraRef  = useRef(null);
  const streamRef  = useRef(null);
  const isRunningRef = useRef(false);

  // Gesture stabilization
  const currentGestureRef   = useRef('palm');
  const candidateGestureRef = useRef('palm');
  const candidateCountRef   = useRef(0);
  const STABILIZATION_THRESHOLD = 2;

  // Smooth tracking refs (avoid React re-render on every frame)
  const handXRef    = useRef(0);
  const handYRef    = useRef(0);
  const handZoomRef = useRef(1.0);
  const openFactorRef = useRef(1.0);

  // UI state: loading | null
  const [status, setStatus] = useState('idle'); // idle | loading | active | denied | unavailable

  /* ── Main Effect: start / stop tracking ─────────────── */
  useEffect(() => {
    let isCancelled = false;

    async function initMediaPipe() {
      setStatus('loading');

      // Wait for MediaPipe Hands CDN script (up to 9 s)
      let attempts = 0;
      while (typeof window.Hands === 'undefined' && attempts < 30) {
        if (isCancelled) return;
        await new Promise(r => setTimeout(r, 300));
        attempts++;
      }

      if (typeof window.Hands === 'undefined') {
        setStatus('unavailable');
        onCameraError?.('unavailable');
        return;
      }

      try {
        // Request camera permission explicitly so we catch denial cleanly
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 320 }, height: { ideal: 240 }, facingMode: 'user' }
        });
        streamRef.current = stream;

        const hands = new window.Hands({
          locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`
        });
        hands.setOptions({
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });
        hands.onResults(results => {
          if (!isCancelled && isRunningRef.current) processResults(results);
        });
        handsRef.current = hands;

        const video = videoRef.current;
        if (!video) return;

        if (typeof window.Camera !== 'undefined') {
          // MediaPipe Camera helper handles getUserMedia internally
          stream.getTracks().forEach(t => t.stop());
          streamRef.current = null;

          const mp_camera = new window.Camera(video, {
            onFrame: async () => {
              if (isRunningRef.current && handsRef.current)
                await handsRef.current.send({ image: video });
            },
            width: 320,
            height: 240
          });
          await mp_camera.start();
          cameraRef.current = mp_camera;
        } else {
          video.srcObject = stream;
          await video.play();

          const loop = async () => {
            if (!isRunningRef.current || isCancelled) return;
            if (video.readyState >= 2 && handsRef.current)
              await handsRef.current.send({ image: video });
            requestAnimationFrame(loop);
          };
          requestAnimationFrame(loop);
        }

        isRunningRef.current = true;
        setStatus('active');
      } catch (err) {
        console.warn('Camera error:', err.name, err.message);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setStatus('denied');
          onCameraError?.('denied');
        } else {
          setStatus('unavailable');
          onCameraError?.('unavailable');
        }
      }
    }

    if (isActive) {
      initMediaPipe();
    } else {
      cleanup();
      setStatus('idle');
    }

    return () => {
      isCancelled = true;
      cleanup();
    };
  }, [isActive]);

  const cleanup = () => {
    isRunningRef.current = false;
    if (cameraRef.current) {
      try { cameraRef.current.stop(); } catch (_) {}
      cameraRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current?.srcObject) videoRef.current.srcObject = null;
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  /* ── Results Processor ───────────────────────────────── */
  const processResults = results => {
    const canvas = canvasRef.current;
    const video  = videoRef.current;
    if (!canvas || !video) return;

    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width  = video.videoWidth  || 320;
      canvas.height = video.videoHeight || 240;
    }

    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const handsList = results.multiHandLandmarks;

    if (handsList && handsList.length > 0) {
      for (let h = 0; h < handsList.length; h++) {
        drawSkeleton(ctx, handsList[h], canvas.width, canvas.height, h);
      }
      classifyGestures(handsList, canvas.width, canvas.height);
    } else {
      onTrackingData?.({
        isHandDetected: false,
        gesture: currentGestureRef.current,
        openFactor: openFactorRef.current,
        handX: handXRef.current,
        handY: handYRef.current,
        handZoom: handZoomRef.current,
        moveDirection: 'CENTER',
        numHands: 0
      });
    }

    ctx.restore();
  };

  /* ── Single-hand Pose Classifier ────────────────────── */
  const evaluateSingleHand = landmarks => {
    const wrist     = landmarks[0];
    const thumbTip  = landmarks[4];
    const indexMcp  = landmarks[5];
    const indexPip  = landmarks[6];
    const indexTip  = landmarks[8];
    const middleMcp = landmarks[9];
    const middlePip = landmarks[10];
    const middleTip = landmarks[12];
    const ringMcp   = landmarks[13];
    const ringPip   = landmarks[14];
    const ringTip   = landmarks[16];
    const pinkyMcp  = landmarks[17];
    const pinkyPip  = landmarks[18];
    const pinkyTip  = landmarks[20];

    const palmCenter = {
      x: (wrist.x + indexMcp.x + middleMcp.x + ringMcp.x + pinkyMcp.x) / 5,
      y: (wrist.y + indexMcp.y + middleMcp.y + ringMcp.y + pinkyMcp.y) / 5,
      z: (wrist.z + indexMcp.z + middleMcp.z + ringMcp.z + pinkyMcp.z) / 5
    };

    const handScale = Math.hypot(middleMcp.x - wrist.x, middleMcp.y - wrist.y, (middleMcp.z || 0) - (wrist.z || 0)) || 0.15;
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, (a.z || 0) - (b.z || 0));

    const isIndexExtended  = dist(indexTip, wrist)  > dist(indexPip, wrist)  * 1.25;
    const isMiddleExtended = dist(middleTip, wrist)  > dist(middlePip, wrist) * 1.25;
    const isRingExtended   = dist(ringTip, wrist)    > dist(ringPip, wrist)   * 1.25;
    const isPinkyExtended  = dist(pinkyTip, wrist)   > dist(pinkyPip, wrist)  * 1.25;
    const isThumbExtended  = dist(thumbTip, pinkyMcp) > handScale * 0.95;

    const pinchDist = dist(thumbTip, indexTip) / handScale;
    const isPinch   = pinchDist < 0.38;

    // openFactor: 0.0=fist, 1.0=palm
    const fingerTips = [indexTip, middleTip, ringTip, pinkyTip];
    const fingerPips = [indexPip, middlePip, ringPip, pinkyPip];
    let totalTipDist = 0, curledCount = 0;
    for (let i = 0; i < 4; i++) {
      const td = dist(fingerTips[i], palmCenter);
      const pd = dist(fingerPips[i], palmCenter);
      totalTipDist += td;
      if (td < pd * 1.15) curledCount++;
    }
    const normTipDist = (totalTipDist / 4) / handScale;
    const rawFactor   = (normTipDist - 0.95) / (1.55 - 0.95);
    const openFactor  = Math.max(0, Math.min(1, rawFactor));

    const extendedCount = (isIndexExtended ? 1 : 0) +
                          (isMiddleExtended ? 1 : 0) +
                          (isRingExtended ? 1 : 0) +
                          (isPinkyExtended ? 1 : 0);

    const isOneFinger   = isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended;
    const isTwoFingers  = isIndexExtended && isMiddleExtended && !isRingExtended && !isPinkyExtended;
    const isThreeFingers = (isIndexExtended && isMiddleExtended && isRingExtended && !isPinkyExtended) ||
                           (isThumbExtended && isIndexExtended && isMiddleExtended && !isRingExtended && !isPinkyExtended) ||
                           (extendedCount === 3 && !isPinkyExtended);
    const isFourFingers = (isIndexExtended && isMiddleExtended && isRingExtended && isPinkyExtended && !isThumbExtended) ||
                          (extendedCount === 4 && (!isThumbExtended || dist(thumbTip, palmCenter) < handScale * 0.95));
    const isFist        = (curledCount >= 3 && !isOneFinger && !isTwoFingers && !isThreeFingers && !isFourFingers) ||
                          (!isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended);
    const isPalm        = isIndexExtended && isMiddleExtended && isRingExtended && isPinkyExtended && isThumbExtended;

    let pose = 'palm';
    if (isPinch) {
      pose = 'pinch';
    } else if (isOneFinger) {
      pose = 'point';
    } else if (isTwoFingers) {
      pose = 'two_fingers';
    } else if (isThreeFingers) {
      pose = 'three_fingers';
    } else if (isFourFingers) {
      pose = 'four_fingers';
    } else if (isFist) {
      pose = 'fist';
    } else if (isPalm || extendedCount >= 4) {
      pose = 'palm';
    } else {
      pose = openFactor < 0.35 ? 'fist' : 'palm';
    }

    return { pose, openFactor, palmCenter, handScale, isPinch };
  };

  /* ── Multi-hand Classifier + Navigation ─────────────── */
  const classifyGestures = (handsList, w, h) => {
    const numHands = handsList.length;
    const hand1    = evaluateSingleHand(handsList[0]);
    let hand2 = null;

    let rawGesture = hand1.pose;
    if (numHands === 2) {
      hand2 = evaluateSingleHand(handsList[1]);
      if ((hand1.pose === 'palm' || hand1.openFactor > 0.6) &&
          (hand2.pose === 'palm' || hand2.openFactor > 0.6)) {
        rawGesture = 'both_open';
      } else if ((hand1.pose === 'fist' || hand1.openFactor < 0.35) &&
                 (hand2.pose === 'fist' || hand2.openFactor < 0.35)) {
        rawGesture = 'both_closed';
      }
    }

    // Stabilization
    if (rawGesture === candidateGestureRef.current) {
      candidateCountRef.current++;
    } else {
      candidateGestureRef.current = rawGesture;
      candidateCountRef.current = 1;
    }

    let finalGesture = currentGestureRef.current;
    if (candidateCountRef.current >= STABILIZATION_THRESHOLD) {
      finalGesture = candidateGestureRef.current;
    }

    if (finalGesture !== currentGestureRef.current) {
      currentGestureRef.current = finalGesture;
      onGestureChange?.(finalGesture, hand1.openFactor);
    }

    // Pan / Zoom from palm center
    const normX = (hand1.palmCenter.x - 0.5) * -2.4 * sensitivity;
    const normY = (hand1.palmCenter.y - 0.5) * -2.4 * sensitivity;
    const zoom  = hand1.handScale / 0.17;

    handXRef.current    += (normX - handXRef.current) * 0.38;
    handYRef.current    += (normY - handYRef.current) * 0.38;
    handZoomRef.current += (zoom  - handZoomRef.current) * 0.25;
    openFactorRef.current += (hand1.openFactor - openFactorRef.current) * 0.28;

    onTrackingData?.({
      isHandDetected: true,
      gesture: finalGesture,
      openFactor: openFactorRef.current,
      handX: handXRef.current,
      handY: handYRef.current,
      handZoom: handZoomRef.current,
      numHands,
      isPinch: hand1.isPinch,
    });
  };

  /* ── Skeleton Renderer ───────────────────────────────── */
  const drawSkeleton = (ctx, landmarks, w, h, handIndex) => {
    const isFirst = handIndex === 0;
    ctx.lineWidth  = 2;
    ctx.strokeStyle = isFirst ? '#38bdf8' : '#c084fc';
    ctx.shadowColor = isFirst ? '#38bdf8' : '#c084fc';
    ctx.shadowBlur  = 5;

    for (const [s, e] of HAND_CONNECTIONS) {
      const p1 = landmarks[s], p2 = landmarks[e];
      ctx.beginPath();
      ctx.moveTo(p1.x * w, p1.y * h);
      ctx.lineTo(p2.x * w, p2.y * h);
      ctx.stroke();
    }

    for (let i = 0; i < landmarks.length; i++) {
      const p = landmarks[i];
      const isTip = [4, 8, 12, 16, 20].includes(i);
      ctx.beginPath();
      ctx.arc(p.x * w, p.y * h, isTip ? 3.5 : 2, 0, Math.PI * 2);
      ctx.fillStyle = isTip ? '#ffffff' : (isFirst ? '#7dd3fc' : '#e879f9');
      ctx.fill();
    }
  };

  /* ── Render ──────────────────────────────────────────── */
  const isLive = status === 'active';

  return (
    <div className="camera-hud-container">
      <video
        ref={videoRef}
        autoPlay playsInline muted
        style={{ display: isLive ? 'block' : 'none' }}
      />
      <canvas
        ref={canvasRef}
        style={{ display: isLive ? 'block' : 'none' }}
      />
      <div className="camera-scanline" />

      {/* Badge */}
      <div className="camera-badge">
        <span className={`rec-dot ${status === 'loading' ? 'loading' : ''}`} />
        <span>
          {status === 'active'      ? 'LIVE'       :
           status === 'loading'     ? 'INIT'       :
           status === 'denied'      ? 'DENIED'     :
           status === 'unavailable' ? 'NO CAM'     : 'OFF'}
        </span>
      </div>

      {/* Loading indicator */}
      {status === 'loading' && (
        <div className="camera-enable-overlay">
          <div className="camera-loading-pulse">
            <div className="pulse-ring" />
            <svg viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" width="20" height="20">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </div>
        </div>
      )}

      {/* Off / idle placeholder */}
      {status === 'idle' && (
        <div className="camera-enable-overlay" style={{ cursor: 'default' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="rgba(100,116,139,0.5)" strokeWidth="1.5" width="28" height="28">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
        </div>
      )}
    </div>
  );
};

export default HandTracking;
