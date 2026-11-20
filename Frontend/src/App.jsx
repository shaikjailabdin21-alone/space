import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GalaxyScene } from './components/GalaxyScene';
import { HandTracking } from './components/HandTracking';
import './App.css';

export function App() {
  // Core gesture + position state (drives the galaxy)
  const [currentGesture, setCurrentGesture] = useState('palm');
  const [handOffset, setHandOffset] = useState({ x: 0, y: 0, z: 1.0 });
  const [isHandDetected, setIsHandDetected] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null); // null | 'denied' | 'unavailable'

  // Smooth return-to-center when no hand detected
  const returnTimerRef = useRef(null);
  const lastOffsetRef = useRef({ x: 0, y: 0, z: 1.0 });

  // Auto-activate camera after a short delay (gives scene time to render first)
  useEffect(() => {
    const t = setTimeout(() => setCameraActive(true), 800);
    return () => clearTimeout(t);
  }, []);

  // When hand disappears, smoothly return galaxy to center
  useEffect(() => {
    if (!isHandDetected) {
      returnTimerRef.current = setInterval(() => {
        setHandOffset(prev => {
          const nx = prev.x * 0.88;
          const ny = prev.y * 0.88;
          const nz = prev.z + (1.0 - prev.z) * 0.08;
          lastOffsetRef.current = { x: nx, y: ny, z: nz };
          if (Math.abs(nx) < 0.005 && Math.abs(ny) < 0.005 && Math.abs(nz - 1.0) < 0.005) {
            clearInterval(returnTimerRef.current);
            return { x: 0, y: 0, z: 1.0 };
          }
          return { x: nx, y: ny, z: nz };
        });
      }, 16);
    } else {
      clearInterval(returnTimerRef.current);
    }
    return () => clearInterval(returnTimerRef.current);
  }, [isHandDetected]);

  // Gesture callback — maps raw gestures to galaxy formations
  const handleGestureChange = useCallback((rawGesture) => {
    // Map gestures to galaxy states
    const gestureMap = {
      palm: 'palm',
      fist: 'fist',
      point: 'point',
      two_fingers: 'two_fingers',
      three_fingers: 'three_fingers',
      four_fingers: 'four_fingers',
      pinch: 'pinch',
      both_open: 'both_open',
      both_closed: 'both_closed',
    };
    setCurrentGesture(gestureMap[rawGesture] || 'palm');
  }, []);

  // Tracking data callback — position, zoom, hand presence
  const handleTrackingData = useCallback((data) => {
    setIsHandDetected(data.isHandDetected);

    if (data.isHandDetected) {
      setHandOffset({
        x: data.handX,
        y: data.handY,
        z: data.handZoom,
      });
      lastOffsetRef.current = { x: data.handX, y: data.handY, z: data.handZoom };
    }
  }, []);

  // Camera error callback from HandTracking
  const handleCameraError = useCallback((errorType) => {
    setCameraError(errorType);
  }, []);

  // Retry camera
  const handleRetryCamera = useCallback(() => {
    setCameraError(null);
    setCameraActive(false);
    setTimeout(() => setCameraActive(true), 150);
  }, []);

  return (
    <div className="galaxy-app">
      {/* Full-screen 3D Galaxy — always visible */}
      <GalaxyScene
        gesture={currentGesture}
        handOffset={handOffset}
      />

      {/* Tiny webcam feed with hand skeleton — bottom-right corner */}
      <div className="cam-corner">
        <HandTracking
          isActive={cameraActive}
          onGestureChange={handleGestureChange}
          onTrackingData={handleTrackingData}
          onCameraError={handleCameraError}
          sensitivity={1.0}
        />
      </div>

      {/* Minimal status badge — top-right */}
      <div className={`hand-status-badge ${isHandDetected ? 'detected' : ''}`}>
        <span className="status-dot-pulse" />
        <span>
          {isHandDetected
            ? (currentGesture === 'three_fingers' ? '3 RINGS' :
               currentGesture === 'four_fingers' ? '4 RINGS' :
               currentGesture === 'two_fingers' ? '2 RINGS' :
               currentGesture === 'point' ? 'BEAM' :
               currentGesture === 'fist' ? 'SPHERE' :
               currentGesture === 'pinch' ? 'PINCH' :
               currentGesture === 'both_open' ? 'EXPAND' :
               currentGesture === 'both_closed' ? 'COMPRESS' :
               'HAND DETECTED')
            : 'SHOW YOUR HAND'}
        </span>
      </div>

      {/* Camera denied overlay — centred, dismissable */}
      {cameraError && (
        <div className="cam-error-overlay">
          <div className="cam-error-card">
            <div className="cam-error-icon">{cameraError === 'denied' ? '🚫' : '📷'}</div>
            <p>
              {cameraError === 'denied'
                ? 'Camera permission denied.\nAllow camera access in your browser settings, then retry.'
                : 'No camera found on this device.'}
            </p>
            {cameraError === 'denied' && (
              <button className="cam-retry-btn" onClick={handleRetryCamera}>
                ↺ Retry Camera
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
