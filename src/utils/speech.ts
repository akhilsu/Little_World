export interface SpeechOptions { enabled: boolean; volume: number; rate?: number }

export const PREFERRED_FEMALE_VOICE_NAMES = [
  "Samantha",
  "Flo (English (US))",
  "Sandy (English (US))",
  "Shelley (English (US))",
  "Ava",
  "Allison",
  "Zoe",
  "Victoria",
  "Karen",
  "Moira",
  "Tessa",
  "Tara",
  "Microsoft Zira - English (United States)",
] as const;

const FEMALE_VOICE_HINT = /\b(samantha|flo|sandy|shelley|ava|allison|zoe|victoria|karen|moira|tessa|tara|aria|zira|female)\b/i;
const MALE_VOICE_HINT = /\b(albert|alex|aman|arthur|daniel|david|eddy|fred|george|grandpa|james|john|junior|liam|oliver|ralph|reed|rishi|ryan|thomas|tom)\b/i;
let speechRequest = 0;

function normalized(value: string): string {
  return value.trim().toLocaleLowerCase();
}

export function selectPreferredFemaleVoice(voices: readonly SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const localEnglish = voices.filter((voice) => voice.localService && voice.lang.toLocaleLowerCase().startsWith("en"));

  for (const name of PREFERRED_FEMALE_VOICE_NAMES) {
    const exactLocal = localEnglish.find((voice) => normalized(voice.name) === normalized(name));
    if (exactLocal) return exactLocal;
  }

  const friendlyLocal = localEnglish.find((voice) => FEMALE_VOICE_HINT.test(voice.name));
  if (friendlyLocal) return friendlyLocal;

  // Web Speech exposes no gender field. This conservative fallback avoids
  // recognizable male voices instead of silently choosing the system default.
  return localEnglish.find((voice) => !MALE_VOICE_HINT.test(voice.name))
    ?? null;
}

function playSpeech(text: string, options: SpeechOptions, request: number, voices: readonly SpeechSynthesisVoice[]): void {
  if (request !== speechRequest || typeof SpeechSynthesisUtterance === "undefined") return;
  const voice = selectPreferredFemaleVoice(voices);
  if (!voice) return;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = voice;
  utterance.lang = voice.lang;
  utterance.volume = Math.max(0, Math.min(1, options.volume));
  utterance.rate = options.rate ?? 0.86;
  utterance.pitch = 1.14;
  window.speechSynthesis.speak(utterance);
}

export function speak(text: string, options: SpeechOptions): void {
  const request = ++speechRequest;
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

  const synthesis = window.speechSynthesis;
  if (!options.enabled) {
    synthesis.cancel();
    return;
  }
  synthesis.cancel();
  const voices = synthesis.getVoices();
  if (voices.length > 0) {
    playSpeech(text, options, request, voices);
    return;
  }

  let completed = false;
  const speakWhenReady = () => {
    if (completed) return;
    completed = true;
    synthesis.removeEventListener("voiceschanged", speakWhenReady);
    playSpeech(text, options, request, synthesis.getVoices());
  };
  synthesis.addEventListener("voiceschanged", speakWhenReady, { once: true });
  window.setTimeout(speakWhenReady, 500);
}

export function stopSpeaking(): void {
  speechRequest += 1;
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}
