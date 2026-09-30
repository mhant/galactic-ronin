// Web Audio API procedural sound synthesizer for Galactic Ronin
class SoundEngine {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;
  private thrusterOsc: OscillatorNode | null = null;
  private thrusterGain: GainNode | null = null;
  private isThrusting: boolean = false;
  private ambientStarted: boolean = false;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
    if (!val && this.thrusterGain) {
      this.thrusterGain.gain.setValueAtTime(0, this.ctx?.currentTime || 0);
    }
  }

  public isSoundEnabled() {
    return this.enabled;
  }

  public startAmbient() {
    if (!this.enabled || this.ambientStarted) return;
    this.initContext();
    if (!this.ctx) return;
    this.ambientStarted = true;

    try {
      // Cosmic background sub-drone
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(55, this.ctx.currentTime); // Low A

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(120, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
    } catch {
      // Ignore background audio failures
    }
  }

  public playLaser(isEnemy = false) {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = isEnemy ? 'sawtooth' : 'triangle';
      const now = this.ctx.currentTime;
      const startFreq = isEnemy ? 600 : 880;
      const endFreq = isEnemy ? 180 : 220;

      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.12);

      gain.gain.setValueAtTime(isEnemy ? 0.08 : 0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch {
      // Ignore
    }
  }

  public playMiningBeam() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(320 + Math.random() * 40, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.08);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch {
      // Ignore
    }
  }

  public playHit(shieldHit = true) {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      if (shieldHit) {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.15);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      } else {
        osc.type = 'square';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      }

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + (shieldHit ? 0.15 : 0.2));
    } catch {
      // Ignore
    }
  }

  public playExplosion() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      // Noise burst for explosion
      const bufferSize = this.ctx.sampleRate * 0.4;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(300, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.4);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start();
    } catch {
      // Ignore
    }
  }

  public playCash() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      [880, 1174, 1318].forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);
        gain.gain.setValueAtTime(0.08, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.12);
      });
    } catch {
      // Ignore
    }
  }

  public playDock() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Airlock release sound: filtered noise + low sine confirm
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(440, now + 0.25);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } catch {
      // Ignore
    }
  }

  public updateThruster(thrusting: boolean) {
    if (!this.enabled) {
      if (this.thrusterGain && this.ctx) {
        this.thrusterGain.gain.setValueAtTime(0, this.ctx.currentTime);
      }
      return;
    }
    this.initContext();
    if (!this.ctx) return;

    if (!this.thrusterOsc) {
      try {
        this.thrusterOsc = this.ctx.createOscillator();
        this.thrusterGain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        this.thrusterOsc.type = 'sawtooth';
        this.thrusterOsc.frequency.setValueAtTime(60, this.ctx.currentTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(140, this.ctx.currentTime);

        this.thrusterGain.gain.setValueAtTime(0, this.ctx.currentTime);

        this.thrusterOsc.connect(filter);
        filter.connect(this.thrusterGain);
        this.thrusterGain.connect(this.ctx.destination);

        this.thrusterOsc.start();
      } catch {
        return;
      }
    }

    if (thrusting !== this.isThrusting && this.thrusterGain) {
      this.isThrusting = thrusting;
      const targetGain = thrusting ? 0.08 : 0;
      this.thrusterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
    }
  }
}

export const SoundManager = new SoundEngine();
