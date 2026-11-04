import { TASK_THEMES } from './habitLogic';

class SoundEngine {
  private audioCtx: AudioContext | null = null;

  private getContext(muted: boolean, volume: number): AudioContext | null {
    if (muted || volume <= 0.001 || typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  public playTaskPop(taskIdx: number, doneCountOnDay: number, muted: boolean, volume: number): void {
    const ctx = this.getContext(muted, volume);
    if (!ctx) return;
    const now = ctx.currentTime;
    const baseFreq = TASK_THEMES[taskIdx] ? TASK_THEMES[taskIdx].pitchHz : 523.25;
    // Escalate pitch slightly as more tasks get done on the same day (1/4 -> 3/4)
    const comboMultiplier = 1 + Math.max(0, doneCountOnDay - 1) * 0.06;
    const freq = baseFreq * comboMultiplier;
    const vol = volume * 0.36;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * 0.72, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.45, now + 0.075);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.15, now + 0.14);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.17);

    // Harmonic sparkle overtone
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 1.5, now + 0.03);
    osc2.frequency.exponentialRampToValueAtTime(freq * 2.0, now + 0.16);

    gain2.gain.setValueAtTime(0.001, now);
    gain2.gain.linearRampToValueAtTime(vol * 0.55, now + 0.045);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.03);
    osc2.stop(now + 0.21);
  }

  public playDayCompleteFanfare(muted: boolean, volume: number): void {
    const ctx = this.getContext(muted, volume);
    if (!ctx) return;
    const now = ctx.currentTime;
    const vol = volume * 0.34;

    const notes = [
      { freq: 523.25, start: 0.0, dur: 0.13 },
      { freq: 659.25, start: 0.09, dur: 0.13 },
      { freq: 783.99, start: 0.18, dur: 0.14 },
      { freq: 1046.5, start: 0.28, dur: 0.45 },
      { freq: 1318.51, start: 0.34, dur: 0.42 }
    ];

    notes.forEach(n => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.freq, now + n.start);

      gain.gain.setValueAtTime(0.001, now + n.start);
      gain.gain.linearRampToValueAtTime(vol, now + n.start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.start + n.dur);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + n.start);
      osc.stop(now + n.start + n.dur + 0.02);
    });
  }

  public playMilestoneGrandSound(muted: boolean, volume: number): void {
    const ctx = this.getContext(muted, volume);
    if (!ctx) return;
    const now = ctx.currentTime;
    const vol = volume * 0.34;

    const seq = [
      { f: 440.0, t: 0.0, d: 0.16 },
      { f: 554.37, t: 0.12, d: 0.16 },
      { f: 659.25, t: 0.24, d: 0.16 },
      { f: 880.0, t: 0.36, d: 0.28 },
      { f: 659.25, t: 0.56, d: 0.14 },
      { f: 880.0, t: 0.68, d: 0.58 },
      { f: 1108.73, t: 0.68, d: 0.58 }
    ];

    seq.forEach(item => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2400, now + item.t);

      osc.frequency.setValueAtTime(item.f, now + item.t);
      gain.gain.setValueAtTime(0.001, now + item.t);
      gain.gain.linearRampToValueAtTime(vol * 0.7, now + item.t + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.001, now + item.t + item.d);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + item.t);
      osc.stop(now + item.t + item.d + 0.03);
    });
  }

  public playSelectTick(taskIdx: number, muted: boolean, volume: number): void {
    const ctx = this.getContext(muted, volume);
    if (!ctx) return;
    const now = ctx.currentTime;
    const freq = TASK_THEMES[taskIdx] ? TASK_THEMES[taskIdx].pitchHz * 0.5 : 320;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.25, now + 0.045);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(volume * 0.15, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  }
}

export const soundEngine = new SoundEngine();
