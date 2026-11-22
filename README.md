# CHRONOS // Instant Real-Time Hand Shape Recognition 3D Galaxy (React + Vite)

A futuristic 3D Galaxy universe of 75,000 glowing stars that **instantly transforms in real-time according to the actual shape of your hands** detected by your webcam using MediaPipe Hand Landmarker.

---

## 🖐️ Real-Time Hand Shape Formations & Spatial Navigation

Whatever hand shape the camera detects, the 75,000 stars immediately transform into the corresponding visual formation:

| Hand Pose Detected | 3D Star Universe Transformation | Visual Behavior |
| :--- | :--- | :--- |
| ✋ **Open Palm** | **Galaxy** | Stars form a multi-arm logarithmic spiral galaxy. |
| ✊ **Closed Fist** | **3D Ball** | Stars gather into a glowing volumetric sphere. |
| ☝️ **One Index Finger Pointing Up** | **Particle Beam** | Stars form a directional beam. |
| 🫱 **Index and Middle Fingertips Joined** | **Worm** | A flexible, glowing particle body follows hand movement. |
| ✌️ **Two Fingers** | **Two Rings** | Stars form two orbital rings. |
| 🤏 **Pinch** | **Pinch Field** | Stars gather around the hand. |
| 👐 **Both Hands Open** | **Expanded Galaxy** | The galaxy spreads outward. |
| ✊ **Both Hands Closed** | **Compressed Core** | Stars gather into a dense core. |

### 🚀 3D Spatial Navigation (Move Right, Left, Up, Down)

In addition to hand shape recognition, your hand position in space dynamically maneuvers the entire galaxy:
- **Move Hand Right**: The galaxy pans right (`targetX = +85 units`) and the 3D camera glides with dynamic perspective parallax.
- **Move Hand Left**: The galaxy pans left (`targetX = -85 units`).
- **Move Hand Up**: The galaxy elevates and tilts upward (`targetY = +58 units`).
- **Move Hand Down**: The galaxy lowers and tilts downward (`targetY = -58 units`).
- **Depth / Zoom**: Moving your hand closer to or farther from the lens zooms through the star field.
- **Continuous Steering**: Holding your hand to either side continuously orbits the galaxy in that direction.
- **Screen Perimeter Indicators**: Glowing HUD halos illuminate at the edge of the screen indicating active flight vector (`▲ UP`, `▼ DOWN`, `◀ LEFT`, `RIGHT ▶`).
- **Tactile D-Pad & Keyboard Controls**: You can also steer using the on-screen D-Pad or Arrow Keys / WASD.

---

## ⚡ Performance & Zero-Latency Architecture

- **60 FPS Real-Time AI Vision**: Tracks all 21 3D landmarks per hand at up to 60 FPS using MediaPipe Hand Landmarker via WebRTC.
- **Gesture Stabilization**: Five consistent tracking frames and a short mode-switch cooldown reduce accidental formation changes.
- **Direct GPU Shader Morphing**: All shape transitions occur directly on the GPU using custom GLSL shaders with S-curve interpolation and differential rotation dynamics.
- **Zero-Latency State Synchronization**: Uses `useRef` for high-frequency tracking data to eliminate unnecessary React re-renders, keeping the render loop running smoothly at 60 FPS.
- **Dual-Hand Support**: Tracks both hands for expanded-galaxy and compressed-core gestures.

---

## 🚀 How to Run

1. In the project directory:
   ```bash
   cd /home/jailabdin/stars
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
3. Open the displayed URL in your browser:
   👉 **`http://localhost:3000`**
4. Enable hand tracking, allow webcam access, and use the gestures above to transform the particle formations.

---

## 📁 Project Structure

```
stars/
├── backup_vanilla/               # Original vanilla JS/HTML implementation backup
├── dist/                         # Optimized production build artifacts
├── node_modules/                 # Node.js dependencies
├── package.json                  # Dependencies & scripts
├── package-lock.json             # Exact dependency lockfile
├── vite.config.js                # Vite configuration (root: 'Frontend', outDir: '../dist')
├── README.md                     # Documentation
└── Frontend/                     # Main frontend application folder
    ├── index.html                # Application entry HTML
    └── src/
        ├── main.jsx              # React 18 root mount
        ├── App.jsx               # Central state orchestrator
        ├── App.css               # Futuristic HUD & glassmorphism styling
        ├── index.css             # Global CSS variables & reset
        ├── utils/
        │   └── audioSynthesizer.js   # Procedural Web Audio API sound synthesizer
        └── components/
            ├── ControlPanel.jsx      # HUD telemetry & spatial flight D-Pad
            ├── GalaxyScene.jsx       # Three.js 60 FPS scene & parallax motion
            ├── GalaxyShapes.jsx      # 7 gesture coordinate algorithms & 4 nebula themes
            ├── GestureController.jsx  # Input events & keyboard/mouse fallback
            ├── HandTracking.jsx      # MediaPipe 21-joint landmarker & motion tracking
            ├── MusicController.jsx   # Procedural audio frequency analyzer
            ├── ParticleSystem.jsx    # 75,000 star GPU GLSL shaders & morphing
            ├── ShootingStars.jsx     # Dynamic meteor streaks
```
