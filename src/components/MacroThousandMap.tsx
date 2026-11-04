import React, { useState } from 'react';
import { HabitState } from '../types/habit';
import {
  addDaysISO,
  BLOCK_SIZE,
  formatShortDate,
  getDayRecord,
  TASK_THEMES,
  TOTAL_DAYS
} from '../utils/habitLogic';
import { Compass, Crown, ExternalLink, FileText } from 'lucide-react';

interface MacroThousandMapProps {
  state: HabitState;
  todayDayNum: number;
  onJumpToDayInGrid: (dayNum: number) => void;
  onOpenNoteModal: (dayNum: number) => void;
}

export const MacroThousandMap: React.FC<MacroThousandMapProps> = ({
  state,
  todayDayNum,
  onJumpToDayInGrid,
  onOpenNoteModal
}) => {
  const [inspectedDay, setInspectedDay] = useState<number>(
    Math.max(1, Math.min(TOTAL_DAYS, todayDayNum))
  );

  const inspectedRec = getDayRecord(state, inspectedDay);
  const inspectedDateISO = addDaysISO(state.startDate, inspectedDay - 1);
  const inspectedDoneCount = inspectedRec.tasks.filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Top Inspector Card */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              1,000-Day Panoramic Life Map
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
              Inspecting Day {inspectedDay} ({formatShortDate(inspectedDateISO, true)})
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-1.5">
            <span className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
              {inspectedDoneCount === 4 && <Crown className="w-4 h-4 text-amber-500" />}
              <span>
                Day {inspectedDay}: {inspectedDoneCount}/4 Habits Completed
              </span>
            </span>
            <div className="flex items-center gap-1.5">
              {TASK_THEMES.map((t, idx) => (
                <span
                  key={t.id}
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${
                    inspectedRec.tasks[idx]
                      ? `${t.softBg} ${t.textClass}`
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  {t.icon} {state.taskNames[idx]}
                </span>
              ))}
            </div>
          </div>
          {inspectedRec.note && (
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 italic">
              &ldquo;{inspectedRec.note}&rdquo;
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onOpenNoteModal(inspectedDay)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold transition flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Note</span>
          </button>
          <button
            type="button"
            onClick={() => onJumpToDayInGrid(inspectedDay)}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-sm"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Day {inspectedDay} in Grid</span>
          </button>
        </div>
      </div>

      {/* 10 Rows of 100 Days Matrix */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>Hover or click any of the 1,000 days below to inspect or jump directly to its block:</span>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 rounded-xs bg-amber-400 inline-block" /> 4/4 Gold
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 rounded-xs bg-emerald-500 inline-block" /> 3/4
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 rounded-xs bg-sky-500 inline-block" /> 1–2/4
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 rounded-xs bg-rose-500/40 inline-block" /> Missed
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 rounded-xs bg-slate-200 dark:bg-slate-800 inline-block" /> Future
            </span>
          </div>
        </div>

        <div className="space-y-2 overflow-x-auto pb-2">
          {Array.from({ length: 10 }).map((_, blockIdx) => {
            const bStart = blockIdx * BLOCK_SIZE + 1;
            const bEnd = (blockIdx + 1) * BLOCK_SIZE;

            return (
              <div key={blockIdx} className="flex items-center gap-2 min-w-[780px]">
                <button
                  type="button"
                  onClick={() => onJumpToDayInGrid(bStart)}
                  className="w-20 shrink-0 text-left font-mono text-[11px] font-bold text-slate-500 hover:text-amber-500 transition tabular-nums"
                >
                  {bStart}–{bEnd}
                </button>
                <div className="flex-1 grid grid-cols-[repeat(25,minmax(0,1fr))] md:grid-cols-[repeat(50,minmax(0,1fr))] gap-1">
                  {Array.from({ length: BLOCK_SIZE }).map((__, offset) => {
                    const dNum = bStart + offset;
                    const rec = getDayRecord(state, dNum);
                    const done = rec.tasks.filter(Boolean).length;
                    const isToday = dNum === todayDayNum;
                    const isPast = dNum < todayDayNum;
                    const isSelected = dNum === inspectedDay;

                    let cellColor = 'bg-slate-200/70 dark:bg-slate-800/70';
                    if (done === 4) {
                      cellColor = 'bg-amber-400 shadow-xs shadow-amber-500/40';
                    } else if (done === 3) {
                      cellColor = 'bg-emerald-500';
                    } else if (done >= 1) {
                      cellColor = 'bg-sky-500';
                    } else if (isPast) {
                      cellColor = 'bg-rose-500/35 dark:bg-rose-800/50';
                    }

                    return (
                      <button
                        key={dNum}
                        type="button"
                        onMouseEnter={() => setInspectedDay(dNum)}
                        onClick={() => setInspectedDay(dNum)}
                        onDoubleClick={() => onJumpToDayInGrid(dNum)}
                        aria-label={`Day ${dNum}: ${done} of 4 completed`}
                        className={`h-3.5 rounded-[2px] transition-transform hover:scale-150 hover:z-10 ${cellColor} ${
                          isToday
                            ? 'ring-2 ring-sky-400 z-10 scale-125'
                            : isSelected
                              ? 'ring-2 ring-slate-900 dark:ring-white z-10'
                              : ''
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
