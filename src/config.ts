import type { Settings } from "./types";

export const APP_NAME = "Little World";
export const DEFAULT_CHILD_NAME = "Avyaan";
export const STORAGE_KEYS = {
  settings: "little-world-settings-v1",
  progress: "little-world-progress-v1",
} as const;

export const DEFAULT_SETTINGS: Settings = {
  childName: DEFAULT_CHILD_NAME,
  soundOn: true,
  speechOn: true,
  volume: 0.55,
  animation: "full",
  memoryPairs: 2,
  hiddenActivities: [],
  favorites: ["colors", "animals", "draw"],
  reminderMinutes: 20,
  theme: "day",
};
