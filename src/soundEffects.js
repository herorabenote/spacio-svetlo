/**
 * Web Audio API synthesizer for STUDIO LUCE
 * - Features dynamic stereo panning mapped to the physical swinging lamp coordinates
 * - Spatialized ambient water drips echoing in 3D room space
 * - Chemical tray sloshing waves (procedural white noise bandpass filter sweeps)
 * - Light-state hum shifts (Tungsten buzz vs Safelight drone)
 */

export class DarkroomAudio {
  constructor() {
    this.ctx = null;
    this.humGain = null;
    this.humOsc = null;
    this.humPanner = null; // Stereo Panner Node for physical swing
    this.filter = null;
    
    this.isMuted = true;
    this.isActive = false;

    // Dripping water interval
    this.dripTimer = null;
  }

  init() {
    if (this.ctx) return;
    
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContextClass();
    
    // Create primary low-pass filter
    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 65; // Eerie deep safelight hum initially
    this.filter.Q.value = 1.0;

    // Create Stereo Panner Node for the hum
    this.humPanner = this.ctx.createStereoPanner();
    this.humPanner.pan.value = 0.0; // Center

    // Create volume controllers
    this.humGain = this.ctx.createGain();
    this.humGain.gain.value = 0.0;

    // Connect nodes: Osc -> Filter -> Panner -> Gain -> Output
    this.filter.connect(this.humPanner);
    this.humPanner.connect(this.humGain);
    this.humGain.connect(this.ctx.destination);

    // Initialize Mains hum oscillator (start at 38Hz Safelight frequency)
    this.humOsc = this.ctx.createOscillator();
    this.humOsc.type = 'sawtooth';
    this.humOsc.frequency.value = 38; 
    this.humOsc.connect(this.filter);
    this.humOsc.start();

    // Start dripping water loop
    this.scheduleDrips();

    this.isActive = true;
  }

  /**
   * Maps physical coordinate of lamp to headphone stereo pan
   * @param {number} panValue - float between -1.0 (Left) and 1.0 (Right)
   */
  updateHumPanning(panValue) {
    if (!this.ctx || !this.humPanner) return;
    const clampedPan = Math.max(-0.85, Math.min(0.85, panValue * 1.5));
    this.humPanner.pan.setTargetAtTime(clampedPan, this.ctx.currentTime, 0.1);
  }

  setMute(mute) {
    this.isMuted = mute;
    if (!this.ctx) this.init();
    
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (this.isMuted) {
      if (this.humGain) this.humGain.gain.setTargetAtTime(0.0, this.ctx.currentTime, 0.2);
    } else {
      if (this.humGain) this.humGain.gain.setTargetAtTime(0.22, this.ctx.currentTime, 1.0);
    }
  }

  /**
   * Shift the pitch and filter cutoff depending on the lighting breaker
   * @param {boolean} on - true if halogen ON, false if safelight active
   */
  setLightState(on) {
    if (!this.ctx || !this.humOsc || !this.filter) return;
    const now = this.ctx.currentTime;

    if (on) {
      // Halogen mode: 50Hz mains buzz with slightly brighter tone
      this.humOsc.frequency.setTargetAtTime(50, now, 0.3);
      this.filter.frequency.setTargetAtTime(115, now, 0.3);
    } else {
      // Safelight mode: 38Hz deep transformer hum
      this.humOsc.frequency.setTargetAtTime(38, now, 0.5);
      this.filter.frequency.setTargetAtTime(65, now, 0.5);
    }
  }

  /**
   * Slowly fade volume out/in when scrolling
   * @param {number} targetVolume - float between 0.0 and 0.25
   * @param {number} duration - seconds to transition
   */
  fadeHumVolume(targetVolume, duration = 0.5) {
    if (this.isMuted || !this.ctx || !this.humGain) return;
    this.humGain.gain.setTargetAtTime(targetVolume, this.ctx.currentTime, duration);
  }

