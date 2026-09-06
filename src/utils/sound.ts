let audioContext: AudioContext | null = null;

function context(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioContextClass = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;
  audioContext ??= new AudioContextClass();
  if (audioContext.state === "suspended") void audioContext.resume();
  return audioContext;
}

export function unlockAudio(): void { context(); }

export function tone(frequency: number, volume: number, duration = 0.35, type: OscillatorType = "sine"): void {
  const ctx = context();
  if (!ctx || volume <= 0) return;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  const now = ctx.currentTime;
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume * 0.18), now + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.03);
}

export function happySound(volume: number): void {
  tone(523.25, volume, 0.22);
  window.setTimeout(() => tone(659.25, volume, 0.25), 110);
  window.setTimeout(() => tone(783.99, volume, 0.32), 220);
}

export function popSound(volume: number): void {
  const ctx = context();
  if (!ctx || volume <= 0) return;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  const now = ctx.currentTime;
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(420, now);
  oscillator.frequency.exponentialRampToValueAtTime(120, now + .12);
  gain.gain.setValueAtTime(volume * .12, now);
  gain.gain.exponentialRampToValueAtTime(.0001, now + .14);
  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start();
  oscillator.stop(now + .15);
}
