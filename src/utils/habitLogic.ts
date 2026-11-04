import { DayRecord, HabitState, Milestone, MoodTag, TaskTheme } from '../types/habit';

export const STORAGE_KEY = 'habit_tracker_1000_v1';
export const TOTAL_DAYS = 1000;
export const BLOCK_SIZE = 100;

export const MILESTONES: Milestone[] = [
  {
    days: 7,
    title: '7-Day Gold Streak!',
    rank: 'Spark Initiate',
    msg: 'One full week of completing all 4 daily habits! You have built the spark of consistency.'
  },
  {
    days: 30,
    title: '30-Day Gold Streak!',
    rank: 'Ritual Architect',
    msg: 'One full month of all 4 habits done! Your daily rituals are turning into automatic identity.'
  },
  {
    days: 100,
    title: '100-Day Gold Streak!',
    rank: 'Centurion of Focus',
    msg: 'A full 100-day block of unbreakable discipline! You are in rare company.'
  },
  {
    days: 250,
    title: '250-Day Quarter-Millennium Streak!',
    rank: 'Vanguard Master',
    msg: 'A quarter of your 1000-day journey completed at 100% intensity!'
  },
  {
    days: 500,
    title: '500-Day Halfway Legend!',
    rank: 'Halfway Titan',
    msg: 'Halfway to 1000 days without dropping a single day. Truly extraordinary focus.'
  },
  {
    days: 1000,
    title: '1000-DAY GRAND MASTER!',
    rank: 'Millennium Sovereign',
    msg: 'You completed the entire 1000-day challenge with a 1000-day streak. Unstoppable!'
  }
];

export const TASK_THEMES: TaskTheme[] = [
  {
    id: 0,
    defaultName: 'Exercise',
    icon: '⚡',
    colorHex: '#10b981',
    confettiColors: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#059669'],
    pitchHz: 523.25, // C5
    badgeBg: 'bg-emerald-500',
    softBg: 'bg-emerald-500/15',
    activeBorder: 'border-emerald-500 ring-2 ring-emerald-500/40',
    textClass: 'text-emerald-600 dark:text-emerald-400',
    ringColor: '#10b981'
  },
  {
    id: 1,
    defaultName: 'Skill building',
    icon: '🧠',
    colorHex: '#0ea5e9',
    confettiColors: ['#0ea5e9', '#38bdf8', '#7dd3fc', '#bae6fd', '#0284c7'],
    pitchHz: 587.33, // D5
    badgeBg: 'bg-sky-500',
    softBg: 'bg-sky-500/15',
    activeBorder: 'border-sky-500 ring-2 ring-sky-500/40',
    textClass: 'text-sky-600 dark:text-sky-400',
    ringColor: '#0ea5e9'
  },
  {
    id: 2,
    defaultName: 'Reading',
    icon: '📖',
    colorHex: '#8b5cf6',
    confettiColors: ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#7c3aed'],
    pitchHz: 659.25, // E5
    badgeBg: 'bg-violet-500',
    softBg: 'bg-violet-500/15',
    activeBorder: 'border-violet-500 ring-2 ring-violet-500/40',
    textClass: 'text-violet-600 dark:text-violet-400',
    ringColor: '#8b5cf6'
  },
  {
    id: 3,
    defaultName: 'Networking',
    icon: '🤝',
    colorHex: '#f59e0b',
    confettiColors: ['#f59e0b', '#fbbf24', '#fcd34d', '#fde68a', '#d97706'],
    pitchHz: 783.99, // G5
    badgeBg: 'bg-amber-500',
    softBg: 'bg-amber-500/15',
    activeBorder: 'border-amber-500 ring-2 ring-amber-500/40',
    textClass: 'text-amber-600 dark:text-amber-400',
    ringColor: '#f59e0b'
  }
];

