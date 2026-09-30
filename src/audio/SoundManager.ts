// Web Audio API clean, distortion-free procedural sound and ambient music engine
// Designed with a master dynamics compressor and zero continuous background noise.

class SoundEngine {
  private ctx: AudioContext | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  private musicEnabled: boolean = true;
  private sfxEnabled: boolean = true;
  private musicTimer: number | null = null;

  constructor() {
    // Clean up any stale AudioContext from previous hot-reloads
    if (typeof window !== 'undefined') {
      const win = window as any;
      if (win.__GR_AUDIO_CTX__) {
        try {
          win.__GR_AUDIO_CTX__.close();
        } catch {
          // Ignore
        }
      }
    }
  }

  private initContext() {
    if (typeof window === 'undefined') return;
    const win = window as any;

    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || win.webkitAudioContext;
      this.ctx = new AudioCtx();
      win.__GR_AUDIO_CTX__ = this.ctx;

      // Master Dynamics Compressor: prevents any digital clipping, distortion, or crackle
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-18, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(12, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(8, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.25, this.ctx.currentTime);
      this.compressor.connect(this.ctx.destination);

      // Music Master Bus
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicEnabled ? 0.35 : 0, this.ctx.currentTime);
      this.musicGain.connect(this.compressor);

      // SFX Master Bus
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxEnabled ? 0.6 : 0, this.ctx.currentTime);
      this.sfxGain.connect(this.compressor);
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMusicEnabled(val: boolean) {
    this.musicEnabled = val;
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(val ? 0.35 : 0, this.ctx.currentTime);
    }
    if (!val) {
      this.stopMusic();
    } else {
      this.startMusic();
    }
  }

  public setSfxEnabled(val: boolean) {
    this.sfxEnabled = val;
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(val ? 0.6 : 0, this.ctx.currentTime);
    }
  }

  public isMusicEnabled() {
    return this.musicEnabled;
  }

  public isSfxEnabled() {
    return this.sfxEnabled;
  }

  // --- CELESTIAL AMBIENT MUSIC (Soft, soothing crystalline chimes; zero buzz) ---
  public startMusic() {
    if (!this.musicEnabled) return;
    this.initContext();
    if (!this.ctx || this.musicTimer !== null) return;

    this.playAmbientChime();
    // Play a gentle, relaxing celestial chime every 4 seconds
    this.musicTimer = window.setInterval(() => {
      if (this.musicEnabled) {
        this.playAmbientChime();
      }
    }, 4000);
  }

  public stopMusic() {
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  private playAmbientChime() {
    if (!this.ctx || !this.musicEnabled || !this.musicGain) return;
    const now = this.ctx.currentTime;

    // Peaceful pentatonic frequencies (D minor / F major pentatonic)
    // Low mid notes and high glass pings
    const bellNotes = [
      [220.0, 440.0],       // A3, A4
      [261.63, 523.25],     // C4, C5
      [293.66, 587.33],     // D4, D5
      [349.23, 698.46],     // F4, F5
      [392.0, 783.99],      // G4, G5
    ];

    const pair = bellNotes[Math.floor(Math.random() * bellNotes.length)];

    pair.forEach((freq, idx) => {
      if (!this.ctx || !this.musicGain) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Pure sine wave: zero distortion, zero harmonics, completely pure tone
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      const noteTime = now + idx * 0.12;
      const noteVol = idx === 0 ? 0.08 : 0.05;

      gain.gain.setValueAtTime(0.0001, noteTime);
      gain.gain.linearRampToValueAtTime(noteVol, noteTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 3.2);

      osc.connect(gain);
      gain.connect(this.musicGain);

      osc.start(noteTime);
      osc.stop(noteTime + 3.3);
    });
  }

  // --- SOUND EFFECTS (Zero background loop, clean triggered sounds only) ---

  // Thruster: gentle short sine burst on initiation; NO continuous noise generator
  public updateThruster(isThrusting: boolean) {
    // Intentionally zero continuous background audio. Space is silent.
    // If thrusting is desired, can trigger a single soft click, but silence is distortion-free!
    if (!isThrusting || !this.sfxEnabled) return;
  }

  public playLaser(isEnemy = false) {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Clean sine laser with quick pitch sweep
      osc.type = 'sine';
      const now = this.ctx.currentTime;
      const startFreq = isEnemy ? 480 : 840;
      const endFreq = isEnemy ? 180 : 260;

      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.09);

      gain.gain.setValueAtTime(isEnemy ? 0.1 : 0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch {
      // Ignore
    }
  }

  public playMiningBeam() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(360, now);
      osc.frequency.linearRampToValueAtTime(420, now + 0.05);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // Ignore
    }
  }

  public playHit(shieldHit = true) {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(shieldHit ? 520 : 180, now);
      osc.frequency.exponentialRampToValueAtTime(shieldHit ? 160 : 60, now + 0.12);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch {
      // Ignore
    }
  }

  public playExplosion() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    try {
      // Clean low sub-bass pitch drop for punchy, distortion-free explosion
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.35);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch {
      // Ignore
    }
  }

  public playCash() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const now = this.ctx.currentTime;
      [880, 1174, 1318].forEach((freq, idx) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);
        gain.gain.setValueAtTime(0.08, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.1);

        osc.connect(gain);
        gain.connect(this.sfxGain);
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
    if (!this.ctx || !this.sfxGain) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.linearRampToValueAtTime(440, now + 0.2);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.22);
    } catch {
      // Ignore
    }
  }
}

export const SoundManager = new SoundEngine();
