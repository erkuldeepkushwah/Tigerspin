class ArcadeSoundEngine {
  private ctx: AudioContext | null = null;
  private enabled = true;

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  private ensureContext(): AudioContext | null {
    if (!this.enabled || typeof window === 'undefined') return null;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;

    if (!this.ctx) {
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  unlock(): void {
    this.ensureContext();
  }

  private tone(
    freq: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    delay = 0,
    endFreq?: number,
  ): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
    }

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(volume, now + Math.min(0.015, duration * 0.25));
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  playButtonClick(pitch = 480): void {
    this.tone(pitch, 0.055, 'triangle', 0.055, 0, pitch * 1.18);
  }

  playBetStep(up: boolean): void {
    const base = up ? 520 : 390;
    this.tone(base, 0.06, 'triangle', 0.055, 0, up ? 660 : 310);
  }

  playSwipeCue(): void {
    this.tone(240, 0.09, 'sine', 0.045, 0, 150);
  }

  playSpinStart(turbo: boolean): void {
    this.tone(210, 0.08, 'triangle', 0.075, 0, 390);
    this.tone(turbo ? 460 : 330, 0.11, 'sine', 0.045, 0.03, turbo ? 680 : 490);
  }

  playReelStop(colIndex: number, hasWild: boolean): void {
    // Low weighted cabinet thud
    const thudBase = 128 + colIndex * 16;
    this.tone(thudBase, 0.09, 'triangle', 0.095, 0, 62);
    // Crisp mechanical latch click
    this.tone(420 + colIndex * 90, 0.05, 'sine', 0.045, 0.01, 290 + colIndex * 60);

    if (hasWild) {
      // Golden shimmer chime when Tiger Wild lands
      this.tone(880, 0.16, 'sine', 0.06, 0.02, 1320);
      this.tone(1320, 0.22, 'triangle', 0.045, 0.06, 1760);
    }
  }

  playWin(multiplier: number, isFullScreen: boolean): void {
    if (isFullScreen || multiplier >= 12) {
      // Super Win / Full Screen pentatonic fanfare + coin cascade
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98];
      notes.forEach((n, i) => {
        this.tone(n, 0.26, 'triangle', 0.085, i * 0.065);
        this.tone(n * 1.5, 0.18, 'sine', 0.035, i * 0.065 + 0.02);
      });
      for (let i = 0; i < 8; i++) {
        this.tone(1450 + (i % 3) * 260, 0.08, 'sine', 0.032, 0.36 + i * 0.085, 2200);
      }
      return;
    }

    if (multiplier >= 5) {
      // Mega Win bright arpeggio + coin clinks
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
      notes.forEach((n, i) => {
        this.tone(n, 0.22, 'triangle', 0.075, i * 0.07);
      });
      for (let i = 0; i < 5; i++) {
        this.tone(1400 + (i % 2) * 320, 0.075, 'sine', 0.028, 0.32 + i * 0.09, 2050);
      }
      return;
    }

    // Standard line win chime
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, i) => {
      this.tone(n, 0.15, 'triangle', 0.065, i * 0.065);
    });
  }
}

export const soundEngine = new ArcadeSoundEngine();

export function triggerHaptic(pattern: number | number[], enabled: boolean): void {
  if (!enabled || typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
    return;
  }
  try {
    navigator.vibrate(pattern);
  } catch {
    // Ignore unsupported or blocked haptic calls
  }
}
