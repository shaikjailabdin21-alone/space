import React, { useState } from 'react';
import { AIGestureAssistant } from './AIGestureAssistant';
import { GestureHistory } from './GestureHistory';
import { GestureCustomizer, DEFAULT_GESTURE_MAP } from './GestureCustomizer';

const GESTURE_INFO = {
  palm: { label: 'OPEN PALM', shape: 'SPIRAL GALAXY', icon: '✋' },
  fist: { label: 'CLOSED FIST', shape: '3D SPHERE', icon: '✊' },
  point: { label: 'ONE FINGER', shape: 'PARTICLE BEAM', icon: '☝️' },
  two_fingers: { label: 'TWO FINGERS', shape: 'TWO RINGS', icon: '✌️' },
  three_fingers: { label: 'THREE FINGERS', shape: 'THREE RINGS', icon: '🤟' },
  four_fingers: { label: 'FOUR FINGERS', shape: 'FOUR RINGS', icon: '🖖' },
  pinch: { label: 'PINCH', shape: 'ATTRACTION FIELD', icon: '🤏' },
  both_open: { label: 'BOTH OPEN', shape: 'EXPANDED GALAXY', icon: '🙌' },
  both_closed: { label: 'BOTH CLOSED', shape: 'COMPRESSED CORE', icon: '👊' },
  cube: { label: 'HYPERCUBE', shape: '3D CUBE LATTICE', icon: '🧊' },
  pyramid: { label: 'PYRAMID', shape: 'COSMIC TETRAHEDRON', icon: '🔺' },
  star: { label: 'STAR', shape: 'CELESTIAL STAR', icon: '⭐' },
  diamond: { label: 'DIAMOND', shape: 'OCTAHEDRAL CRYSTAL', icon: '💎' },
  torus: { label: 'TORUS', shape: 'HYPERSPACE DONUT', icon: '🍩' },
  portal: { label: 'SPACE PORTAL', shape: 'WORMHOLE VORTEX', icon: '🌀' },
  solarsystem: { label: 'SOLAR SYSTEM', shape: '8 ORBITING PLANETS', icon: '🪐' },
  supernova: { label: 'SUPERNOVA', shape: 'COSMIC DETONATION', icon: '💥' },
  energy_ball: { label: 'ENERGY BALL', shape: 'PLASMA ENERGY ORB', icon: '⚡' }
};

