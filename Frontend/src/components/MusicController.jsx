import React, { useEffect, useRef } from 'react';
import { audioSynthesizer } from '../utils/audioSynthesizer';

export const MusicController = ({
  isActive,
  onAudioUpdate
}) => {
  const rafRef = useRef(null);

  useEffect(() => {
    if (!isActive) return;

    const tick = () => {
      const data = audioSynthesizer.getFrequencyData();
      onAudioUpdate?.(data);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isActive, onAudioUpdate]);

  return null;
};