  playBreakerSwitch() {
    if (this.isMuted || !this.ctx) return;

    const now = this.ctx.currentTime;

    const thumpOsc = this.ctx.createOscillator();
    const thumpGain = this.ctx.createGain();
    thumpOsc.type = 'triangle';
    thumpOsc.frequency.setValueAtTime(60, now);
    thumpOsc.frequency.exponentialRampToValueAtTime(0.01, now + 0.15);
    
    thumpGain.gain.setValueAtTime(0.8, now);
    thumpGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    thumpOsc.connect(thumpGain);
    thumpGain.connect(this.ctx.destination);
    thumpOsc.start();
    thumpOsc.stop(now + 0.2);

    const clickOsc = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    clickOsc.type = 'sine';
    clickOsc.frequency.setValueAtTime(2500, now);
    
    clickGain.gain.setValueAtTime(0.15, now);
    clickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

    clickOsc.connect(clickGain);
    clickGain.connect(this.ctx.destination);
    clickOsc.start();
    clickOsc.stop(now + 0.06);
  }

  playFlickerSpark() {
    if (this.isMuted || !this.ctx) return;
    
    const now = this.ctx.currentTime;
    
    const bufferSize = this.ctx.sampleRate * 0.03; 
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.12; 
    }

    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = buffer;

    const sparkFilter = this.ctx.createBiquadFilter();
    sparkFilter.type = 'bandpass';
    sparkFilter.frequency.value = 3500;
    sparkFilter.Q.value = 3.0;

    const sparkGain = this.ctx.createGain();
    sparkGain.gain.setValueAtTime(0.35, now);
    sparkGain.gain.exponentialRampToValueAtTime(0.01, now + 0.03);

    noiseNode.connect(sparkFilter);
    sparkFilter.connect(sparkGain);
    sparkGain.connect(this.ctx.destination);
    noiseNode.start();
  }

  /**
   * Synthesizes a realistic procedural chemical tray sloshing wave
   * Using modulated bandpass filtered white noise
   */
  playTraySlosh() {
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;
    
    const duration = 1.6;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = buffer;
    
    const sloshFilter = this.ctx.createBiquadFilter();
    sloshFilter.type = 'bandpass';
    sloshFilter.Q.setValueAtTime(3.5, now);
    
    // Wave sweeping back and forth (frequency crest and release)
    sloshFilter.frequency.setValueAtTime(300, now);
    sloshFilter.frequency.exponentialRampToValueAtTime(680, now + 0.5);
    sloshFilter.frequency.exponentialRampToValueAtTime(260, now + 1.5);
    
    const sloshGain = this.ctx.createGain();
    sloshGain.gain.setValueAtTime(0.0, now);
    sloshGain.gain.linearRampToValueAtTime(0.07, now + 0.35); // Fade in wave
    sloshGain.gain.exponentialRampToValueAtTime(0.001, now + 1.6); // Fade out wave
    
    const sloshPanner = this.ctx.createStereoPanner();
    sloshPanner.pan.setValueAtTime((Math.random() * 2 - 1) * 0.4, now);
    
    noiseNode.connect(sloshFilter);
    sloshFilter.connect(sloshGain);
    sloshGain.connect(sloshPanner);
    sloshPanner.connect(this.ctx.destination);
    
    noiseNode.start(now);
    noiseNode.stop(now + duration);
  }

  playDrip() {
    if (this.isMuted || !this.ctx || Math.random() > 0.65) return;
    if (window.scrollY > 300) return; // Don't drip below the fold

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const dripPanner = this.ctx.createStereoPanner();

    dripPanner.pan.value = (Math.random() * 2 - 1) * 0.8;

    osc.type = 'sine';
    const baseFreq = 800 + Math.random() * 400;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.06); 

    gain.gain.setValueAtTime(0.06 + Math.random() * 0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    const spaceFilter = this.ctx.createBiquadFilter();
    spaceFilter.type = 'peaking';
    spaceFilter.frequency.value = 1800; 
    spaceFilter.Q.value = 2.0;

    osc.connect(gain);
    gain.connect(dripPanner);
    dripPanner.connect(spaceFilter);
    spaceFilter.connect(this.ctx.destination);

    osc.start();
    osc.stop(now + 0.1);
  }

  scheduleDrips() {
    const nextDripTime = 2000 + Math.random() * 5000; 
    this.dripTimer = setTimeout(() => {
      this.playDrip();
      this.scheduleDrips();
    }, nextDripTime);
  }

  stop() {
    clearTimeout(this.dripTimer);
    if (this.humOsc) {
      try { this.humOsc.stop(); } catch (e) {}
    }
  }
}
export default DarkroomAudio;
