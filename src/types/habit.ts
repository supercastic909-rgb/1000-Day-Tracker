export type MoodTag = 'unstoppable' | 'focused' | 'steady' | 'tired' | 'grateful';

export interface DayRecord {
  tasks: [boolean, boolean, boolean, boolean];
  note: string;
  mood?: MoodTag;
  focusMinutes?: number;
  updatedAt?: string;
}

export interface HabitState {
  startDate: string; // YYYY-MM-DD (default '2026-11-01')
  userChangedStartDate: boolean;
  lockFutureDays: boolean; // true = Past days auto-locked (with 1-click recovery); Future days (> Today) are ALWAYS strictly locked
  taskNames: [string, string, string, string];
  taskTargetsMinutes: [number, number, number, number];
  days: Record<number, DayRecord>;
  theme: 'dark' | 'light';
  volume: number;
  muted: boolean;
  celebratedMilestones: number[];
  streakFreezesUsed: number[]; // Day numbers where a streak shield was applied
}

export interface TaskTheme {
  id: 0 | 1 | 2 | 3;
  defaultName: string;
  icon: string;
  colorHex: string;
  confettiColors: string[];
  pitchHz: number;
  badgeBg: string;
  softBg: string;
  activeBorder: string;
  textClass: string;
  ringColor: string;
}

export interface Milestone {
  days: number;
  title: string;
  rank: string;
  msg: string;
}

export type FilterMode = 'all' | 'gold' | 'partial' | 'missed' | 'noted';
export type ViewMode = 'grid100' | 'map1000' | 'analytics';
