/**
 * Procedural Cosmic Audio Synthesizer & Audio Reactive Analyzer
 * Zero external audio assets required. Uses Web Audio API.
 */
class CosmicAudioSynthesizer {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.isInitialized = false;

    // Ambient Drone Nodes
    this.droneOsc1 = null;
    this.droneOsc2 = null;
    this.droneGain = null;
    this.filterNode = null;

    // Tension Nodes
    this.tensionOsc = null;
    this.tensionGain = null;
    this.tensionFilter = null;

    // Analyzer for the procedural audio output.
    this.analyser = null;
    this.dataArray = null;
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

      // Audio Analyser
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      this.masterGain.connect(this.analyser);

      // Low-pass filter for ambient space atmosphere
      this.filterNode = this.ctx.createBiquadFilter();
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.setValueAtTime(450, this.ctx.currentTime);
      this.filterNode.Q.setValueAtTime(2.5, this.ctx.currentTime);
      this.filterNode.connect(this.masterGain);

      // Ambient Drones
      this.droneOsc1 = this.ctx.createOscillator();
      this.droneOsc1.type = 'sine';
      this.droneOsc1.frequency.setValueAtTime(55, this.ctx.currentTime);

      this.droneOsc2 = this.ctx.createOscillator();
      this.droneOsc2.type = 'triangle';
      this.droneOsc2.frequency.setValueAtTime(55.6, this.ctx.currentTime);

      this.droneGain = this.ctx.createGain();
      this.droneGain.gain.setValueAtTime(0.18, this.ctx.currentTime);

      this.droneOsc1.connect(this.droneGain);
      this.droneOsc2.connect(this.droneGain);
      this.droneGain.connect(this.filterNode);

      this.droneOsc1.start();
      this.droneOsc2.start();

      // Tension Hum for Fist / Singularity
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

  updateGestureDynamics(openFactor, handSpeed = 0) {
    if (!this.isInitialized || this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;

    const fistIntensity = Math.pow(1.0 - openFactor, 2);
    if (this.tensionGain && this.tensionOsc) {
      this.tensionGain.gain.setTargetAtTime(fistIntensity * 0.12, now, 0.08);
      this.tensionOsc.frequency.setTargetAtTime(80 + (1.0 - openFactor) * 140, now, 0.08);
      this.tensionFilter.frequency.setTargetAtTime(250 + (1.0 - openFactor) * 600, now, 0.08);
    }

    if (this.filterNode) {
      const targetFreq = 350 + openFactor * 800 + handSpeed * 300;
      this.filterNode.frequency.setTargetAtTime(Math.min(targetFreq, 3000), now, 0.1);
    }
  }

  playExplosionChime() {
    if (!this.isInitialized || this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;

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

      const freqs = [523.25, 659.25, 783.99, 1046.50, 1318.51];
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

  /**
   * Supernova explosion audio: deep rumble + high-frequency shimmer blast
   */
  playSupernovaSound() {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      // Deep sub-bass blast
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sawtooth';
      subOsc.frequency.setValueAtTime(140, now);
      subOsc.frequency.exponentialRampToValueAtTime(28, now + 1.8);

      subGain.gain.setValueAtTime(0.4, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

      subOsc.connect(subGain);
      subGain.connect(this.masterGain);
      subOsc.start(now);
      subOsc.stop(now + 1.8);

      // Noise sparkle burst
      const highOsc = this.ctx.createOscillator();
      const highGain = this.ctx.createGain();
      highOsc.type = 'triangle';
      highOsc.frequency.setValueAtTime(880, now);
      highOsc.frequency.exponentialRampToValueAtTime(220, now + 1.2);
      highGain.gain.setValueAtTime(0.2, now);
      highGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      highOsc.connect(highGain);
      highGain.connect(this.masterGain);
      highOsc.start(now);
      highOsc.stop(now + 1.2);
    } catch (e) {
      console.warn('Supernova sound error:', e);
    }
  }

  /**
   * Space Portal vortex chime
   */
  playPortalSound() {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(660, now + 0.6);
      osc.frequency.linearRampToValueAtTime(330, now + 1.2);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 1.2);
    } catch (e) {}
  }

  /**
   * Get real-time FFT frequency levels (0.0 - 1.0) for music reactive visuals
   */
  getFrequencyData() {
    if (!this.analyser || !this.dataArray) {
      return { bass: 0, mid: 0, treble: 0, overall: 0 };
    }
    this.analyser.getByteFrequencyData(this.dataArray);

    let bassSum = 0;
    let midSum = 0;
    let trebleSum = 0;

    const binCount = this.dataArray.length;
    const bassEnd = Math.floor(binCount * 0.15);
    const midEnd = Math.floor(binCount * 0.55);

    for (let i = 0; i < binCount; i++) {
      const val = this.dataArray[i] / 255;
      if (i < bassEnd) bassSum += val;
      else if (i < midEnd) midSum += val;
      else trebleSum += val;
    }

    const bass = bassSum / Math.max(1, bassEnd);
    const mid = midSum / Math.max(1, midEnd - bassEnd);
    const treble = trebleSum / Math.max(1, binCount - midEnd);
    const overall = (bass * 1.5 + mid + treble) / 3.5;

    return { bass, mid, treble, overall };
  }
}

export const audioSynthesizer = new CosmicAudioSynthesizer();
