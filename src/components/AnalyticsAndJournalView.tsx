import React, { useState } from 'react';
import { HabitState, MoodTag } from '../types/habit';
import {
  addDaysISO,
  formatShortDate,
  getDayRecord,
  HabitSummaryStats,
  MOOD_OPTIONS,
  TASK_THEMES,
  TOTAL_DAYS
} from '../utils/habitLogic';
import {
  Award,
  BookOpen,
  Calendar,
  Clock,
  Crown,
  Edit2,
  Flame,
  Search,
  Shield,
  Sparkles,
  TrendingUp
} from 'lucide-react';

interface AnalyticsAndJournalViewProps {
  state: HabitState;
  stats: HabitSummaryStats;
  onOpenNoteModal: (dayNum: number) => void;
  onToggleStreakFreeze: (dayNum: number) => void;
  onJumpToDayInGrid: (dayNum: number) => void;
}

export const AnalyticsAndJournalView: React.FC<AnalyticsAndJournalViewProps> = ({
  state,
  stats,
  onOpenNoteModal,
  onToggleStreakFreeze,
  onJumpToDayInGrid
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [moodFilter, setMoodFilter] = useState<MoodTag | 'all'>('all');

  // Gather all days with notes or moods or completed tasks (sorted newest first)
  const journalEntries = Object.keys(state.days)
    .map(Number)
    .filter(dNum => dNum >= 1 && dNum <= TOTAL_DAYS)
    .sort((a, b) => b - a)
    .map(dNum => {
      const rec = getDayRecord(state, dNum);
      const dateISO = addDaysISO(state.startDate, dNum - 1);
      return {
        dayNum: dNum,
        dateISO,
        formattedDate: formatShortDate(dateISO, true),
        rec,
        doneCount: rec.tasks.filter(Boolean).length
      };
    })
    .filter(entry => {
      const hasNoteOrMood = entry.rec.note.trim().length > 0 || Boolean(entry.rec.mood);
      if (!hasNoteOrMood && searchQuery.trim() === '' && moodFilter === 'all') {
        // Show entries with notes/moods by default, or all logged days if none have notes yet
        return true;
      }
      if (moodFilter !== 'all' && entry.rec.mood !== moodFilter) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchNote = entry.rec.note.toLowerCase().includes(q);
        const matchDay = `day ${entry.dayNum}`.includes(q) || entry.formattedDate.toLowerCase().includes(q);
        return matchNote || matchDay;
      }
      return true;
    });

  // Find missed past days that can be protected with a Streak Shield
  const missedPastDays: number[] = [];
  for (let d = Math.max(1, stats.todayDayNum - 30); d < stats.todayDayNum; d++) {
    const rec = getDayRecord(state, d);
    if (!rec.tasks.every(Boolean)) {
      missedPastDays.push(d);
    }
  }

  return (
    <div className="space-y-4">
      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Elapsed Consistency</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white mt-1 tabular-nums">
            {stats.overallCompletionRateElapsed}%
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
            {stats.totalTasksCompleted} of {stats.elapsedDays * 4} elapsed tasks done
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Gold 4/4 Days</span>
            <Crown className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-amber-600 dark:text-amber-400 mt-1 tabular-nums">
            {stats.goldDaysCount}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
            {stats.partialDaysCount} partial days · {stats.missedPastDaysCount} missed
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Deep Focus Logged</span>
            <Clock className="w-4 h-4 text-violet-500" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white mt-1 tabular-nums">
            {stats.totalFocusMinutes}m
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
            {(stats.totalFocusMinutes / 60).toFixed(1)} hours via Focus Timer
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Reflections Written</span>
            <BookOpen className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white mt-1 tabular-nums">
            {stats.notesCount}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Daily journal notes saved
          </div>
        </div>
      </div>

      {/* Middle 2-Column Split: Weekday Performance + Streak Shield Manager */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Day-of-Week Performance Distribution */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Day-of-Week Habit Velocity
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Completion rate across elapsed weekdays
              </p>
            </div>
            <Calendar className="w-4 h-4 text-slate-400" />
          </div>

          <div className="grid grid-cols-7 gap-2 pt-2">
            {stats.weekdayBreakdown.map(w => (
              <div key={w.day} className="flex flex-col items-center gap-1.5">
                <div className="w-full h-28 rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1 flex items-end overflow-hidden">
                  <div
                    className="w-full rounded-lg bg-gradient-to-t from-sky-500 to-emerald-400 transition-all duration-500"
                    style={{
                      height: `${Math.max(8, w.pct)}%`,
                      opacity: w.pct === 0 ? 0.2 : 1
                    }}
                  />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {w.day}
                </span>
                <span className="text-[10px] font-mono text-slate-500 tabular-nums">
                  {w.pct}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Streak Shield Protection Manager */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-500" />
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Streak Freeze Shields
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 tabular-nums">
                {state.streakFreezesUsed.length} / 5 Shields Used
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
              Life happens. Applying a Streak Shield to a past partial or missed day bridges your
              Gold Streak across that day without falsely inflating your Gold Day count.
            </p>

            {missedPastDays.length === 0 ? (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                Every past day is already 4/4 Gold! No Streak Shields needed right now.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {missedPastDays.map(dNum => {
                  const isShielded = state.streakFreezesUsed.includes(dNum);
                  const rec = getDayRecord(state, dNum);
                  const doneCount = rec.tasks.filter(Boolean).length;
                  const dateISO = addDaysISO(state.startDate, dNum - 1);
                  return (
                    <div
                      key={dNum}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          Day {dNum}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span className="font-mono text-slate-500">
                          {formatShortDate(dateISO, false)}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-500">{doneCount}/4 done</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onToggleStreakFreeze(dNum)}
                        className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition ${
                          isShielded
                            ? 'bg-cyan-500 text-slate-950 font-bold'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-cyan-500/20'
                        }`}
                      >
                        {isShielded ? '🛡️ Shield Active' : 'Apply Shield'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom: Searchable 1000-Day Reflection Journal */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>1000-Day Reflection &amp; Activity Log</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Review your daily notes, moods, and habit completions across the journey
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search notes or Day #..."
                aria-label="Search journal notes"
                className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="button"
              onClick={() => onOpenNoteModal(Math.max(1, Math.min(TOTAL_DAYS, stats.todayDayNum)))}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
            >
              + Log Today&apos;s Note
            </button>
          </div>
        </div>

        {/* Mood Filter Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3">
          <button
            type="button"
            onClick={() => setMoodFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
              moodFilter === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            All Entries ({journalEntries.length})
          </button>
          {MOOD_OPTIONS.map(m => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMoodFilter(m.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                moodFilter === m.id
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {m.emoji} {m.label}
            </button>
          ))}
        </div>

        {journalEntries.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No logged days or reflection notes match your filter yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
            {journalEntries.map(item => {
              const moodObj = item.rec.mood
                ? MOOD_OPTIONS.find(m => m.id === item.rec.mood)
                : undefined;
              return (
                <div
                  key={item.dayNum}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onJumpToDayInGrid(item.dayNum)}
                          className="font-mono text-xs font-extrabold text-amber-600 dark:text-amber-400 hover:underline"
                        >
                          Day {item.dayNum}
                        </button>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs font-mono text-slate-500">
                          {item.formattedDate}
                        </span>
                        {moodObj && (
                          <>
                            <span className="text-xs text-slate-400">·</span>
                            <span className="text-xs font-medium">
                              {moodObj.emoji} {moodObj.label}
                            </span>
                          </>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => onOpenNoteModal(item.dayNum)}
                        className="text-xs text-sky-500 hover:text-sky-400 flex items-center gap-1 font-semibold"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    </div>

                    {item.rec.note ? (
                      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 mt-2 leading-relaxed">
                        {item.rec.note}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 italic mt-1.5">
                        No written reflection note — {item.doneCount}/4 habits completed.
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/50">
                    <div className="flex items-center gap-1.5">
                      {TASK_THEMES.map((t, idx) => (
                        <span
                          key={t.id}
                          title={state.taskNames[idx]}
                          className={`text-[11px] px-1.5 py-0.5 rounded ${
                            item.rec.tasks[idx]
                              ? `${t.softBg} ${t.textClass} font-bold`
                              : 'opacity-30'
                          }`}
                        >
                          {t.icon}
                        </span>
                      ))}
                    </div>
                    <span className="text-[11px] font-mono font-bold text-slate-500 tabular-nums">
                      {item.doneCount}/4 Tasks
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