export const MOOD_OPTIONS: { id: MoodTag; label: string; emoji: string; colorClass: string }[] = [
  { id: 'unstoppable', label: 'Unstoppable', emoji: '🔥', colorClass: 'text-amber-500 bg-amber-500/10 border-amber-500/30' },
  { id: 'focused', label: 'Deep Focus', emoji: '🎯', colorClass: 'text-sky-500 bg-sky-500/10 border-sky-500/30' },
  { id: 'steady', label: 'Steady', emoji: '⚡', colorClass: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30' },
  { id: 'grateful', label: 'Grateful', emoji: '✨', colorClass: 'text-violet-500 bg-violet-500/10 border-violet-500/30' },
  { id: 'tired', label: 'Low Energy', emoji: '🌙', colorClass: 'text-slate-400 bg-slate-500/10 border-slate-500/30' }
];

export const DAY_ROLLOVER_HOUR = 2; // New day starts at 2:00 AM at night, not 12:00 AM midnight

export function getTodayLocalISO(overrideDate?: Date): string {
  const now = overrideDate ? new Date(overrideDate.getTime()) : new Date();
  // Shift clock back by 2 hours so 12:00 AM - 1:59:59 AM still counts as the current night's day,
  // and the new day officially begins at 2:00 AM at night.
  const shifted = new Date(now.getTime() - DAY_ROLLOVER_HOUR * 60 * 60 * 1000);
  const y = shifted.getFullYear();
  const m = String(shifted.getMonth() + 1).padStart(2, '0');
  const d = String(shifted.getDate()).padStart(2, '0');
  const sysISO = `${y}-${m}-${d}`;
  return sysISO < '2026-11-03' ? '2026-11-03' : sysISO;
}

export function getTimeUntilNextDayRollover(overrideDate?: Date): {
  hoursLeft: number;
  minutesLeft: number;
  isLateNightGraceWindow: boolean;
  statusText: string;
} {
  const now = overrideDate ? new Date(overrideDate.getTime()) : new Date();
  const currentHour = now.getHours();
  const isLateNightGraceWindow = currentHour >= 0 && currentHour < DAY_ROLLOVER_HOUR;

  const nextRollover = new Date(now.getTime());
  if (currentHour < DAY_ROLLOVER_HOUR) {
    nextRollover.setHours(DAY_ROLLOVER_HOUR, 0, 0, 0);
  } else {
    nextRollover.setDate(nextRollover.getDate() + 1);
    nextRollover.setHours(DAY_ROLLOVER_HOUR, 0, 0, 0);
  }

  const diffMs = Math.max(0, nextRollover.getTime() - now.getTime());
  const totalMinutes = Math.ceil(diffMs / 60000);
  const hoursLeft = Math.floor(totalMinutes / 60);
  const minutesLeft = totalMinutes % 60;

  const statusText = isLateNightGraceWindow
    ? `Late-Night Window · Day open until 2:00 AM (${hoursLeft}h ${minutesLeft}m left)`
    : `New day starts at 2:00 AM (${hoursLeft}h ${minutesLeft}m left)`;

  return {
    hoursLeft,
    minutesLeft,
    isLateNightGraceWindow,
    statusText
  };
}

export function addDaysISO(isoDateStr: string, daysOffset: number): string {
  const parts = isoDateStr.split('-').map(Number);
  const dt = new Date(parts[0], parts[1] - 1, parts[2]);
  dt.setDate(dt.getDate() + daysOffset);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function diffDaysISO(startISO: string, targetISO: string): number {
  const s = startISO.split('-').map(Number);
  const t = targetISO.split('-').map(Number);
  const d1 = Date.UTC(s[0], s[1] - 1, s[2]);
  const d2 = Date.UTC(t[0], t[1] - 1, t[2]);
  return Math.round((d2 - d1) / 86400000);
}

export function formatShortDate(isoDateStr: string, includeYear = false): string {
  const parts = isoDateStr.split('-').map(Number);
  const dt = new Date(parts[0], parts[1] - 1, parts[2]);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  if (includeYear) {
    return `${months[dt.getMonth()]} ${dt.getDate()}, ${dt.getFullYear()}`;
  }
  return `${months[dt.getMonth()]} ${dt.getDate()}`;
}

export function getWeekdayName(isoDateStr: string, short = true): string {
  const parts = isoDateStr.split('-').map(Number);
  const dt = new Date(parts[0], parts[1] - 1, parts[2]);
  const shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const fullDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return short ? shortDays[dt.getDay()] : fullDays[dt.getDay()];
}

export function createDefaultState(): HabitState {
  return {
    startDate: '2026-11-01',
    userChangedStartDate: false,
    lockFutureDays: true,
    taskNames: [
      TASK_THEMES[0].defaultName,
      TASK_THEMES[1].defaultName,
      TASK_THEMES[2].defaultName,
      TASK_THEMES[3].defaultName
    ],
    taskTargetsMinutes: [30, 45, 30, 20],
    days: {},
    theme: 'dark',
    volume: 0.65,
    muted: false,
    celebratedMilestones: [],
    streakFreezesUsed: []
  };
}

export function sanitizeParsedState(parsed: unknown): HabitState {
  const base = createDefaultState();
  if (!parsed || typeof parsed !== 'object') return base;
  const obj = parsed as Record<string, unknown>;

  base.userChangedStartDate = Boolean(obj.userChangedStartDate);
  if (
    base.userChangedStartDate &&
    typeof obj.startDate === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(obj.startDate)
  ) {
    base.startDate = obj.startDate;
  } else if (typeof obj.startDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(obj.startDate)) {
    base.startDate = obj.startDate;
  }

  if (typeof obj.lockFutureDays === 'boolean') {
    base.lockFutureDays = obj.lockFutureDays;
  }

  if (Array.isArray(obj.taskNames) && obj.taskNames.length === 4) {
    base.taskNames = obj.taskNames.map((n, i) => {
      const trimmed = String(n || '').trim();
      return trimmed || TASK_THEMES[i].defaultName;
    }) as [string, string, string, string];
  }

  if (Array.isArray(obj.taskTargetsMinutes) && obj.taskTargetsMinutes.length === 4) {
    base.taskTargetsMinutes = obj.taskTargetsMinutes.map((m, i) => {
      const num = Number(m);
      return Number.isFinite(num) && num >= 5 && num <= 240 ? num : base.taskTargetsMinutes[i];
    }) as [number, number, number, number];
  }

  if (obj.days && typeof obj.days === 'object') {
    const rawDays = obj.days as Record<string, unknown>;
    const cleanDays: Record<number, DayRecord> = {};
    for (const key of Object.keys(rawDays)) {
      const dNum = Number(key);
      if (!Number.isInteger(dNum) || dNum < 1 || dNum > TOTAL_DAYS) continue;
      const item = rawDays[key] as Record<string, unknown> | undefined;
      if (!item || typeof item !== 'object') continue;
      const rawTasks = Array.isArray(item.tasks) ? item.tasks : [];
      const tasks: [boolean, boolean, boolean, boolean] = [
        Boolean(rawTasks[0]),
        Boolean(rawTasks[1]),
        Boolean(rawTasks[2]),
        Boolean(rawTasks[3])
      ];
      const note = typeof item.note === 'string' ? item.note.trim() : '';
      const mood = typeof item.mood === 'string' ? (item.mood as MoodTag) : undefined;
      const focusMinutes = typeof item.focusMinutes === 'number' ? item.focusMinutes : undefined;
      if (tasks.some(Boolean) || note.length > 0 || mood || focusMinutes) {
        cleanDays[dNum] = { tasks, note, mood, focusMinutes };
      }
    }
    base.days = cleanDays;
  }

  if (obj.theme === 'light' || obj.theme === 'dark') {
    base.theme = obj.theme;
  }
  if (typeof obj.volume === 'number' && Number.isFinite(obj.volume)) {
    base.volume = Math.max(0, Math.min(1, obj.volume));
  }
  if (typeof obj.muted === 'boolean') {
    base.muted = obj.muted;
  }
  if (Array.isArray(obj.celebratedMilestones)) {
    base.celebratedMilestones = obj.celebratedMilestones
      .map(Number)
      .filter(n => Number.isFinite(n) && n > 0);
  }
  if (Array.isArray(obj.streakFreezesUsed)) {
    base.streakFreezesUsed = obj.streakFreezesUsed
      .map(Number)
      .filter(n => Number.isInteger(n) && n >= 1 && n <= TOTAL_DAYS);
  }

  return base;
}

export function getDayRecord(state: HabitState, dayNum: number): DayRecord {
  const rec = state.days[dayNum];
  if (!rec) {
    return { tasks: [false, false, false, false], note: '' };
  }
  const tasks: [boolean, boolean, boolean, boolean] =
    Array.isArray(rec.tasks) && rec.tasks.length === 4
      ? [Boolean(rec.tasks[0]), Boolean(rec.tasks[1]), Boolean(rec.tasks[2]), Boolean(rec.tasks[3])]
      : [false, false, false, false];
  return {
    tasks,
    note: typeof rec.note === 'string' ? rec.note : '',
    mood: rec.mood,
    focusMinutes: rec.focusMinutes,
    updatedAt: rec.updatedAt
  };
}

export function updateDayRecord(
  state: HabitState,
  dayNum: number,
  tasks: [boolean, boolean, boolean, boolean],
  note: string,
  mood?: MoodTag,
  focusMinutes?: number
): HabitState {
  const hasAnyTask = tasks.some(Boolean);
  const trimmedNote = (note || '').trim();
  const nextDays = { ...state.days };

  if (!hasAnyTask && !trimmedNote && !mood && !focusMinutes) {
    delete nextDays[dayNum];
  } else {
    nextDays[dayNum] = {
      tasks: [...tasks] as [boolean, boolean, boolean, boolean],
      note: trimmedNote,
      mood,
      focusMinutes,
      updatedAt: new Date().toISOString()
    };
  }
  return {
    ...state,
    days: nextDays
  };
}

export function getTodayDayNumber(startDate: string, todayISO?: string): number {
  const targetISO = todayISO || getTodayLocalISO();
  const rawDay = diffDaysISO(startDate, targetISO) + 1;
  return Math.max(1, rawDay);
}

export function isDayAllFourDone(state: HabitState, dayNum: number): boolean {
  const rec = state.days[dayNum];
  return Boolean(
    rec &&
      Array.isArray(rec.tasks) &&
      rec.tasks.length === 4 &&
      rec.tasks.every(Boolean)
  );
}

export function computeStreaks(state: HabitState, todayDayNum: number): {
  current: number;
  longest: number;
} {
  const maxCheckDay = Math.min(TOTAL_DAYS, Math.max(0, todayDayNum));
  const freezeSet = new Set(state.streakFreezesUsed || []);

  let longest = 0;
  let running = 0;
  for (let d = 1; d <= maxCheckDay; d++) {
    if (isDayAllFourDone(state, d)) {
      running++;
      if (running > longest) longest = running;
    } else if (freezeSet.has(d) && running > 0) {
      // Streak freeze protects the chain without incrementing the gold day count
      continue;
    } else {
      running = 0;
    }
  }

  let current = 0;
  if (todayDayNum >= 1) {
    let cursor = Math.min(TOTAL_DAYS, todayDayNum);
    if (!isDayAllFourDone(state, cursor) && cursor > 1 && cursor === todayDayNum) {
      cursor = todayDayNum - 1;
    }
    while (cursor >= 1) {
      if (isDayAllFourDone(state, cursor)) {
        current++;
        cursor--;
      } else if (freezeSet.has(cursor) && cursor > 1) {
        cursor--;
      } else {
        break;
      }
    }
  }

  return { current, longest: Math.max(longest, current) };
}

export interface HabitSummaryStats {
  todayDayNum: number;
  elapsedDays: number;
  goldDaysCount: number;
  partialDaysCount: number;
  missedPastDaysCount: number;
  totalTasksCompleted: number;
  taskCounts: [number, number, number, number];
  currentStreak: number;
  longestStreak: number;
  overallCompletionRateElapsed: number;
  weekdayBreakdown: { day: string; completedTasks: number; totalPossible: number; pct: number }[];
  notesCount: number;
  totalFocusMinutes: number;
}

export function computeSummaryStats(state: HabitState, todayISO?: string): HabitSummaryStats {
  const todayDayNum = getTodayDayNumber(state.startDate, todayISO);
  const elapsedDays = Math.max(1, Math.min(TOTAL_DAYS, todayDayNum));

  let goldDaysCount = 0;
  let partialDaysCount = 0;
  let totalTasksCompleted = 0;
  let notesCount = 0;
  let totalFocusMinutes = 0;
  const taskCounts: [number, number, number, number] = [0, 0, 0, 0];

  Object.keys(state.days).forEach(k => {
    const dNum = Number(k);
    if (dNum >= 1 && dNum <= TOTAL_DAYS) {
      const rec = state.days[dNum];
      if (!rec) return;
      if (rec.note && rec.note.trim().length > 0) notesCount++;
      if (typeof rec.focusMinutes === 'number') totalFocusMinutes += rec.focusMinutes;
      if (Array.isArray(rec.tasks)) {
        let c = 0;
        rec.tasks.forEach((done, idx) => {
          if (done) {
            taskCounts[idx]++;
            totalTasksCompleted++;
            c++;
          }
        });
        if (c === 4) goldDaysCount++;
        else if (c > 0) partialDaysCount++;
      }
    }
  });

  let missedPastDaysCount = 0;
  for (let d = 1; d < Math.min(TOTAL_DAYS + 1, todayDayNum); d++) {
    const rec = getDayRecord(state, d);
    if (rec.tasks.every(t => !t)) {
      missedPastDaysCount++;
    }
  }

  // Weekday breakdown across elapsed days
  const weekdayMap = [
    { day: 'Sun', completedTasks: 0, totalPossible: 0, pct: 0 },
    { day: 'Mon', completedTasks: 0, totalPossible: 0, pct: 0 },
    { day: 'Tue', completedTasks: 0, totalPossible: 0, pct: 0 },
    { day: 'Wed', completedTasks: 0, totalPossible: 0, pct: 0 },
    { day: 'Thu', completedTasks: 0, totalPossible: 0, pct: 0 },
    { day: 'Fri', completedTasks: 0, totalPossible: 0, pct: 0 },
    { day: 'Sat', completedTasks: 0, totalPossible: 0, pct: 0 }
  ];

  for (let d = 1; d <= elapsedDays; d++) {
    const dateISO = addDaysISO(state.startDate, d - 1);
    const parts = dateISO.split('-').map(Number);
    const dt = new Date(parts[0], parts[1] - 1, parts[2]);
    const wIdx = dt.getDay();
    const rec = getDayRecord(state, d);
    const doneCount = rec.tasks.filter(Boolean).length;
    weekdayMap[wIdx].completedTasks += doneCount;
    weekdayMap[wIdx].totalPossible += 4;
  }

  weekdayMap.forEach(item => {
    item.pct =
      item.totalPossible > 0
        ? Math.round((item.completedTasks / item.totalPossible) * 100)
        : 0;
  });

  const { current, longest } = computeStreaks(state, todayDayNum);
  const maxPossibleElapsedTasks = elapsedDays * 4;
  const overallCompletionRateElapsed = Math.min(
    100,
    Math.round((totalTasksCompleted / maxPossibleElapsedTasks) * 100)
  );

  return {
    todayDayNum,
    elapsedDays,
    goldDaysCount,
    partialDaysCount,
    missedPastDaysCount,
    totalTasksCompleted,
    taskCounts,
    currentStreak: current,
    longestStreak: longest,
    overallCompletionRateElapsed,
    weekdayBreakdown: weekdayMap,
    notesCount,
    totalFocusMinutes
  };
}
