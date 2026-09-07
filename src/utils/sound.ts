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
  const burstOffsets = [0, .08, .16, .27, .39, .52];

  burstOffsets.forEach((offset, index) => {
    const duration = .07 + (index % 2) * .015;
    const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let sampleIndex = 0; sampleIndex < samples.length; sampleIndex += 1) {
      const envelope = Math.pow(1 - sampleIndex / samples.length, 2.4);
      samples[sampleIndex] = (Math.random() * 2 - 1) * envelope;
    }

    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    const when = start + offset;
    source.buffer = buffer;
    filter.type = "bandpass";
    filter.frequency.value = 1450 + index * 90;
    filter.Q.value = .7;
    gain.gain.setValueAtTime(.0001, when);
    gain.gain.exponentialRampToValueAtTime(Math.max(.0001, volume * .22), when + .006);
    gain.gain.exponentialRampToValueAtTime(.0001, when + duration);
    source.connect(filter).connect(gain).connect(ctx.destination);
    source.start(when);
    source.stop(when + duration + .01);
  });
}
