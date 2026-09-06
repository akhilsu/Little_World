import { DEFAULT_SETTINGS, STORAGE_KEYS } from "../config";
import type { DailyProgress, Settings } from "../types";

export function todayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function emptyProgress(): DailyProgress {
  return { day: todayKey(), colors: [], letters: [], animals: [], activities: {}, drawingSessions: 0 };
}

export function loadSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEYS.settings) ?? "{}");
    return { ...DEFAULT_SETTINGS, ...value };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): void {
  try { localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings)); } catch { /* Storage can be unavailable in private contexts. */ }
}

export function loadProgress(): DailyProgress {
  if (typeof window === "undefined") return emptyProgress();
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEYS.progress) ?? "null") as DailyProgress | null;
    return value?.day === todayKey() ? value : emptyProgress();
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(progress: DailyProgress): void {
  try { localStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(progress)); } catch { /* Keep play working even if storage is full. */ }
}

export function resetStoredProgress(): void {
  try { localStorage.removeItem(STORAGE_KEYS.progress); } catch { /* No-op fallback. */ }
}
