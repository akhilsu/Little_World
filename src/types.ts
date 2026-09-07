export type ActivityId =
  | "colors" | "shapes" | "alphabet" | "numbers" | "animals"
  | "foods" | "vehicles" | "matching" | "memory" | "draw"
  | "music" | "keyboard" | "bubbles" | "find" | "feelings"
  | "body" | "surprise" | "everyday" | "sorting" | "count-feed"
  | "big-small" | "patterns" | "puzzles";

export type AnimationLevel = "full" | "gentle" | "off";
export type ThemeName = "day" | "calm";

export interface Settings {
  childName: string;
  soundOn: boolean;
  speechOn: boolean;
  volume: number;
  animation: AnimationLevel;
  memoryPairs: 2 | 3;
  hiddenActivities: ActivityId[];
  favorites: ActivityId[];
  reminderMinutes: number;
  theme: ThemeName;
}

export interface DailyProgress {
  day: string;
  colors: string[];
  letters: string[];
  animals: string[];
  activities: Partial<Record<ActivityId, number>>;
  drawingSessions: number;
}

export interface LearningItem {
  id: string;
  name: string;
  icon: string;
  color?: string;
  group?: string;
  association?: string;
}

export interface ActivityDefinition {
  id: ActivityId;
  name: string;
  shortName: string;
  icon: string;
  color: string;
  description: string;
}
