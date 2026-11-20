# CHRONOS // 3D Interactive Galaxy – Control the Universe with Your Hands

An interactive, futuristic 3D Galaxy web application built with **Three.js**, **MediaPipe Hands**, **Web Audio API**, and **HTML5/CSS3**.

Control thousands of glowing stars with your real human hands using your webcam:
- ✊ **Close your hand into a fist**: Harness and gather all 75,000 scattered stars toward the center, forming a dense, hyper-energetic glowing 3D spherical singularity.
- ✋ **Open your hand into a palm**: Unleash a cosmic explosion, scattering the particles into a majestic logarithmic spiral galaxy with differential orbital rotation.
- ↔️ **Move hand left / right / up / down**: Seamlessly steer, pan, and tilt the universe in real-time 3D space.
- 🔍 **Move hand closer / further (Depth)**: Dynamically zoom in and out of the galaxy.

---

## 🌟 Key Features

1. **Massive GPU Particle System (75,000 Stars)**
   - Custom GLSL vertex and fragment shaders with additive blending (`THREE.AdditiveBlending`).
   - S-curve morphing between Fibonacci spherical shells and multi-arm logarithmic spiral galaxy formations.
   - Realistic differential galactic rotation curve (stars near the galactic bulge rotate faster than outer spiral arms).
   - High-energy coronal plasma turbulence, pulsating central core sprite, and twinkling star modulation.
   - Distant deep-space background starfield (6,000 stars) for infinite visual depth.

2. **Real-Time AI Hand Detection (MediaPipe Hands)**
   - Tracks 21 3D hand landmarks at 60 FPS using your webcam.
   - Computes continuous `openFactor` (0.0 to 1.0) based on normalized 3D fingertip-to-palm and fingertip-to-wrist ratios.
   - Real-time PiP webcam HUD with mirrored view, scanlines, and neon skeleton overlays.
   - Continuous gesture mapping: smoothly closes into a sphere as your fingers curl, and blossoms into a spiral galaxy as your fingers spread.

3. **Procedural Cosmic Audio Synthesizer (Web Audio API)**
   - No external audio files required — 100% synthesized in-browser with zero latency.
   - Ambient detuned dual-oscillator space drone with low-pass resonance.
   - Energetic tension hum during singularity collapse (pitch rises as fist tightens).
   - Expansive crystalline pentatonic chime chords and sub-bass impact upon galaxy explosion.

4. **Futuristic Cyberpunk HUD & Controls**
   - Telemetry cards displaying real-time FPS, star count, universe state, and live hand open/close progress.
   - Quick toolbar: Camera Toggle, Reset Universe, Cosmic Audio Mute/Unmute, Mouse Mode Fallback, and Nebula Themes.
   - 4 Cosmic Nebula Themes:
     - **Cyber Neon**: Electric cyan, sky blue, and ultraviolet.
     - **Cosmic Violet**: Deep pink, magenta, and indigo.
     - **Solar Flare**: Blazing amber, golden core, and coronal orange.
     - **Emerald Nebula**: Mint green, vibrant emerald, and cyan.
   - Mouse & Keyboard Fallback:
     - Move mouse to steer universe.
     - Click & hold (or press `[SPACEBAR]`) to compress into sphere; release to explode.

---

## 🚀 How to Run

1. Open a terminal in the project directory:
   ```bash
   python3 -m http.server 8080
   ```
2. Open your browser and navigate to:
   ```
   http://localhost:8080
   ```
3. Click **"Initialize Universe"** to begin. Allow camera access when prompted by the browser.
4. Hold your hand in front of your camera and command the cosmos!

---

## 📁 Project Architecture

```
stars/
├── index.html           # Futuristic HTML5 shell, PiP HUD, modals, and telemetry
├── css/
│   └── style.css        # Cyberpunk glassmorphic styling, neon glows, responsive layout
├── js/
│   ├── main.js          # Main application orchestrator & 60 FPS animation loop
│   ├── galaxy.js        # Three.js scene, custom GLSL shaders, galaxy & sphere math
│   ├── handTracker.js   # MediaPipe Hands tracking, 21-joint skeleton, gesture classifier
│   ├── audio.js         # Web Audio API procedural synthesizer & sound effects
│   └── ui.js            # HUD updates, telemetry, theme manager, and mouse fallback
└── README.md            # Documentation and instructions
```