export const ControlPanel = ({
  fps = 60,
  gesture = 'palm',
  openFactor = 1.0,
  moveDirection = 'CENTER',
  onNavigate,
  theme = 'cyber-neon',
  onThemeChange,
  onGestureSelect,
  cameraActive = false,
  onToggleCamera,
  audioMuted = false,
  onToggleAudio,
  mouseModeActive = false,
  onToggleMouseMode,
  onReset,
  sensitivity = 1.0,
  onSensitivityChange,
  showIntro = true,
  onStartExperience,
  toastMessage = '',
  // Advanced Features Props
  isHandDetected = false,
  numHands = 1,
  confidence = 98.5,
  gestureHistory = [],
  gravityMode = 'off',
  onGravityChange,
  showLandmarkVisualizer = false,
  onToggleLandmarkVisualizer,
  onCaptureScreenshot,
  onTriggerSupernova,
  isSolarSystemActive = false,
  onToggleSolarSystem,
  isPortalActive = false,
  onTogglePortal,
  isEnergyBallActive = false,
  onToggleEnergyBall,
  gestureMapping = DEFAULT_GESTURE_MAP,
  onUpdateGestureMapping
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const currentInfo = GESTURE_INFO[gesture] || GESTURE_INFO.palm;

  const getDirectionText = () => {
    switch (moveDirection) {
      case 'RIGHT': return 'MOVE RIGHT ▶';
      case 'LEFT': return '◀ MOVE LEFT';
      case 'UP': return '▲ MOVE UP';
      case 'DOWN': return '▼ MOVE DOWN';
      default: return '⊙ CENTERED';
    }
  };

  const handleNextGravityMode = () => {
    const modes = ['off', 'attract', 'repel', 'orbit'];
    const nextIdx = (modes.indexOf(gravityMode) + 1) % modes.length;
    onGravityChange?.(modes[nextIdx]);
  };

  return (
    <>
      {/* Toast Notice */}
      <div className={`toast-notice ${toastMessage ? 'show' : ''}`}>
        {toastMessage}
      </div>

      {/* 4-Direction Screen Perimeter Spatial Indicators */}
      <div className={`screen-edge-indicator edge-top ${moveDirection === 'UP' ? 'active' : ''}`}>
        <span>▲ MOVING UP</span>
      </div>
      <div className={`screen-edge-indicator edge-bottom ${moveDirection === 'DOWN' ? 'active' : ''}`}>
        <span>▼ MOVING DOWN</span>
      </div>
      <div className={`screen-edge-indicator edge-left ${moveDirection === 'LEFT' ? 'active' : ''}`}>
        <span>◀ MOVING LEFT</span>
      </div>
      <div className={`screen-edge-indicator edge-right ${moveDirection === 'RIGHT' ? 'active' : ''}`}>
        <span>MOVING RIGHT ▶</span>
      </div>

      {/* HUD Layer */}
      <div className="hud-layer">
        {/* Top Header */}
        <header className="top-bar">
          <div className="brand-section">
            <div className="title-row">
              <svg className="galaxy-logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" fill="currentColor"/>
                <path d="M12 2C6.48 2 2 6.48 2 12c0 2.5 1 4.7 2.6 6.4"/>
                <path d="M22 12c0-5.52-4.48-10-10-10"/>
                <path d="M12 22c5.52 0 10-4.48 10-10 0-2.5-1-4.7-2.6-6.4"/>
                <path d="M2 12c0 5.52 4.48 10 10 10"/>
              </svg>
              <h1 className="hud-title">CHRONOS // GALAXY</h1>
            </div>
            <div className="hud-subtitle">
              <span className="status-dot"></span>
              <span>Advanced AI Hand Recognition & Cosmic Universe Simulation</span>
            </div>
          </div>

          <div className="top-stats">
            <div className="hud-card">
              <span className="card-label">Cosmic Particles</span>
              <span className="card-value">75,000 STARS</span>
            </div>

            <div className="hud-card purple">
              <span className="card-label">Active Formation</span>
              <span className="card-value">{currentInfo.shape}</span>
            </div>

            <div className="hud-card emerald">
              <span className="card-label">Galaxy Motion</span>
              <span
                className="card-value"
                style={{
                  color: moveDirection === 'CENTER' ? '#94a3b8' : '#38bdf8',
                  textShadow: moveDirection !== 'CENTER' ? '0 0 10px rgba(56, 189, 248, 0.7)' : 'none'
                }}
              >
                {getDirectionText()}
              </span>
            </div>

            <div className="hud-card pink gesture-indicator-card">
              <span className="card-label">Detected Pose</span>
              <div className={`gesture-pill ${gesture}`}>
                <span>{currentInfo.icon} {currentInfo.label}</span>
              </div>
              <div className="gesture-progress-bar">
                <div className="gesture-progress-fill" style={{ width: `${Math.round(openFactor * 100)}%` }} />
              </div>
            </div>

            <div className="hud-card">
              <span className="card-label">Engine FPS</span>
              <span className="card-value">{fps} FPS</span>
            </div>
          </div>
        </header>

        {/* Feature 10: AI Gesture Assistant Floating Card */}
        <AIGestureAssistant
          gesture={gesture}
          isHandDetected={isHandDetected}
          confidence={confidence}
          numHands={numHands}
        />

        {/* Feature 15: Real-time Gesture History Strip */}
        <GestureHistory history={gestureHistory} />

        {/* Bottom Control Dock, Spatial D-Pad & Legend */}
        <footer className="bottom-bar">
          <div className="camera-slot" id="camera-slot">
            {/* HandTracking camera component is positioned here */}
          </div>

          <div className="control-dock interactive">
            <button
              className={`hud-btn ${cameraActive ? 'active' : ''}`}
              onClick={onToggleCamera}
              title="Toggle Webcam Hand Tracking"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              <span className="btn-text">Camera</span>
            </button>

            {/* Feature 12: Hand Tracking Visualizer Toggle */}
            <button
              className={`hud-btn ${showLandmarkVisualizer ? 'active' : ''}`}
              onClick={onToggleLandmarkVisualizer}
              title="Toggle 21 Hand Landmarks Visualizer"
            >
              <span style={{ fontSize: '1.1rem' }}>👁️</span>
              <span className="btn-text">21 Joints</span>
            </button>

            {/* Feature 4: Gravity Control Toggle */}
            <button
              className={`hud-btn ${gravityMode !== 'off' ? 'active' : ''}`}
              onClick={handleNextGravityMode}
              title="Toggle Gravity Mode: Attract / Repel / Orbit / Off"
            >
              <span style={{ fontSize: '1.1rem' }}>🧲</span>
              <span className="btn-text">Grav: {gravityMode.toUpperCase()}</span>
            </button>

            {/* Feature 9: Supernova Trigger Button */}
            <button
              className="hud-btn supernova-btn"
              onClick={onTriggerSupernova}
              title="Trigger Supernova Thermonuclear Explosion"
            >
              <span style={{ fontSize: '1.1rem' }}>💥</span>
              <span className="btn-text">Supernova</span>
            </button>

            {/* Feature 7: Solar System Mode Toggle */}
            <button
              className={`hud-btn ${isSolarSystemActive || gesture === 'solarsystem' ? 'active' : ''}`}
              onClick={onToggleSolarSystem}
              title="Toggle 3D Solar System Mode"
            >
              <span style={{ fontSize: '1.1rem' }}>🪐</span>
              <span className="btn-text">Solar</span>
            </button>

            {/* Feature 8: Space Portal Toggle */}
            <button
              className={`hud-btn ${isPortalActive || gesture === 'portal' ? 'active' : ''}`}
              onClick={onTogglePortal}
              title="Toggle Space Portal Wormhole Vortex"
            >
              <span style={{ fontSize: '1.1rem' }}>🌀</span>
              <span className="btn-text">Portal</span>
            </button>

            {/* Feature 3: Energy Ball Toggle */}
            <button
              className={`hud-btn ${isEnergyBallActive || gesture === 'energy_ball' ? 'active' : ''}`}
              onClick={onToggleEnergyBall}
              title="Toggle Plasma Energy Ball Effect"
            >
              <span style={{ fontSize: '1.1rem' }}>⚡</span>
              <span className="btn-text">Energy Ball</span>
            </button>

            {/* Feature 14: Screenshot Capture Button */}
            <button
              className="hud-btn"
              onClick={onCaptureScreenshot}
              title="Capture High-Res Galaxy Screenshot"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <span className="btn-text">Capture</span>
            </button>

            <button
              className={`hud-btn ${!audioMuted ? 'active' : ''}`}
              onClick={onToggleAudio}
              title="Toggle Procedural Cosmic Audio"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
              </svg>
              <span className="btn-text">Audio</span>
            </button>

            {/* Feature 11: Gesture Customizer Modal Open */}
            <button
              className="hud-btn"
              onClick={() => setCustomizerOpen(true)}
              title="Customize Gesture-to-Shape Mappings"
            >
              <span style={{ fontSize: '1.1rem' }}>⚙️</span>
              <span className="btn-text">Remap</span>
            </button>

            <button
              className="hud-btn"
              onClick={onReset}
              title="Recalibrate Universe View"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
              </svg>
              <span className="btn-text">Reset</span>
            </button>

            <button
              className="hud-btn"
              onClick={() => setDrawerOpen(!drawerOpen)}
              title="Cosmic Shapes & Geometric Formations"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
              <span className="btn-text">Shapes</span>
            </button>
          </div>

          {/* Spatial Nav Direction Steering Pad */}
          <div className="spatial-nav-pad interactive" title="Steer Galaxy (Click or use Arrow Keys / Hand Motion)">
            <button
              className={`nav-pad-btn up ${moveDirection === 'UP' ? 'active' : ''}`}
              onClick={() => onNavigate?.('UP')}
              title="Steer Galaxy Up (Up Arrow / W)"
            >
              ▲
            </button>
            <div className="nav-pad-row">
              <button
                className={`nav-pad-btn left ${moveDirection === 'LEFT' ? 'active' : ''}`}
                onClick={() => onNavigate?.('LEFT')}
                title="Steer Galaxy Left (Left Arrow / A)"
              >
                ◀
              </button>
              <button
                className={`nav-pad-btn center ${moveDirection === 'CENTER' ? 'active' : ''}`}
                onClick={() => onNavigate?.('CENTER')}
                title="Center Galaxy (Reset Origin)"
              >
                ⊙
              </button>
              <button
                className={`nav-pad-btn right ${moveDirection === 'RIGHT' ? 'active' : ''}`}
                onClick={() => onNavigate?.('RIGHT')}
                title="Steer Galaxy Right (Right Arrow / D)"
              >
                ▶
              </button>
            </div>
            <button
              className={`nav-pad-btn down ${moveDirection === 'DOWN' ? 'active' : ''}`}
              onClick={() => onNavigate?.('DOWN')}
              title="Steer Galaxy Down (Down Arrow / S)"
            >
              ▼
            </button>
          </div>

          {/* Right Legend: Hand Gesture & Spatial Guide */}
          <div className="legend-card">
            <div className="legend-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              <span>Controls & Motion</span>
            </div>
            <div className="legend-item">
              <div className="legend-icon-badge">▶</div>
              <div><strong>Move Right</strong> → Pan Galaxy Right</div>
            </div>
            <div className="legend-item">
              <div className="legend-icon-badge">◀</div>
              <div><strong>Move Left</strong> → Pan Galaxy Left</div>
            </div>
            <div className="legend-item">
              <div className="legend-icon-badge">▲</div>
              <div><strong>Move Up</strong> → Elevate Galaxy Up</div>
            </div>
            <div className="legend-item">
              <div className="legend-icon-badge">▼</div>
              <div><strong>Move Down</strong> → Lower Galaxy Down</div>
            </div>
            <div className="legend-item">
              <div className="legend-icon-badge pink">✊</div>
              <div><strong>Fist / Palm</strong> → Sphere / Galaxy</div>
            </div>
          </div>
        </footer>
      </div>

      {/* Feature 11: Gesture Customizer Modal */}
      <GestureCustomizer
        isOpen={customizerOpen}
        onClose={() => setCustomizerOpen(false)}
        mapping={gestureMapping}
        onUpdateMapping={onUpdateGestureMapping}
      />

      {/* Settings Drawer Flyout */}
      <aside className={`settings-drawer ${drawerOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <span className="drawer-title">Cosmic Customizer</span>
          <button className="drawer-close" onClick={() => setDrawerOpen(false)}>&times;</button>
        </div>

        {/* Feature 5: Gesture Shape Creator & Geometric Formations */}
        <div className="setting-group">
          <div className="setting-label">
            <span>Cosmic & Geometric Formations</span>
          </div>
          <div className="formation-chips" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            {Object.entries(GESTURE_INFO).map(([key, info]) => (
              <button
                key={key}
                className={`chip-btn ${gesture === key ? 'active' : ''}`}
                onClick={() => onGestureSelect?.(key)}
                style={{ textAlign: 'left', padding: '7px 8px', fontSize: '0.68rem' }}
              >
                {info.icon} <strong>{info.label}</strong>
              </button>
            ))}
          </div>
        </div>

        <div className="setting-group">
          <div className="setting-label">
            <span>Nebula Theme</span>
          </div>
          <div className="theme-options">
            {['cyber-neon', 'cosmic-violet', 'solar-gold', 'deep-emerald'].map((t) => (
              <button
                key={t}
                className={`theme-btn ${t} ${theme === t ? 'active' : ''}`}
                onClick={() => onThemeChange?.(t)}
                title={t}
              />
            ))}
          </div>
        </div>

        <div className="setting-group">
          <div className="setting-label">
            <span>Hand Sensitivity</span>
            <span className="val">{sensitivity.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={sensitivity}
            onChange={(e) => onSensitivityChange?.(parseFloat(e.target.value))}
          />
        </div>

        <div className="setting-group">
          <div className="setting-label">
            <span>Controls & Shortcuts</span>
          </div>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            • <strong style={{ color: 'var(--neon-cyan)' }}>[ARROW KEYS / WASD]</strong>: Pan and tilt 3D galaxy<br />
            • <strong style={{ color: 'var(--neon-cyan)' }}>[KEYS 1 - 7]</strong>: Test primary hand shapes<br />
            • <strong style={{ color: 'var(--neon-cyan)' }}>[KEY P]</strong>: Capture high-res screenshot
          </p>
        </div>
      </aside>

      {/* Intro Modal Overlay */}
      {showIntro && (
        <div className="intro-modal">
          <div className="intro-card interactive">
            <div className="intro-badge">NEURAL SPATIAL ENGINE v3.0</div>
            <h2 className="intro-title">CHRONOS // GALAXY UNIVERSE</h2>
            <p className="intro-desc">
              Control 75,000 glowing cosmic stars in real-time 3D space with your physical hands. Experience AI gesture recognition, independent finger sculpting, plasma energy balls, solar system mode, space wormholes, and supernova explosions.
            </p>

            <div className="features-grid">
              <div className="feature-item">
                <span className="feature-icon">✊</span>
                <div>
                  <strong>Closed Fist</strong>
                  <p>Coalesce particles into a 3D Glowing Sphere</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">✋</span>
                <div>
                  <strong>Open Palm</strong>
                  <p>Explode particles into a Spiral Galaxy</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">☝️</span>
                <div>
                  <strong>One Finger</strong>
                  <p>Channel a concentrated Particle Beam</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">✌️</span>
                <div>
                  <strong>Two Fingers</strong>
                  <p>Form two rotating Gyroscopic Rings</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🤏</span>
                <div>
                  <strong>Pinch</strong>
                  <p>Contract particles into a Magnetic Field</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🙌</span>
                <div>
                  <strong>Both Hands Open</strong>
                  <p>Super-expand the entire Universe</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">↔️</span>
                <div>
                  <strong>Spatial Motion</strong>
                  <p>Move Hand Right, Left, Up, Down to fly through space</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🪐</span>
                <div>
                  <strong>Solar & Portal</strong>
                  <p>Explore 8 orbiting planets and wormholes</p>
                </div>
              </div>
            </div>

            <button className="start-btn" onClick={onStartExperience}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              <span>INITIALIZE UNIVERSE</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
export default ControlPanel;
