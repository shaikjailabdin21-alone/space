/**
 * Procedural Cosmic Audio Synthesizer
 * Uses Web Audio API to create immersive sci-fi soundscapes,
 * singularity collapse drones, and galaxy explosion chimes without external assets.
 */
class CosmicAudio {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.isInitialized = false;

    // Ambient Drone Nodes
    this.droneOsc1 = null;
    this.droneOsc2 = null;
    this.droneGain = null;
    this.filterNode = null;

    // Singularity Tension Nodes
    this.tensionOsc = null;
    this.tensionGain = null;

    this.previousState = 'neutral';
  }

  init() {
    if (this.isInitialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();

      // Master output
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Low-pass filter for ambient space atmosphere
      this.filterNode = this.ctx.createBiquadFilter();
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.setValueAtTime(450, this.ctx.currentTime);
      this.filterNode.Q.setValueAtTime(2.5, this.ctx.currentTime);
      this.filterNode.connect(this.masterGain);

      // Create ambient space drones (deep dual detuned sine waves)
      this.droneOsc1 = this.ctx.createOscillator();
      this.droneOsc1.type = 'sine';
      this.droneOsc1.frequency.setValueAtTime(55, this.ctx.currentTime); // A1 note

      this.droneOsc2 = this.ctx.createOscillator();
      this.droneOsc2.type = 'triangle';
      this.droneOsc2.frequency.setValueAtTime(55.6, this.ctx.currentTime); // Slight binaural beat

      this.droneGain = this.ctx.createGain();
      this.droneGain.gain.setValueAtTime(0.18, this.ctx.currentTime);

      this.droneOsc1.connect(this.droneGain);
      this.droneOsc2.connect(this.droneGain);
      this.droneGain.connect(this.filterNode);

      this.droneOsc1.start();
      this.droneOsc2.start();

      // Singularity energetic hum (responds dynamically to fist compression)
      this.tensionOsc = this.ctx.createOscillator();
      this.tensionOsc.type = 'sawtooth';
      this.tensionOsc.frequency.setValueAtTime(110, this.ctx.currentTime);

      this.tensionFilter = this.ctx.createBiquadFilter();
      this.tensionFilter.type = 'bandpass';
      this.tensionFilter.frequency.setValueAtTime(300, this.ctx.currentTime);
      this.tensionFilter.Q.setValueAtTime(5, this.ctx.currentTime);

      this.tensionGain = this.ctx.createGain();
      this.tensionGain.gain.setValueAtTime(0, this.ctx.currentTime);

      this.tensionOsc.connect(this.tensionFilter);
      this.tensionFilter.connect(this.tensionGain);
      this.tensionGain.connect(this.masterGain);

      this.tensionOsc.start();

      this.isInitialized = true;
    } catch (e) {
      console.warn('Web Audio API could not be initialized:', e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.35, now, 0.05);
    }
    return !this.isMuted;
  }

  /**
   * Update audio parameters smoothly based on hand openFactor (0.0 = fist, 1.0 = open palm)
   */
  updateGestureDynamics(openFactor, handSpeed = 0) {
    if (!this.isInitialized || this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;

    // When closing into a fist (openFactor -> 0.0), tension hum increases and frequency slides up
    const fistIntensity = Math.pow(1.0 - openFactor, 2);
    if (this.tensionGain && this.tensionOsc) {
      this.tensionGain.gain.setTargetAtTime(fistIntensity * 0.12, now, 0.08);
      this.tensionOsc.frequency.setTargetAtTime(80 + (1.0 - openFactor) * 140, now, 0.08);
      this.tensionFilter.frequency.setTargetAtTime(250 + (1.0 - openFactor) * 600, now, 0.08);
    }

    // Filter opening on open palm
    if (this.filterNode) {
      const targetFreq = 350 + openFactor * 800 + handSpeed * 300;
      this.filterNode.frequency.setTargetAtTime(Math.min(targetFreq, 3000), now, 0.1);
    }
  }

  /**
   * Trigger explosion burst sound when hand bursts open into galaxy
   */
  playExplosionChime() {
    if (!this.isInitialized || this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;

      // Sub-bass sweep
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(140, now);
      subOsc.frequency.exponentialRampToValueAtTime(35, now + 0.8);

      subGain.gain.setValueAtTime(0.4, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      subOsc.connect(subGain);
      subGain.connect(this.masterGain);
      subOsc.start(now);
      subOsc.stop(now + 1.2);

      // Crystalline shimmer chords (pentatonic cosmic bell tones)
      const freqs = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6
      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);

        gain.gain.setValueAtTime(0.08 / (idx + 1), now + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.5 + idx * 0.1);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now + idx * 0.04);
        osc.stop(now + 1.8);
      });
    } catch (e) {
      console.warn('Explosion chime error:', e);
    }
  }

  /**
   * Trigger singularity collapse whoosh sound when fist closes tightly
   */
  playCollapseSound() {
    if (!this.isInitialized || this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.6);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.7);
    } catch (e) {
      console.warn('Collapse sound error:', e);
    }
  }
}

export const cosmicAudio = new CosmicAudio();
