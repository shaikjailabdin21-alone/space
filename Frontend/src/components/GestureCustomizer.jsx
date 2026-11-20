import React from 'react';

export const DEFAULT_GESTURE_MAP = {
  fist: 'fist',
  palm: 'palm',
  point: 'point',
  two_fingers: 'two_fingers',
  pinch: 'pinch',
  both_open: 'both_open',
  both_closed: 'both_closed'
};

export const AVAILABLE_SHAPES = [
  { id: 'palm', label: 'Spiral Galaxy', icon: '✋' },
  { id: 'fist', label: 'Glowing Sphere', icon: '✊' },
  { id: 'point', label: 'Particle Beam', icon: '☝️' },
  { id: 'two_fingers', label: 'Two Rings', icon: '✌️' },
  { id: 'pinch', label: 'Attraction Field', icon: '🤏' },
  { id: 'both_open', label: 'Expanded Universe', icon: '🙌' },
  { id: 'both_closed', label: 'Micro Singularity', icon: '👊' },
  { id: 'cube', label: '3D Hypercube', icon: '🧊' },
  { id: 'pyramid', label: 'Cosmic Pyramid', icon: '🔺' },
  { id: 'star', label: 'Celestial Star', icon: '⭐' },
  { id: 'diamond', label: 'Octahedral Diamond', icon: '💎' },
  { id: 'torus', label: 'Hyperspace Torus', icon: '🍩' },
  { id: 'portal', label: 'Space Portal / Vortex', icon: '🌀' },
  { id: 'solarsystem', label: 'Solar System', icon: '🪐' },
  { id: 'supernova', label: 'Supernova Explosion', icon: '💥' },
  { id: 'energy_ball', label: 'Plasma Energy Ball', icon: '⚡' }
];

const GESTURE_LABELS = {
  fist: { name: 'Closed Fist', icon: '✊' },
  palm: { name: 'Open Palm', icon: '✋' },
  point: { name: 'One Finger Pointing', icon: '☝️' },
  two_fingers: { name: 'Two Fingers Raised', icon: '✌️' },
  pinch: { name: 'Pinch Fingers', icon: '🤏' },
  both_open: { name: 'Both Hands Open', icon: '🙌' },
  both_closed: { name: 'Both Hands Closed', icon: '👊' }
};

export const GestureCustomizer = ({
  isOpen = false,
  onClose,
  mapping = DEFAULT_GESTURE_MAP,
  onUpdateMapping
}) => {
  if (!isOpen) return null;

  const handleChange = (gestureKey, newShape) => {
    const updated = { ...mapping, [gestureKey]: newShape };
    onUpdateMapping(updated);
    try {
      localStorage.setItem('galaxy_gesture_map', JSON.stringify(updated));
    } catch (e) {}
  };

  const handleReset = () => {
    onUpdateMapping(DEFAULT_GESTURE_MAP);
    try {
      localStorage.removeItem('galaxy_gesture_map');
    } catch (e) {}
  };

  return (
    <div className="customizer-modal-backdrop" onClick={onClose}>
      <div className="customizer-modal-content interactive" onClick={(e) => e.stopPropagation()}>
        <div className="customizer-header">
          <div className="customizer-title-row">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
            <h2>GESTURE-TO-FORMATION MAPPING</h2>
          </div>
          <button className="customizer-close-btn" onClick={onClose}>&times;</button>
        </div>

        <p className="customizer-description">
          Customize which 3D cosmic formation or effect is triggered when your webcam detects each hand pose.
        </p>

        <div className="customizer-list">
          {Object.keys(GESTURE_LABELS).map((gestureKey) => {
            const currentShape = mapping[gestureKey] || gestureKey;
            const meta = GESTURE_LABELS[gestureKey];

            return (
              <div key={gestureKey} className="customizer-row">
                <div className="customizer-gesture-info">
                  <span className="gesture-icon">{meta.icon}</span>
                  <span className="gesture-name">{meta.name}</span>
                </div>

                <div className="customizer-arrow">→</div>

                <div className="customizer-select-wrap">
                  <select
                    className="customizer-select"
                    value={currentShape}
                    onChange={(e) => handleChange(gestureKey, e.target.value)}
                  >
                    {AVAILABLE_SHAPES.map((shape) => (
                      <option key={shape.id} value={shape.id}>
                        {shape.icon} {shape.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>

        <div className="customizer-footer">
          <button className="customizer-btn reset" onClick={handleReset}>
            Reset to Defaults
          </button>
          <button className="customizer-btn save" onClick={onClose}>
            Done & Apply
          </button>
        </div>
      </div>
    </div>
  );
};
