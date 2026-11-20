import React from 'react';

const GESTURE_DESCRIPTIONS = {
  fist: {
    title: 'Closed Fist',
    intent: 'Starlight Singularity Stabilized • 75,000 Stars Compressed',
    suggestion: 'Open your palm to detonate into a Spiral Galaxy'
  },
  palm: {
    title: 'Open Palm',
    intent: 'Logarithmic Spiral Galaxy Dispersed • Differential Rotation Active',
    suggestion: 'Point index finger forward to shoot a Particle Beam'
  },
  point: {
    title: 'One Finger Pointing',
    intent: 'Collimated Laser Beam Streaming along Pointer Vector',
    suggestion: 'Raise two fingers (peace sign) to form Dual Gyroscopic Rings'
  },
  two_fingers: {
    title: 'Two Fingers Raised',
    intent: 'Dual Rotating Gyroscopic Rings on Orthogonal Axes',
    suggestion: 'Pinch thumb and index finger to create Magnetic Attraction Field'
  },
  pinch: {
    title: 'Pinch Gesture',
    intent: 'Magnetic Attraction Field Active • Stars Pulled to Focal Point',
    suggestion: 'Open both hands to trigger Cosmic Galaxy Expansion'
  },
  both_open: {
    title: 'Both Hands Open',
    intent: 'Super-Expanded Universe • Deep Volumetric Cosmic Burst',
    suggestion: 'Close both hands into fists to compress into Micro-Singularity'
  },
  both_closed: {
    title: 'Both Hands Closed',
    intent: 'Hyper-Dense Singularity Core • Gravitational Collapse',
    suggestion: 'Open palms to release starlight across 3D space'
  },
  cube: {
    title: 'Geometric Hypercube',
    intent: '3D Cosmic Lattice Matrix Multiaxial Rotation',
    suggestion: 'Select Pyramid or Diamond from the Shapes menu'
  },
  pyramid: {
    title: 'Cosmic Pyramid',
    intent: '4-Sided Sacred Geometry Formation Active',
    suggestion: 'Switch to Celestial Star or Space Portal'
  },
  star: {
    title: '3D Celestial Star',
    intent: '5-Pointed Stellated Polyhedron Orbiting in Space',
    suggestion: 'Try Supernova or Solar System mode'
  },
  diamond: {
    title: 'Octahedral Diamond',
    intent: 'Gemstone Crystal Matrix Refracting Starlight',
    suggestion: 'Open palm to return to Spiral Galaxy'
  },
  torus: {
    title: 'Hyperspace Torus',
    intent: 'Cosmic Donut Ring with Dual Orbital Harmonics',
    suggestion: 'Enter Space Portal for Wormhole vortex'
  },
  portal: {
    title: 'Space Portal / Wormhole',
    intent: 'Einstein-Rosen Bridge Active • Relativistic Accretion Vortex',
    suggestion: 'Trigger Supernova explosion for cosmic fireworks'
  },
  solarsystem: {
    title: 'Solar System Mode',
    intent: 'Sun Corona Radiating • 8 Planetary Bodies Orbiting',
    suggestion: 'Use hand movement to pan camera around planets'
  },
  supernova: {
    title: 'Supernova Explosion',
    intent: 'Thermonuclear Shockwave Expanding across Space',
    suggestion: 'Close hand to gather remaining stardust into a sphere'
  },
  energy_ball: {
    title: 'Plasma Energy Ball',
    intent: 'Interactive Plasma Orb Swirling between Hands',
    suggestion: 'Bring hands closer together to compress the energy'
  }
};

export const AIGestureAssistant = ({
  gesture = 'palm',
  isHandDetected = false,
  confidence = 98.5,
  numHands = 1
}) => {
  const currentInfo = GESTURE_DESCRIPTIONS[gesture] || GESTURE_DESCRIPTIONS.palm;

  return (
    <div className="ai-assistant-card interactive">
      <div className="ai-header">
        <div className="ai-badge">
          <span className="ai-pulse-dot"></span>
          <span>AI GESTURE ASSISTANT</span>
        </div>
        <span className="ai-confidence">
          {isHandDetected ? `${confidence.toFixed(1)}% CONFIDENCE` : 'SEARCHING HANDS...'}
        </span>
      </div>

      <div className="ai-body">
        <div className="ai-detected-row">
          <span className="ai-detected-label">DETECTED POSE:</span>
          <span className="ai-detected-name">{currentInfo.title.toUpperCase()}</span>
          {numHands === 2 && <span className="ai-dual-badge">DUAL-HAND</span>}
        </div>

        <div className="ai-intent-text">
          ✦ {currentInfo.intent}
        </div>

        <div className="ai-suggestion-row">
          <span className="ai-suggestion-tag">TIP</span>
          <span className="ai-suggestion-text">{currentInfo.suggestion}</span>
        </div>
      </div>
    </div>
  );
};
