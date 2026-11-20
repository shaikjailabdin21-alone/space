/**
 * HUD & UI Management Module
 * Handles telemetries, gesture feedback, settings drawer, modals, and user actions
 */

export class UIManager {
  constructor(galaxyEngine, handTracker, cosmicAudio) {
    this.galaxy = galaxyEngine;
    this.tracker = handTracker;
    this.audio = cosmicAudio;

    this.fpsElement = document.getElementById('fps-value');
    this.stateElement = document.getElementById('state-value');
    this.gestureText = document.getElementById('gesture-text');
    this.gesturePill = document.getElementById('gesture-pill');
    this.gestureFill = document.getElementById('gesture-fill');
    this.cameraStatusText = document.getElementById('camera-status-text');
    this.cameraPlaceholder = document.getElementById('camera-placeholder');
    this.guidanceText = document.getElementById('guidance-text');
    this.toastElement = document.getElementById('toast-notice');

    this.frameCount = 0;
    this.lastFpsUpdate = performance.now();
    this.mouseModeActive = false;
    this.isMouseDown = false;

    this.bindEvents();
    this.setupMouseFallback();
  }

  bindEvents() {
    // Start Experience Button
    const startBtn = document.getElementById('start-btn');
    const introBackdrop = document.getElementById('intro-modal-backdrop');
    if (startBtn && introBackdrop) {
      startBtn.addEventListener('click', async () => {
        introBackdrop.classList.add('hidden');
        this.audio.init();
        this.audio.resume();

        // Start camera tracking
        this.showToast('Initializing Neural Hand Tracker...');
        const ok = await this.tracker.startCamera();
        if (ok) {
          if (this.cameraPlaceholder) this.cameraPlaceholder.style.display = 'none';
          this.showToast('Hand Tracking Online: Show your hand to camera');
        } else {
          this.showToast('Webcam not accessible - Mouse Control Enabled', 4000);
          this.setMouseMode(true);
        }
      });
    }

    // Camera Toggle Button
    const toggleCamBtn = document.getElementById('toggle-camera-btn');
    if (toggleCamBtn) {
      toggleCamBtn.addEventListener('click', async () => {
        if (this.tracker.isActive) {
          this.tracker.stopCamera();
          if (this.cameraPlaceholder) this.cameraPlaceholder.style.display = 'flex';
          toggleCamBtn.classList.remove('active');
          this.showToast('Camera feed paused');
        } else {
          const ok = await this.tracker.startCamera();
          if (ok) {
            if (this.cameraPlaceholder) this.cameraPlaceholder.style.display = 'none';
            toggleCamBtn.classList.add('active');
            this.setMouseMode(false);
            this.showToast('Camera feed active');
          } else {
            this.showToast('Camera permission denied or unavailable');
          }
        }
      });
    }

    // Reset Universe Button
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.galaxy.resetUniverse();
        this.audio.playExplosionChime();
        this.showToast('Universe coordinates recalibrated');
      });
    }

    // Audio Toggle Button
    const audioBtn = document.getElementById('toggle-audio-btn');
    if (audioBtn) {
      audioBtn.addEventListener('click', () => {
        this.audio.init();
        const unmuted = this.audio.toggleMute();
        audioBtn.classList.toggle('active', unmuted);
        this.showToast(unmuted ? 'Cosmic Audio Enabled' : 'Audio Muted');
      });
    }

    // Mouse / Demo Mode Toggle
    const mouseBtn = document.getElementById('toggle-mouse-btn');
    if (mouseBtn) {
      mouseBtn.addEventListener('click', () => {
        this.setMouseMode(!this.mouseModeActive);
      });
    }

    // Settings Drawer Toggle
    const settingsBtn = document.getElementById('settings-btn');
    const settingsDrawer = document.getElementById('settings-drawer');
    const closeDrawerBtn = document.getElementById('close-drawer-btn');
    if (settingsBtn && settingsDrawer) {
      settingsBtn.addEventListener('click', () => {
        settingsDrawer.classList.toggle('open');
      });
    }
    if (closeDrawerBtn && settingsDrawer) {
      closeDrawerBtn.addEventListener('click', () => {
        settingsDrawer.classList.remove('open');
      });
    }

    // Theme selector buttons
    const themeButtons = document.querySelectorAll('.theme-btn');
    themeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        themeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const themeKey = btn.dataset.theme;
        this.galaxy.setTheme(themeKey);
        this.showToast(`Applied Theme: ${this.galaxy.themes[themeKey].name}`);
      });
    });

    // Sensitivity slider
    const sensSlider = document.getElementById('sensitivity-slider');
    const sensVal = document.getElementById('sens-val');
    if (sensSlider && sensVal) {
      sensSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        sensVal.textContent = `${val.toFixed(1)}x`;
        if (this.tracker) {
          this.tracker.sensitivity = val;
        }
      });
    }

    // Keyboard Shortcuts (Spacebar = toggle Fist / Sphere)
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        const nextMorph = this.galaxy.targetMorph > 0.5 ? 0.0 : 1.0;
        this.galaxy.setMorphTarget(nextMorph);
        if (nextMorph === 0.0) {
          this.audio.playCollapseSound();
          this.showToast('Gesture Override: Singularity Sphere');
        } else {
          this.audio.playExplosionChime();
          this.showToast('Gesture Override: Galaxy Explosion');
        }
      } else if (e.code === 'KeyR') {
        this.galaxy.resetUniverse();
      }
    });
  }

  setMouseMode(active) {
    this.mouseModeActive = active;
    const mouseBtn = document.getElementById('toggle-mouse-btn');
    if (mouseBtn) mouseBtn.classList.toggle('active', active);

    if (active) {
      this.showToast('Mouse Mode Active: Move to steer, Click to form Sphere');
      if (this.guidanceText) {
        this.guidanceText.textContent = 'Hold Mouse Click to Compress into Sphere';
      }
    } else {
      this.showToast('Webcam Hand Tracking Mode Active');
      if (this.guidanceText) {
        this.guidanceText.textContent = 'Close Fist = Sphere | Open Palm = Galaxy';
      }
    }
  }

  setupMouseFallback() {
    window.addEventListener('mousemove', (e) => {
      if (!this.mouseModeActive && this.tracker.isHandDetected) return;

      const normX = (e.clientX / window.innerWidth - 0.5) * 2.0;
      const normY = -(e.clientY / window.innerHeight - 0.5) * 2.0;

      this.galaxy.updateHandTarget(normX, normY, 1.0);
    });

    window.addEventListener('mousedown', (e) => {
      if (e.target.closest('.interactive') || e.target.closest('button')) return;
      if (!this.mouseModeActive && this.tracker.isHandDetected) return;

      this.isMouseDown = true;
      this.galaxy.setMorphTarget(0.0);
      this.audio.playCollapseSound();
      this.updateGestureDisplay('fist', 0.0);
    });

    window.addEventListener('mouseup', () => {
      if (!this.mouseModeActive && this.tracker.isHandDetected) return;

      this.isMouseDown = false;
      this.galaxy.setMorphTarget(1.0);
      this.audio.playExplosionChime();
      this.updateGestureDisplay('palm', 1.0);
    });

    // Touch support for mobile gestures
    window.addEventListener('touchstart', (e) => {
      if (e.target.closest('.interactive') || e.target.closest('button')) return;
      this.galaxy.setMorphTarget(0.0);
      this.audio.playCollapseSound();
      this.updateGestureDisplay('fist', 0.0);
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
      if (e.target.closest('.interactive') || e.target.closest('button')) return;
      this.galaxy.setMorphTarget(1.0);
      this.audio.playExplosionChime();
      this.updateGestureDisplay('palm', 1.0);
    }, { passive: true });
  }

  updateGestureDisplay(state, openFactor) {
    if (this.gestureFill) {
      this.gestureFill.style.width = `${Math.round(openFactor * 100)}%`;
    }

    if (this.gesturePill && this.gestureText) {
      this.gesturePill.className = `gesture-pill ${state}`;
      if (state === 'fist') {
        this.gestureText.textContent = 'CLOSED FIST';
      } else if (state === 'palm') {
        this.gestureText.textContent = 'OPEN PALM';
      } else {
        this.gestureText.textContent = 'PARTIAL';
      }
    }

    if (this.stateElement) {
      if (openFactor < 0.3) {
        this.stateElement.textContent = 'SINGULARITY';
        this.stateElement.style.color = '#f472b6';
      } else if (openFactor > 0.7) {
        this.stateElement.textContent = 'GALAXY SPIRAL';
        this.stateElement.style.color = '#38bdf8';
      } else {
        this.stateElement.textContent = 'TRANSITIONING';
        this.stateElement.style.color = '#c084fc';
      }
    }
  }

  showToast(message, duration = 3000) {
    if (!this.toastElement) return;
    this.toastElement.textContent = message;
    this.toastElement.classList.add('show');
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.toastElement.classList.remove('show');
    }, duration);
  }

  updateTelemetry() {
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFpsUpdate >= 500) {
      const fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
      if (this.fpsElement) {
        this.fpsElement.textContent = `${fps} FPS`;
      }
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }
  }
}
