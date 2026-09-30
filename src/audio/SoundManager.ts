// Web Audio API procedural sound synthesizer and ambient music generator for Galactic Ronin
class SoundEngine {
  private ctx: AudioContext | null = null;
  private musicEnabled: boolean = true;
  private sfxEnabled: boolean = true;

  // Music state
  private musicTimer: number | null = null;
  private currentChordIndex: number = 0;
  private activeMusicNodes: Array<{ stop: (t: number) => void }> = [];

  // Thruster state
  private thrusterNoiseNode: AudioNode | null = null;
  private thrusterGain: GainNode | null = null;
  private isThrusting: boolean = false;

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

  public setMusicEnabled(val: boolean) {
    this.musicEnabled = val;
    if (!val) {
      this.stopMusic();
    } else {
      this.startMusic();
    }
  }

  public setSfxEnabled(val: boolean) {
    this.sfxEnabled = val;
    if (!val && this.thrusterGain && this.ctx) {
      this.thrusterGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
  }

  public isMusicEnabled() {
    return this.musicEnabled;
  }

  public isSfxEnabled() {
    return this.sfxEnabled;
  }

  // --- AMBIENT SPACE SOUNDTRACK (Pleasant, warm, zero buzzing) ---
  public startMusic() {
    if (!this.musicEnabled) return;
    this.initContext();
    if (!this.ctx) return;
    if (this.musicTimer !== null) return; // Already running

    this.playNextAmbientChord();
    // Advance chord progression every 6.5 seconds
    this.musicTimer = window.setInterval(() => {
      if (this.musicEnabled) {
        this.playNextAmbientChord();
      }
    }, 6500);
  }

  public stopMusic() {
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    const now = this.ctx?.currentTime || 0;
    this.activeMusicNodes.forEach((node) => {
      try {
        node.stop(now + 0.5);
      } catch {
        // Node already stopped
      }
    });
    this.activeMusicNodes = [];
  }

  private playNextAmbientChord() {
    if (!this.ctx || !this.musicEnabled) return;
    const now = this.ctx.currentTime;

    // Ethereal space chords: Dm9 -> Bbmaj7 -> Fmaj7 -> Cadd9
    const chords = [
      [146.83, 220.0, 261.63, 349.23], // D3, A3, C4, F4
      [116.54, 174.61, 220.0, 293.66], // Bb2, F3, A3, D4
      [130.81, 196.0, 261.63, 329.63], // C3, G3, C4, E4
      [174.61, 220.0, 261.63, 349.23], // F3, A3, C4, F4
    ];

    const chord = chords[this.currentChordIndex];
    this.currentChordIndex = (this.currentChordIndex + 1) % chords.length;

    // Master filter for the chord: warm analog lowpass
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, now);
    filter.frequency.linearRampToValueAtTime(750, now + 3);
    filter.frequency.linearRampToValueAtTime(450, now + 6);

    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.gain.linearRampToValueAtTime(0.045, now + 2.0); // Gentle slow swell
    masterGain.gain.linearRampToValueAtTime(0.001, now + 6.4); // Smooth decay

    filter.connect(masterGain);
    masterGain.connect(this.ctx.destination);

    // Play each note in the chord with subtle detuning for lush stereo-like warmth
    chord.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      // Subtle organic drift
      osc.detune.setValueAtTime((Math.random() - 0.5) * 6, now);

      osc.connect(filter);
      osc.start(now);
      osc.stop(now + 6.5);
      this.activeMusicNodes.push(osc);
    });

    // Occasional twinkling star chime ping (high, crystalline, soft)
    if (Math.random() < 0.75) {
      this.playStarlightChime(now + 1.2 + Math.random() * 2.5);
    }
  }

  private playStarlightChime(time: number) {
    if (!this.ctx || !this.musicEnabled) return;
    try {
      const notes = [587.33, 659.25, 783.99, 880.0, 1046.5]; // D5, E5, G5, A5, C6
      const freq = notes[Math.floor(Math.random() * notes.length)];

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(0.03, time + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 2.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(time);
      osc.stop(time + 2.3);
      this.activeMusicNodes.push(osc);
    } catch {
      // Ignore
    }
  }

  // --- SOUND EFFECTS (SFX) ---
  public playLaser(isEnemy = false) {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = isEnemy ? 'sawtooth' : 'triangle';
      const now = this.ctx.currentTime;
      const startFreq = isEnemy ? 550 : 880;
      const endFreq = isEnemy ? 180 : 240;

      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.1);

      gain.gain.setValueAtTime(isEnemy ? 0.07 : 0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch {
      // Ignore
    }
  }

  public playMiningBeam() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(420 + Math.random() * 30, now);
      osc.frequency.exponentialRampToValueAtTime(520, now + 0.07);

      gain.gain.setValueAtTime(0.035, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.07);
    } catch {
      // Ignore
    }
  }

  public playHit(shieldHit = true) {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      if (shieldHit) {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.14);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);
      } else {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.18);
        gain.gain.setValueAtTime(0.16, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
      }

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + (shieldHit ? 0.14 : 0.18));
    } catch {
      // Ignore
    }
  }

  public playExplosion() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const bufferSize = this.ctx.sampleRate * 0.35;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(280, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.35);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.22, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start();
    } catch {
      // Ignore
    }
  }

  public playCash() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      [880, 1174, 1318].forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);
        gain.gain.setValueAtTime(0.06, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.1);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.1);
      });
    } catch {
      // Ignore
    }
  }

  public playDock() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.linearRampToValueAtTime(440, now + 0.22);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch {
      // Ignore
    }
  }

  // Smooth atmospheric thruster whoosh (NO buzzing sawtooth)
  public updateThruster(thrusting: boolean) {
    if (!this.sfxEnabled) {
      if (this.thrusterGain && this.ctx) {
        this.thrusterGain.gain.setValueAtTime(0, this.ctx.currentTime);
      }
      return;
    }
    this.initContext();
    if (!this.ctx) return;

    // Use a soft, filtered white noise buffer for realistic rocket propellant whoosh
    if (!this.thrusterNoiseNode) {
      try {
        const bufferSize = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(180, this.ctx.currentTime); // Deep warm whoosh

        this.thrusterGain = this.ctx.createGain();
        this.thrusterGain.gain.setValueAtTime(0, this.ctx.currentTime);

        noise.connect(filter);
        filter.connect(this.thrusterGain);
        this.thrusterGain.connect(this.ctx.destination);

        noise.start();
        this.thrusterNoiseNode = noise;
      } catch {
        return;
      }
    }

    if (thrusting !== this.isThrusting && this.thrusterGain) {
      this.isThrusting = thrusting;
      const targetGain = thrusting ? 0.06 : 0;
      this.thrusterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.08);
    }
  }
}

export const SoundManager = new SoundEngine();
