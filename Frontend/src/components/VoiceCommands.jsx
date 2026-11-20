import React, { useEffect, useRef, useState } from 'react';

export const VoiceCommands = ({
  isActive,
  onCommand,
  showToast
}) => {
  const [lastCommand, setLastCommand] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!isActive) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast?.('Voice Recognition not supported in this browser');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const current = event.resultIndex;
      const transcript = event.results[current][0].transcript.toLowerCase().trim();
      setLastCommand(transcript);

      // Match voice commands for All Hand Formations & Themes
      if (transcript.includes('sphere') || transcript.includes('fist') || transcript.includes('ball')) {
        onCommand?.({ type: 'gesture', value: 'fist' });
        showToast?.(`Voice Command: "3D Sphere"`);
      } else if (transcript.includes('galaxy') || transcript.includes('spiral') || transcript.includes('palm')) {
        onCommand?.({ type: 'gesture', value: 'palm' });
        showToast?.(`Voice Command: "Spiral Galaxy"`);
      } else if (transcript.includes('beam') || transcript.includes('point') || transcript.includes('laser')) {
        onCommand?.({ type: 'gesture', value: 'point' });
        showToast?.(`Voice Command: "Particle Beam"`);
      } else if (transcript.includes('ring') || transcript.includes('two') || transcript.includes('peace')) {
        onCommand?.({ type: 'gesture', value: 'two_fingers' });
        showToast?.(`Voice Command: "Two Rotating Rings"`);
      } else if (transcript.includes('pinch') || transcript.includes('attract')) {
        onCommand?.({ type: 'gesture', value: 'pinch' });
        showToast?.(`Voice Command: "Pinch Attraction"`);
      } else if (transcript.includes('expand') || transcript.includes('both open')) {
        onCommand?.({ type: 'gesture', value: 'both_open' });
        showToast?.(`Voice Command: "Expand Galaxy"`);
      } else if (transcript.includes('compress') || transcript.includes('both closed')) {
        onCommand?.({ type: 'gesture', value: 'both_closed' });
        showToast?.(`Voice Command: "Compress Core"`);
      } else if (transcript.includes('neon') || transcript.includes('cyan')) {
        onCommand?.({ type: 'theme', value: 'cyber-neon' });
        showToast?.(`Voice Command: "Cyber Neon Theme"`);
      } else if (transcript.includes('violet') || transcript.includes('purple')) {
        onCommand?.({ type: 'theme', value: 'cosmic-violet' });
        showToast?.(`Voice Command: "Cosmic Violet Theme"`);
      } else if (transcript.includes('gold') || transcript.includes('solar') || transcript.includes('orange')) {
        onCommand?.({ type: 'theme', value: 'solar-gold' });
        showToast?.(`Voice Command: "Solar Flare Theme"`);
      } else if (transcript.includes('emerald') || transcript.includes('green')) {
        onCommand?.({ type: 'theme', value: 'deep-emerald' });
        showToast?.(`Voice Command: "Emerald Nebula Theme"`);
      } else if (transcript.includes('reset')) {
        onCommand?.({ type: 'reset' });
        showToast?.(`Voice Command: "Recalibrate Universe"`);
      }
    };

    recognition.onerror = (e) => {
      console.warn('Speech Recognition error:', e.error);
    };

    recognition.onend = () => {
      if (isActive && recognitionRef.current) {
        try { recognition.start(); } catch (e) {}
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      showToast?.('Voice Command Engine Listening...');
    } catch (e) {
      console.warn('Speech recognition start failed:', e);
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
        recognitionRef.current = null;
      }
    };
  }, [isActive, onCommand, showToast]);

  return null;
};
