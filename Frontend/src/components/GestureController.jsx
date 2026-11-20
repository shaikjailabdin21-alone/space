import React, { useEffect, useRef } from 'react';
import { audioSynthesizer } from '../utils/audioSynthesizer';

export const GestureController = ({
  mouseModeActive,
  isHandDetected,
  onGestureChange,
  onPositionChange,
  showToast
}) => {
  const currentPosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!mouseModeActive && isHandDetected) return;
      const normX = (e.clientX / window.innerWidth - 0.5) * 2.0;
      const normY = -(e.clientY / window.innerHeight - 0.5) * 2.0;
      currentPosRef.current = { x: normX, y: normY };
      onPositionChange?.(normX, normY, 1.0);
    };

    const handleMouseDown = (e) => {
      if (e.target.closest('.interactive') || e.target.closest('button')) return;
      if (!mouseModeActive && isHandDetected) return;
      onGestureChange?.('fist');
      audioSynthesizer.playCollapseSound();
    };

    const handleMouseUp = (e) => {
      if (e.target.closest('.interactive') || e.target.closest('button')) return;
      if (!mouseModeActive && isHandDetected) return;
      onGestureChange?.('palm');
      audioSynthesizer.playExplosionChime();
    };

    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT') return;

      // 1. Directional Movement: Arrow Keys / WASD
      let dx = 0;
      let dy = 0;
      let moved = false;

      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        dx = 1.0;
        moved = true;
        showToast?.('Moving Right ▶');
      } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        dx = -1.0;
        moved = true;
        showToast?.('◀ Moving Left');
      } else if (e.code === 'ArrowUp' || e.code === 'KeyW') {
        dy = 1.0;
        moved = true;
        showToast?.('▲ Moving Up');
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        dy = -1.0;
        moved = true;
        showToast?.('▼ Moving Down');
      }

      if (moved) {
        currentPosRef.current.x = Math.max(-1.0, Math.min(1.0, currentPosRef.current.x + dx * 0.35));
        currentPosRef.current.y = Math.max(-1.0, Math.min(1.0, currentPosRef.current.y + dy * 0.35));
        onPositionChange?.(currentPosRef.current.x, currentPosRef.current.y, 1.0);
        return;
      }

      // 2. Numeric Shortcuts for rapid gesture testing
      const keyMap = {
        Digit1: 'palm',
        Digit2: 'fist',
        Digit3: 'point',
        Digit4: 'two_fingers',
        Digit5: 'pinch',
        Digit6: 'both_open',
        Digit7: 'both_closed',
        Digit8: 'cube',
        Digit9: 'pyramid',
        Digit0: 'supernova'
      };

      if (e.code === 'KeyP') {
        window.dispatchEvent(new CustomEvent('galaxy-capture-screenshot'));
        showToast?.('📸 Screenshot captured!');
        return;
      }

      if (keyMap[e.code]) {
        const gesture = keyMap[e.code];
        onGestureChange?.(gesture);
        if (gesture === 'fist' || gesture === 'both_closed') audioSynthesizer.playCollapseSound();
        else if (gesture === 'supernova') audioSynthesizer.playSupernovaSound();
        else audioSynthesizer.playExplosionChime();
        showToast?.(`Formation: ${gesture.toUpperCase()}`);
      } else if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        onGestureChange?.((prev) => {
          const next = prev === 'fist' ? 'palm' : 'fist';
          if (next === 'fist') audioSynthesizer.playCollapseSound();
          else audioSynthesizer.playExplosionChime();
          showToast?.(`Toggled: ${next.toUpperCase()}`);
          return next;
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);

    // Touch Support for mobile devices
    const handleTouchStart = (e) => {
      if (e.target.closest('.interactive') || e.target.closest('button')) return;
      onGestureChange?.('fist');
      audioSynthesizer.playCollapseSound();
    };

    const handleTouchEnd = (e) => {
      if (e.target.closest('.interactive') || e.target.closest('button')) return;
      onGestureChange?.('palm');
      audioSynthesizer.playExplosionChime();
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [mouseModeActive, isHandDetected, onGestureChange, onPositionChange, showToast]);

  return null;
};
