import React, { useState } from 'react';
import { FilterMode, HabitState } from '../types/habit';
import {
  addDaysISO,
  BLOCK_SIZE,
  formatShortDate,
  getDayRecord,
  isDayAllFourDone,
  MOOD_OPTIONS,
  TASK_THEMES
} from '../utils/habitLogic';
import { Crown, FileText, Filter, Lock, Shield, Sparkles } from 'lucide-react';

interface HundredDayGridProps {
  state: HabitState;
  todayDayNum: number;
  currentBlockIndex: number;
  selectedTaskIndex: number | null;
  lastPoppedDay: { dayNum: number; label: string; color: string; ts: number } | null;
  onSelectBlock: (blockIdx: number) => void;
  onTapDayBox: (dayNum: number, boxElement: HTMLElement) => void;
  onOpenNoteModal: (dayNum: number) => void;
}

export const HundredDayGrid: React.FC<HundredDayGridProps> = ({
  state,
  todayDayNum,
  currentBlockIndex,
  selectedTaskIndex,
  lastPoppedDay,
  onSelectBlock,
  onTapDayBox,
  onOpenNoteModal
}) => {
  const [filterMode, setFilterMode] = useState<FilterMode>('all');

  const blockStart = currentBlockIndex * BLOCK_SIZE + 1;
  const blockEnd = (currentBlockIndex + 1) * BLOCK_SIZE;
  const startISO = addDaysISO(state.startDate, blockStart - 1);
  const endISO = addDaysISO(state.startDate, blockEnd - 1);

  let blockGoldCount = 0;
  const daysInBlock: number[] = [];
  for (let d = blockStart; d <= blockEnd; d++) {
    if (isDayAllFourDone(state, d)) blockGoldCount++;
    daysInBlock.push(d);
  }

  const filteredDays = daysInBlock.filter(dayNum => {
    if (filterMode === 'all') return true;
    const rec = getDayRecord(state, dayNum);
    const doneCount = rec.tasks.filter(Boolean).length;
    const isPast = dayNum < todayDayNum;
    if (filterMode === 'gold') return doneCount === 4;
    if (filterMode === 'partial') return doneCount > 0 && doneCount < 4;
    if (filterMode === 'missed') return isPast && doneCount === 0;
    if (filterMode === 'noted') return rec.note.trim().length > 0 || Boolean(rec.mood);
    return true;
  });

  const freezeSet = new Set(state.streakFreezesUsed || []);

  return (
    <div className="space-y-3.5">
      {/* 10 Blocks of 100 Days Navigation Tabs */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              2. Browse 100-Day Blocks
            </span>
            <span
              id="current-block-date-range"
              className="text-xs font-mono text-slate-500 dark:text-slate-400"
            >
              · {formatShortDate(startISO, true)} → {formatShortDate(endISO, true)}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" /> 4/4 Gold
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-sky-500/40 border border-sky-400 inline-block" />{' '}
              Partial
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm border border-dashed border-rose-400 inline-block" />{' '}
              Missed
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Note
            </span>
          </div>
        </div>

        <div
          id="block-tabs-container"
          className="grid grid-cols-2 sm:grid-cols-5 xl:grid-cols-10 gap-1.5"
        >
          {Array.from({ length: 10 }).map((_, b) => {
            const bStart = b * BLOCK_SIZE + 1;
            const bEnd = (b + 1) * BLOCK_SIZE;
            const isCurrent = b === currentBlockIndex;
            const hasToday = todayDayNum >= bStart && todayDayNum <= bEnd;

            let goldInBlock = 0;
            for (let d = bStart; d <= bEnd; d++) {
              if (isDayAllFourDone(state, d)) goldInBlock++;
            }

            return (
              <button
                key={b}
                type="button"
                data-block-tab={b}
                onClick={() => onSelectBlock(b)}
                className={`relative p-2 rounded-xl border text-left transition-all ${
                  isCurrent
                    ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 border-slate-900 dark:border-amber-400 shadow-sm font-bold'
                    : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-mono text-[11px] font-bold tabular-nums">
                    {bStart}–{bEnd}
                  </span>
                  {hasToday && (
                    <span
                      className="text-[9px] font-mono uppercase px-1 rounded bg-sky-500/20 text-sky-400 font-bold"
                      title="Contains Today"
                    >
                      Now
                    </span>
                  )}
                </div>
                <div className="text-[10px] opacity-80 font-mono mt-0.5 flex items-center justify-between tabular-nums">
                  <span>👑 {goldInBlock}</span>
                  <span>{goldInBlock}%</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 100-Day Interactive Grid Container */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 sm:p-4 shadow-sm">
        {/* Block Header + Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <h2
              id="grid-block-title"
              className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-white"
            >
              Days {blockStart} – {blockEnd}
            </h2>
            <span
              id="grid-block-gold-badge"
              className="text-xs font-mono font-semibold text-amber-600 dark:text-amber-400 tabular-nums"
            >
              · {blockGoldCount} / 100 Gold Days
            </span>
          </div>

          {/* Filter Segmented Control */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/70 overflow-x-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-0.5 shrink-0" />
            {(
              [
                { id: 'all', label: 'All (100)' },
                { id: 'gold', label: 'Gold 4/4' },
                { id: 'partial', label: 'Partial' },
                { id: 'missed', label: 'Missed' },
                { id: 'noted', label: 'Has Note' }
              ] as { id: FilterMode; label: string }[]
            ).map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterMode(f.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition whitespace-nowrap shrink-0 ${
                  filterMode === f.id
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-amber-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {filteredDays.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              No days in Days {blockStart}–{blockEnd} match the &ldquo;{filterMode}&rdquo; filter.
            </p>
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className="mt-3 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition"
            >
              Show All 100 Days
            </button>
          </div>
        ) : (
          <div
            id="days-grid"
            className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-10 gap-2 sm:gap-2.5"
          >
            {filteredDays.map(dayNum => {
              const rec = getDayRecord(state, dayNum);
              const doneCount = rec.tasks.filter(Boolean).length;
              const isAllDone = doneCount === 4;
              const isToday = dayNum === todayDayNum;
              const isPast = dayNum < todayDayNum;
              const isFuture = dayNum > todayDayNum;
              const isPastLocked = isPast && state.lockFutureDays;
              const isMissed = isPast && doneCount === 0;
              const isShielded = freezeSet.has(dayNum);
              const hasNote = rec.note.trim().length > 0;
              const moodObj = rec.mood ? MOOD_OPTIONS.find(m => m.id === rec.mood) : undefined;
              const dateISO = addDaysISO(state.startDate, dayNum - 1);
              const dateLabel = formatShortDate(dateISO, false);
              const selectedTaskDoneHere =
                selectedTaskIndex !== null && rec.tasks[selectedTaskIndex];

              let boxStateClasses =
                'bg-slate-50/90 dark:bg-slate-800/50 border-slate-200/90 dark:border-slate-800';
              if (isAllDone) {
                boxStateClasses = 'day-gold';
              } else if (doneCount > 0) {
                boxStateClasses =
                  'bg-sky-500/[0.06] dark:bg-sky-500/[0.09] border-sky-500/35 dark:border-sky-500/40';
              } else if (isShielded) {
                boxStateClasses =
                  'bg-cyan-500/10 dark:bg-cyan-950/40 border-cyan-400/50 dark:border-cyan-700/60';
              } else if (isMissed) {
                boxStateClasses =
                  'border-dashed bg-rose-500/[0.05] dark:bg-rose-950/25 border-rose-400/50 dark:border-rose-800/60 opacity-85';
              } else if (isFuture) {
                boxStateClasses =
                  'day-future bg-slate-100/30 dark:bg-slate-900/25 border-slate-200/50 dark:border-slate-800/50 opacity-45 cursor-not-allowed';
              }

              if (isToday) {
                boxStateClasses += ' day-today';
              }

              const fillPct = (doneCount / 4) * 100;
              const showMicroPop =
                lastPoppedDay &&
                lastPoppedDay.dayNum === dayNum &&
                Date.now() - lastPoppedDay.ts < 1200;

              return (
                <div
                  key={dayNum}
                  id={`day-box-${dayNum}`}
                  data-day-box={dayNum}
                  role="button"
                  tabIndex={0}
                  aria-label={`Day ${dayNum}, ${dateLabel}, ${doneCount} of 4 tasks done`}
                  onClick={e => onTapDayBox(dayNum, e.currentTarget)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onTapDayBox(dayNum, e.currentTarget);
                    }
                  }}
                  className={`day-box relative rounded-xl border p-2.5 flex flex-col justify-between min-h-[96px] cursor-pointer overflow-hidden ${boxStateClasses} ${
                    showMicroPop ? 'animate-pop' : ''
                  }`}
                >
                  {/* Floating Micro-Pop Celebration Tag */}
                  {showMicroPop && (
                    <div
                      key={lastPoppedDay.ts}
                      className="animate-float-badge absolute inset-x-1 top-1 z-20 pointer-events-none flex justify-center"
                    >
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold text-white shadow-md"
                        style={{ backgroundColor: lastPoppedDay.color }}
                      >
                        {lastPoppedDay.label}
                      </span>
                    </div>
                  )}

                  {/* Partial Fill Bar at bottom edge */}
                  {doneCount > 0 && doneCount < 4 && (
                    <div
                      className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-emerald-500 via-sky-500 to-violet-500 transition-all duration-300"
                      style={{ width: `${fillPct}%` }}
                    />
                  )}

                  {/* Top Row: Day Number + Crown/Today/Note Action */}
                  <div className="flex items-start justify-between gap-1">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span
                          className={`font-mono text-xs font-extrabold tracking-tight tabular-nums whitespace-nowrap ${
                            isAllDone
                              ? 'text-amber-950 dark:text-amber-200'
                              : 'text-slate-800 dark:text-slate-100'
                          }`}
                        >
                          Day {dayNum}
                        </span>
                      </div>
                      <div
                        className={`text-[10px] font-mono flex items-center gap-1 whitespace-nowrap ${
                          isAllDone
                            ? 'text-amber-900/80 dark:text-amber-200/80 font-medium'
                            : isToday
                              ? 'text-sky-600 dark:text-sky-400 font-semibold'
                              : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        <span>{dateLabel}</span>
                        {moodObj ? <span>{moodObj.emoji}</span> : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5 shrink-0">
                      {isAllDone && (
                        <Crown
                          className="w-3.5 h-3.5 text-amber-500 shrink-0"
                          aria-label="All 4 tasks completed"
                        />
                      )}
                      {isShielded && !isAllDone && (
                        <Shield
                          className="w-3.5 h-3.5 text-cyan-500 shrink-0"
                          aria-label="Streak Shield Protected"
                        />
                      )}
                      <button
                        type="button"
                        data-note-btn={dayNum}
                        aria-label={`Daily note for Day ${dayNum}`}
                        title={
                          hasNote
                            ? `Note: ${rec.note}`
                            : `Add reflection note for Day ${dayNum}`
                        }
                        onClick={e => {
                          e.stopPropagation();
                          onOpenNoteModal(dayNum);
                        }}
                        className="relative z-10 p-1 rounded-md hover:bg-slate-900/10 dark:hover:bg-white/10 text-slate-500 dark:text-slate-300 transition shrink-0"
                      >
                        {hasNote ? (
                          <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                        ) : (
                          <FileText className="w-3.5 h-3.5 opacity-60 hover:opacity-100" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Middle Status Micro-Cue */}
                  <div className="my-1 flex items-center justify-between text-[10px]">
                    {isAllDone ? (
                      <span className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                        {isPastLocked && <Lock className="w-2.5 h-2.5" />}
                        <span>{isPastLocked ? '4/4 Saved' : '★ 4/4 Gold'}</span>
                      </span>
                    ) : doneCount > 0 ? (
                      <span className="font-semibold text-sky-600 dark:text-sky-400 flex items-center gap-1 tabular-nums">
                        {isPastLocked && <Lock className="w-2.5 h-2.5" />}
                        <span>{isPastLocked ? `${doneCount}/4 Saved` : `${doneCount}/4 done`}</span>
                      </span>
                    ) : isShielded ? (
                      <span className="font-semibold text-cyan-600 dark:text-cyan-400">
                        🛡️ Shielded
                      </span>
                    ) : isMissed ? (
                      <span className="font-semibold text-rose-500 dark:text-rose-400 flex items-center gap-1">
                        {isPastLocked && <Lock className="w-2.5 h-2.5" />}
                        <span>{isPastLocked ? 'Missed' : 'Recover'}</span>
                      </span>
                    ) : isFuture ? (
                      <span className="font-mono text-slate-400 dark:text-slate-600 flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" />
                        <span>Locked</span>
                      </span>
                    ) : (
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        Open Today
                      </span>
                    )}

                    {selectedTaskDoneHere && (
                      <span className="text-[9px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        ✓ Saved
                      </span>
                    )}
                  </div>

                  {/* Bottom 4 Task Indicators */}
                  <div className="flex items-center gap-1 pt-1">
                    {TASK_THEMES.map((t, tIdx) => {
                      const filled = rec.tasks[tIdx];
                      const isHighlightedSlot = selectedTaskIndex === tIdx && !isFuture;
                      return (
                        <span
                          key={t.id}
                          className={`h-2 flex-1 rounded-full transition-all duration-200 ${
                            filled
                              ? `${t.badgeBg} shadow-sm`
                              : isHighlightedSlot
                                ? 'bg-slate-300 dark:bg-slate-700 ring-1 ring-slate-400 dark:ring-slate-500'
                                : 'bg-slate-200 dark:bg-slate-700/70'
                          }`}
                          title={`${state.taskNames[tIdx]}: ${filled ? 'Done' : 'Not marked'}`}
                        />
                      );
                    })}
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
