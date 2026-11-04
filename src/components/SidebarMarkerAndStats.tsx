import React, { useState } from 'react';
import { HabitState, Milestone } from '../types/habit';
import {
  getDayRecord,
  HabitSummaryStats,
  MILESTONES,
  TASK_THEMES,
  TOTAL_DAYS
} from '../utils/habitLogic';
import { Check, Crown, Edit3, Shield, X } from 'lucide-react';

interface SidebarMarkerAndStatsProps {
  state: HabitState;
  stats: HabitSummaryStats;
  selectedTaskIndex: number | null;
  markerPulse: boolean;
  saveStatusText: string;
  onSelectTask: (idx: number | null) => void;
  onUpdateTaskNames: (names: [string, string, string, string]) => void;
  onManualSaveAndLock: () => void;
  onPreviewMilestone: (milestone: Milestone) => void;
}

export const SidebarMarkerAndStats: React.FC<SidebarMarkerAndStatsProps> = ({
  state,
  stats,
  selectedTaskIndex,
  markerPulse,
  saveStatusText,
  onSelectTask,
  onUpdateTaskNames,
  onManualSaveAndLock,
  onPreviewMilestone
}) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [draftNames, setDraftNames] = useState<[string, string, string, string]>([
    ...state.taskNames
  ]);

  const handleOpenRename = () => {
    if (!isRenaming) {
      setDraftNames([...state.taskNames]);
      setIsRenaming(true);
    } else {
      onUpdateTaskNames(draftNames);
      setIsRenaming(false);
    }
  };

  const handleDraftChange = (index: number, value: string) => {
    const next = [...draftNames] as [string, string, string, string];
    next[index] = value;
    setDraftNames(next);
    onUpdateTaskNames(next);
  };

  const nextMilestone = MILESTONES.find(m => m.days > stats.currentStreak);

  // Weekly Summary (Last 7 days ending at Today, or Days 1..7 if early)
  const weekEndDay = stats.todayDayNum >= 1 ? Math.min(TOTAL_DAYS, stats.todayDayNum) : 7;
  const weekStartDay = Math.max(1, weekEndDay - 6);
  let weeklyDoneTasks = 0;
  const weekDays: { dayNum: number; doneCount: number; isToday: boolean }[] = [];

  for (let i = 0; i < 7; i++) {
    const dNum = weekStartDay + i;
    const rec = getDayRecord(state, dNum);
    const doneCount = rec.tasks.filter(Boolean).length;
    weeklyDoneTasks += doneCount;
    weekDays.push({
      dayNum: dNum,
      doneCount,
      isToday: dNum === stats.todayDayNum
    });
  }

  const weekPct = Math.min(100, Math.round((weeklyDoneTasks / 28) * 100));

  return (
    <aside className="w-full lg:w-80 xl:w-[340px] shrink-0 lg:sticky lg:top-16 z-20 flex flex-col gap-4">
      {/* 1. TASK MARKER PANEL */}
      <section
        id="marker-panel"
        className={`rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-2 border-slate-200 dark:border-slate-800 p-3.5 sm:p-4 shadow-sm transition-all duration-200 ${
          markerPulse ? 'marker-attention' : ''
        }`}
      >
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 whitespace-nowrap">
              1. Task Marker
            </span>
            <span
              id="active-marker-badge"
              className={`text-[11px] font-semibold truncate ${
                selectedTaskIndex === null
                  ? 'text-rose-600 dark:text-rose-400'
                  : TASK_THEMES[selectedTaskIndex].textClass
              }`}
            >
              ·{' '}
              {selectedTaskIndex === null
                ? 'Pick a task first'
                : `${TASK_THEMES[selectedTaskIndex].icon} ${state.taskNames[selectedTaskIndex]}`}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {selectedTaskIndex !== null && (
              <button
                id="clear-marker-btn"
                type="button"
                onClick={() => onSelectTask(null)}
                className="px-2 py-0.5 rounded-md text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-slate-800 transition flex items-center gap-1"
                title="Deselect Active Task (Esc)"
              >
                <X className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )}
            <button
              id="edit-tasks-btn"
              type="button"
              onClick={handleOpenRename}
              className="px-2 py-0.5 rounded-md text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:bg-sky-500/10 transition flex items-center gap-1"
              title="Edit the 4 daily task names"
            >
              <Edit3 className="w-3 h-3" />
              <span>Rename</span>
            </button>
          </div>
        </div>

        {/* 4 Task Buttons */}
        <div
          id="marker-buttons-container"
          className="grid grid-cols-2 lg:grid-cols-1 gap-2"
        >
          {TASK_THEMES.map((t, idx) => {
            const isSelected = selectedTaskIndex === idx;
            const count = stats.taskCounts[idx];
            const pctElapsed = Math.min(100, Math.round((count / stats.elapsedDays) * 100));

            return (
              <button
                key={t.id}
                type="button"
                data-task-select={idx}
                onClick={() => onSelectTask(isSelected ? null : idx)}
                className={`group relative w-full text-left p-2.5 sm:p-3 rounded-xl border transition-all duration-150 hover:scale-[1.01] active:scale-[0.98] flex items-center justify-between gap-2 ${
                  isSelected
                    ? `${t.softBg} ${t.activeBorder} shadow-sm`
                    : 'bg-slate-50/90 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0 shadow-sm text-white ${t.badgeBg}`}
                  >
                    {t.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs sm:text-sm font-bold truncate text-slate-900 dark:text-white">
                        {state.taskNames[idx]}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                      {count}d done · {pctElapsed}%
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`hidden sm:inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-mono font-bold ${
                      isSelected
                        ? `${t.badgeBg} text-white`
                        : 'bg-slate-200/80 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span
                    className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                      isSelected
                        ? `${t.badgeBg} border-white dark:border-slate-950 scale-110`
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {isSelected && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Explicit Save & Lock Status Bar */}
        <div className="mt-3 pt-2.5 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              id="save-status-text"
              className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate font-mono"
            >
              {saveStatusText}
            </span>
          </div>
          <button
            id="manual-save-btn"
            type="button"
            onClick={onManualSaveAndLock}
            className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] shadow-sm transition shrink-0 whitespace-nowrap"
          >
            ✓ Save &amp; Lock
          </button>
        </div>

        {/* Inline Task Rename Editor */}
        {isRenaming && (
          <div
            id="task-rename-panel"
            className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2 animate-pop"
          >
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Customize Daily Task Names:
            </div>
            <div className="space-y-1.5">
              {TASK_THEMES.map((t, idx) => (
                <div key={t.id} className="flex items-center gap-2">
                  <span className="text-xs">{t.icon}</span>
                  <input
                    id={`rename-input-${idx}`}
                    type="text"
                    maxLength={28}
                    value={draftNames[idx]}
                    onChange={e => handleDraftChange(idx, e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        setIsRenaming(false);
                      }
                    }}
                    aria-label={`Rename habit ${idx + 1}`}
                    className="w-full px-2.5 py-1 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white"
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsRenaming(false)}
                className="px-3 py-1 rounded-lg text-xs font-semibold bg-amber-500 text-slate-950 hover:bg-amber-400"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 2. STREAK & MILESTONES CARD */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Gold Streaks (All 4 Done)
          </h2>
          <span className="text-xs text-amber-500 font-semibold flex items-center gap-1">
            <Crown className="w-3.5 h-3.5" />
            <span>4/4 Tasks</span>
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 mb-3.5">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25">
            <div className="text-[11px] font-medium text-amber-700 dark:text-amber-300/80">
              Current Streak
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span
                id="stat-current-streak"
                className="text-2xl font-extrabold font-mono text-amber-600 dark:text-amber-400 tabular-nums"
              >
                {stats.currentStreak}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">days</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Longest Streak
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span
                id="stat-longest-streak"
                className="text-2xl font-extrabold font-mono text-slate-800 dark:text-slate-100 tabular-nums"
              >
                {stats.longestStreak}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">days</span>
            </div>
          </div>
        </div>

        {/* Milestone Badges (7, 30, 100, 250, 500, 1000) */}
        <div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1.5">
            <span>Streak Milestones</span>
            <span className="font-mono text-amber-600 dark:text-amber-400">
              {nextMilestone ? `Next: ${nextMilestone.days}d (${nextMilestone.rank})` : 'All Unlocked!'}
            </span>
          </div>
          <div id="milestone-chips" className="grid grid-cols-6 gap-1">
            {MILESTONES.map(m => {
              const unlocked = stats.longestStreak >= m.days || stats.currentStreak >= m.days;
              return (
                <button
                  key={m.days}
                  type="button"
                  onClick={() => onPreviewMilestone(m)}
                  title={
                    unlocked
                      ? `Unlocked: ${m.title} (Click to celebrate!)`
                      : `Reach a ${m.days}-day streak of all 4 tasks`
                  }
                  className={`py-1.5 px-1 rounded-lg font-mono text-[11px] font-bold border text-center transition ${
                    unlocked
                      ? 'bg-amber-500/20 border-amber-400 text-amber-600 dark:text-amber-300 shadow-sm hover:scale-105'
                      : 'bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:border-slate-400'
                  }`}
                >
                  {unlocked ? '🏆' : ''}
                  {m.days}d
                </button>
              );
            })}
          </div>
        </div>

        {state.streakFreezesUsed.length > 0 && (
          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-sky-600 dark:text-sky-400">
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" />
              <span>Streak Shields Active</span>
            </span>
            <span className="font-mono font-bold">{state.streakFreezesUsed.length} used</span>
          </div>
        )}
      </section>

      {/* 3. WEEKLY SUMMARY & PER-TASK COMPLETION STATS */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              This Week (Last 7 Days)
            </h2>
            <span
              id="weekly-summary-count"
              className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums"
            >
              {weeklyDoneTasks} / 28 tasks
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mb-2">
            <div
              id="weekly-summary-bar"
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-sky-500 transition-all duration-300"
              style={{ width: `${weekPct}%` }}
            />
          </div>
          <div id="weekly-mini-days" className="grid grid-cols-7 gap-1 pt-0.5">
            {weekDays.map(wd => {
              const heightPct = (wd.doneCount / 4) * 100;
              return (
                <div
                  key={wd.dayNum}
                  className="flex flex-col items-center gap-1"
                  title={`Day ${wd.dayNum}: ${wd.doneCount}/4 tasks`}
                >
                  <div
                    className={`w-full h-9 rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 flex items-end overflow-hidden border ${
                      wd.isToday ? 'border-sky-400' : 'border-transparent'
                    }`}
                  >
                    <div
                      className={`w-full rounded-[4px] transition-all duration-300 ${
                        wd.doneCount === 4 ? 'bg-amber-400' : 'bg-emerald-500'
                      }`}
                      style={{
                        height: `${Math.max(12, heightPct)}%`,
                        opacity: wd.doneCount === 0 ? 0.15 : 1
                      }}
                    />
                  </div>
                  <span
                    className={`text-[10px] font-mono tabular-nums ${
                      wd.isToday ? 'font-bold text-sky-500' : 'text-slate-400'
                    }`}
                  >
                    D{wd.dayNum}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Per-Task Completion Percentage & Total Count */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Per-Task Completion
            </h2>
            <span className="text-[11px] text-slate-400 font-mono tabular-nums">
              of {stats.elapsedDays} elapsed days
            </span>
          </div>
          <div id="per-task-stats-list" className="space-y-2.5">
            {TASK_THEMES.map((t, idx) => {
              const total = stats.taskCounts[idx];
              const pctElapsed = Math.min(100, Math.round((total / stats.elapsedDays) * 100));
              const pct1000 = ((total / TOTAL_DAYS) * 100).toFixed(1);
              return (
                <div key={t.id}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                      <span>{t.icon}</span>
                      <span>{state.taskNames[idx]}</span>
                    </span>
                    <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300 tabular-nums">
                      <strong>{total}</strong>d ({pctElapsed}% · {pct1000}% of 1K)
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${t.badgeBg} transition-all duration-300`}
                      style={{ width: `${pctElapsed}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </aside>
  );
};
