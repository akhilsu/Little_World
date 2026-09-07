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

export function clapSound(volume: number): void {
  const ctx = context();
  if (!ctx || volume <= 0) return;
  const start = ctx.currentTime;
  const clapOffsets = [0, .065, .14, .23, .32, .42, .53];

  clapOffsets.forEach((offset, index) => {
    const duration = .075 + (index % 3) * .008;
    const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let sampleIndex = 0; sampleIndex < samples.length; sampleIndex += 1) {
      const elapsed = sampleIndex / ctx.sampleRate;
      const mainSnap = Math.exp(-42 * elapsed);
      const palmEcho = elapsed > .014 ? Math.exp(-58 * (elapsed - .014)) * .42 : 0;
      samples[sampleIndex] = (Math.random() * 2 - 1) * Math.min(1, mainSnap + palmEcho);
    }

    const source = ctx.createBufferSource();
    const highpass = ctx.createBiquadFilter();
    const presence = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    const when = start + offset;
    source.buffer = buffer;
    highpass.type = "highpass";
    highpass.frequency.value = 650;
    presence.type = "bandpass";
    presence.frequency.value = 1350 + index * 105;
    presence.Q.value = .58;
    gain.gain.setValueAtTime(.0001, when);
    gain.gain.exponentialRampToValueAtTime(Math.max(.0001, volume * .17), when + .004);
    gain.gain.exponentialRampToValueAtTime(.0001, when + duration);
    source.connect(highpass).connect(presence).connect(gain).connect(ctx.destination);
    source.start(when);
    source.stop(when + duration + .01);
  });

  const appreciationNotes = [523.25, 659.25, 783.99, 1046.5];
  appreciationNotes.forEach((frequency, index) => {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const when = start + .22 + index * .13;
    const duration = .28 + index * .035;
    oscillator.type = index === appreciationNotes.length - 1 ? "sine" : "triangle";
    oscillator.frequency.setValueAtTime(frequency, when);
    gain.gain.setValueAtTime(.0001, when);
    gain.gain.exponentialRampToValueAtTime(Math.max(.0001, volume * .065), when + .025);
    gain.gain.exponentialRampToValueAtTime(.0001, when + duration);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(when);
    oscillator.stop(when + duration + .02);
  });
}
