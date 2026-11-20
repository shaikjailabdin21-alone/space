/**
 * Main Application Orchestrator
 * Connects 3D Galaxy, MediaPipe Hand Tracker, Web Audio Synthesizer, and UI
 */

import { GalaxyEngine } from './galaxy.js';
import { HandTracker } from './handTracker.js';
import { cosmicAudio } from './audio.js';
import { UIManager } from './ui.js';

window.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize 3D Galaxy Engine
  const container = document.getElementById('canvas-container');
  const galaxyEngine = new GalaxyEngine(container);

  // 2. Prepare Hand Tracker with video & overlay canvas
  const videoElement = document.getElementById('webcam-video');
  const canvasElement = document.getElementById('webcam-overlay');

  let lastReportedState = 'palm';

  const handTracker = new HandTracker(videoElement, canvasElement, {
    onGestureChange: (state, openFactor) => {
      if (state === 'fist' && lastReportedState !== 'fist') {
        cosmicAudio.playCollapseSound();
      } else if (state === 'palm' && lastReportedState !== 'palm') {
        cosmicAudio.playExplosionChime();
      }
      lastReportedState = state;
    },
    onTrackingData: (data) => {
      if (data.isHandDetected) {
        // Direct continuous morphing: 0.0 = Sphere, 1.0 = Galaxy
        galaxyEngine.setMorphTarget(data.openFactor);

        // Hand Position Navigation (Left/Right, Up/Down, Zoom)
        galaxyEngine.updateHandTarget(data.handX, data.handY, data.handZoom);

        // Update audio resonance
        cosmicAudio.updateGestureDynamics(data.openFactor, Math.hypot(data.handX, data.handY));

        // Update UI displays
        uiManager.updateGestureDisplay(data.state, data.openFactor);
      }
    }
  });

  // 3. Initialize UI & Event Management
  const uiManager = new UIManager(galaxyEngine, handTracker, cosmicAudio);

  // 4. Main 60 FPS Animation Loop
  function animate() {
    requestAnimationFrame(animate);

    // Update 3D universe
    galaxyEngine.update();

    // Update Telemetry & FPS stats
    uiManager.updateTelemetry();
  }

  animate();
});
