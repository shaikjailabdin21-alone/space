import React from 'react';

const ICONS = {
  fist: '✊',
  palm: '✋',
  point: '☝️',
  two_fingers: '✌️',
  pinch: '🤏',
  both_open: '🙌',
  both_closed: '👊',
  cube: '🧊',
  pyramid: '🔺',
  star: '⭐',
  diamond: '💎',
  torus: '🍩',
  portal: '🌀',
  solarsystem: '🪐',
  supernova: '💥',
  energy_ball: '⚡'
};

export const GestureHistory = ({ history = [] }) => {
  if (!history || history.length === 0) return null;

  return (
    <div className="gesture-history-container interactive">
      <div className="history-label">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
        <span>GESTURE TIMELINE</span>
      </div>
      <div className="history-chips">
        {history.slice(-6).map((item, index) => {
          const isLatest = index === history.slice(-6).length - 1;
          const icon = ICONS[item.gesture] || '✋';
          return (
            <div
              key={item.id || index}
              className={`history-chip ${isLatest ? 'latest' : ''}`}
              title={`${item.gesture.toUpperCase()} detected at ${item.time}`}
            >
              <span className="chip-time">{item.time}</span>
              <span className="chip-icon">{icon}</span>
              <span className="chip-name">{item.gesture.toUpperCase()}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
