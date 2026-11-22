import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GalaxyScene } from './components/GalaxyScene';
import { HandTracking } from './components/HandTracking';
import './App.css';

const MODE_LABELS = {
  palm: 'GALAXY', fist: '3D BALL', point: 'PARTICLE BEAM',
  two_fingers: 'TWO RINGS', three_fingers: 'THREE RINGS',
  four_fingers: 'FOUR RINGS', pinch: 'PINCH FIELD',
  both_open: 'EXPANDED GALAXY', both_closed: 'COMPRESSED CORE', worm: 'LIVING WORM'
};

export function App() {
  const [mode, setMode] = useState('palm');
  const [handOffset, setHandOffset] = useState({ x: 0, y: 0, z: 1 });
  const [isHandDetected, setIsHandDetected] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [handStatus, setHandStatus] = useState('off');
  const returnTimerRef = useRef(null);

  useEffect(() => {
    if (isHandDetected) {
      clearInterval(returnTimerRef.current);
      return undefined;
    }
    returnTimerRef.current = window.setInterval(() => {
      setHandOffset(previous => {
        const next = {
          x: previous.x * 0.88,
          y: previous.y * 0.88,
          z: previous.z + (1 - previous.z) * 0.08
        };
        if (Math.abs(next.x) < 0.005 && Math.abs(next.y) < 0.005 && Math.abs(next.z - 1) < 0.005) {
          clearInterval(returnTimerRef.current);
          return { x: 0, y: 0, z: 1 };
        }
        return next;
      });
    }, 16);
    return () => clearInterval(returnTimerRef.current);
  }, [isHandDetected]);

  const handleGestureChange = useCallback(nextMode => {
    if (MODE_LABELS[nextMode]) setMode(nextMode);
  }, []);

  const handleTrackingData = useCallback(data => {
    setIsHandDetected(data.isHandDetected);
    if (data.isHandDetected) {
      setHandStatus('detected');
      setHandOffset({ x: data.handX, y: data.handY, z: data.handZoom });
    } else {
      setHandStatus(cameraActive ? 'searching' : 'off');
    }
  }, [cameraActive]);

  const cameraErrorText = {
    denied: 'Camera permission was denied. Allow camera access for this site in browser settings, then retry.',
    'insecure-context': 'Camera access requires HTTPS or localhost. Open this site on a secure connection.',
    'camera-unsupported': 'This browser does not provide camera access. Try a current version of Chrome, Edge, or Safari.',
    'tracker-unavailable': 'The hand-tracking model did not load. Check your connection and retry.',
    'not-found': 'No camera was found. Connect or enable a camera, then retry.',
    'camera-busy': 'The camera is already in use or could not start. Close other camera apps and retry.',
    'camera-unavailable': 'The camera could not start. Check browser and operating-system camera settings, then retry.'
  }[cameraError] || 'Camera access failed. Check browser permissions and retry.';
  const localCameraUrl = `http://localhost:${window.location.port || '3000'}${window.location.pathname}`;

  const handleCameraError = useCallback(errorType => {
    setCameraError(errorType);
    setHandStatus(errorType === 'denied' ? 'permission denied' : 'unavailable');
  }, []);

  const retryCamera = () => {
    setCameraError(null);
    setCameraActive(false);
    window.setTimeout(() => setCameraActive(true), 200);
  };

  return (
    <div className="galaxy-app">
      <GalaxyScene gesture={mode} handOffset={handOffset} />

      <div className="cam-corner">
        <HandTracking
          isActive={cameraActive}
          onGestureChange={handleGestureChange}
          onTrackingData={handleTrackingData}
          onCameraError={handleCameraError}
          onStatus={setHandStatus}
          sensitivity={1.0}
        />
      </div>

      <header className="control-panel" aria-label="Galaxy controls">
        <div className="panel-brand">
          <span className="brand-mark">✦</span>
          <div><strong>CHRONOS</strong><small>GESTURE GALAXY</small></div>
        </div>
        <div className="panel-readouts">
          <div><small>CURRENT MODE</small><b>{MODE_LABELS[mode]}</b></div>
          <div><small>HAND TRACKING</small><b className={isHandDetected ? 'is-live' : ''}>{handStatus.toUpperCase()}</b></div>
          <div><small>DETECTED GESTURE</small><b>{isHandDetected ? MODE_LABELS[mode] : 'SHOW YOUR HAND'}</b></div>
        </div>
        <div className="panel-actions">
          <button className={cameraActive ? 'active' : ''} onClick={() => { setCameraError(null); setCameraActive(value => !value); }}>
            {cameraActive ? '◉ Hand Tracking On' : '○ Enable Hand Tracking'}
          </button>
        </div>
        <div className="command-hint">
          <small>HAND GESTURES</small>
          <span>Open palm · Fist · Point · Two / three / four fingers · Pinch · Both palms / both fists · Joined index + middle</span>
        </div>
      </header>

      <div className={`hand-status-badge ${isHandDetected ? 'detected' : ''}`}>
        <span className="status-dot-pulse" />
        <span>{isHandDetected ? `${MODE_LABELS[mode]} ACTIVE` : 'HAND TRACKING STANDBY'}</span>
      </div>

      {cameraError && (
        <div className="cam-error-overlay"><div className="cam-error-card">
          <div className="cam-error-icon">{cameraError === 'denied' ? '🚫' : '📷'}</div>
          <p>{cameraErrorText}</p>
          {cameraError === 'insecure-context' && (
            <>
              <p className="camera-origin">Current address: {window.location.origin}</p>
              <a className="cam-retry-btn local-camera-link" href={localCameraUrl}>Open this computer at localhost</a>
            </>
          )}
          <button className="cam-retry-btn" onClick={retryCamera}>↺ Retry Camera</button>
        </div></div>
      )}
    </div>
  );
}

export default App;
