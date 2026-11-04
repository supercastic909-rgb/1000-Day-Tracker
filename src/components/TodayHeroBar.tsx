import React from 'react';
import { HabitState } from '../types/habit';
import {
  addDaysISO,
  formatShortDate,
  getDayRecord,
  getWeekdayName,
  MOOD_OPTIONS,
  TASK_THEMES,
  TOTAL_DAYS
} from '../utils/habitLogic';
import { Check, Crown, FileText, Sparkles, Timer } from 'lucide-react';

interface TodayHeroBarProps {
  state: HabitState;
  todayDayNum: number;
  rolloverStatusText: string;
  selectedTaskIndex: number | null;
  onDirectToggleTodayTask: (taskIdx: number, originEl: HTMLElement) => void;
  onOpenDayNote: (dayNum: number) => void;
  onOpenFocusTimerForTask: (taskIdx: number) => void;
}

export const TodayHeroBar: React.FC<TodayHeroBarProps> = ({
  state,
  todayDayNum,
  rolloverStatusText,
  selectedTaskIndex,
  onDirectToggleTodayTask,
  onOpenDayNote,
  onOpenFocusTimerForTask
}) => {
  const clampedToday = Math.max(1, Math.min(TOTAL_DAYS, todayDayNum));
  const todayRec = getDayRecord(state, clampedToday);
  const doneCount = todayRec.tasks.filter(Boolean).length;
  const isAllDone = doneCount === 4;
  const dateISO = addDaysISO(state.startDate, clampedToday - 1);
  const formattedDate = formatShortDate(dateISO, true);
  const weekday = getWeekdayName(dateISO, false);
  const moodObj = todayRec.mood ? MOOD_OPTIONS.find(m => m.id === todayRec.mood) : undefined;

  return (
    <section
      aria-label="Today's Daily Ritual Dock"
      className={`rounded-2xl border p-4 transition-all duration-300 ${
        isAllDone
          ? 'day-gold border-amber-500/80'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm'
      }`}
    >
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Left: Today Identity & Completion Ring */}
        <div className="flex items-center gap-3.5">
          <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
              <circle
                cx="28"
                cy="28"
                r="23"
                fill="none"
                stroke="currentColor"
                strokeWidth="4.5"
                className="text-slate-200 dark:text-slate-800"
              />
              <circle
                cx="28"
                cy="28"
                r="23"
                fill="none"
                stroke={isAllDone ? '#f59e0b' : '#0ea5e9'}
                strokeWidth="4.5"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 23}
                strokeDashoffset={2 * Math.PI * 23 * (1 - doneCount / 4)}
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {isAllDone ? (
                <Crown className="w-5 h-5 text-amber-500" />
              ) : (
                <span className="font-mono text-xs font-extrabold tabular-nums text-slate-900 dark:text-white">
                  {doneCount}/4
                </span>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                Today&apos;s Ritual · Day {clampedToday}
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs font-mono text-slate-600 dark:text-slate-300">
                {weekday}, {formattedDate}
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span
                id="rollover-status-badge"
                className="text-[11px] font-mono font-semibold text-indigo-600 dark:text-indigo-400"
              >
                {rolloverStatusText}
              </span>
              {moodObj && (
                <>
                  <span className="text-xs text-slate-400">·</span>
                  <span className="text-xs font-medium text-amber-600 dark:text-amber-300">
                    {moodObj.emoji} {moodObj.label}
                  </span>
                </>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-white mt-0.5">
              {isAllDone
                ? `All 4 Daily Habits Complete for Day ${clampedToday}!`
                : `${4 - doneCount} habit${4 - doneCount === 1 ? '' : 's'} remaining to unlock Today's Gold Crown`}
            </h2>
          </div>
        </div>

        {/* Center/Right: Quick 1-Tap Today Habit Cards + Note / Timer */}
        <div className="flex flex-wrap items-center gap-2">
          {TASK_THEMES.map((t, idx) => {
            const done = todayRec.tasks[idx];
            const isMarkerSelected = selectedTaskIndex === idx;
            return (
              <div
                key={t.id}
                className="flex items-center transition-transform duration-150 hover:-translate-y-0.5 active:scale-95"
              >
                <button
                  type="button"
                  onClick={e => onDirectToggleTodayTask(idx, e.currentTarget)}
                  aria-label={`Mark ${state.taskNames[idx]} on Today Day ${clampedToday}`}
                  className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                    done
                      ? `${t.badgeBg} text-white border-transparent shadow-sm`
                      : isMarkerSelected
                        ? `${t.softBg} ${t.textClass} border-current`
                        : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                  }`}
                >
                  <span>{t.icon}</span>
                  <span>{state.taskNames[idx]}</span>
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                      done
                        ? 'bg-white/25 text-white'
                        : 'border border-slate-300 dark:border-slate-600 text-transparent'
                    }`}
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                </button>
              </div>
            );
          })}

          <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 mx-0.5 hidden sm:block" />

          <button
            type="button"
            onClick={() => onOpenFocusTimerForTask(selectedTaskIndex ?? 0)}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap"
            title="Start a Focus Timer for Today"
          >
            <Timer className="w-3.5 h-3.5 text-violet-500" />
            <span>Timer</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenDayNote(clampedToday)}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap"
            title="Write Today's Reflection Note & Mood"
          >
            {todayRec.note ? (
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            ) : (
              <FileText className="w-3.5 h-3.5 text-sky-500" />
            )}
            <span>{todayRec.note ? 'Edit Note' : 'Daily Note'}</span>
          </button>
        </div>
      </div>
    </section>
  );
};
