import React, { useState, useEffect } from 'react';
import { HabitState, Milestone, MoodTag } from '../types/habit';
import {
  addDaysISO,
  formatShortDate,
  getDayRecord,
  getTodayLocalISO,
  MOOD_OPTIONS,
  TASK_THEMES
} from '../utils/habitLogic';
import {
  Check,
  Copy,
  Download,
  Laptop,
  Maximize2,
  Monitor,
  Moon,
  Pause,
  Play,
  RotateCcw,
  Upload,
  X
} from 'lucide-react';

// 1. GENTLE HINT TOAST & DAY COMPLETE BANNER
export const FloatingBanners: React.FC<{
  gentleHint: string | null;
  dayCompleteBanner: number | null;
}> = ({ gentleHint, dayCompleteBanner }) => {
  return (
    <>
      {gentleHint && (
        <div
          id="gentle-hint-toast"
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-pop"
        >
          <div className="px-4 py-2.5 rounded-full bg-slate-900/95 dark:bg-slate-800/95 text-white text-xs sm:text-sm font-semibold shadow-xl border border-slate-700/80 flex items-center gap-2.5 backdrop-blur-md whitespace-nowrap">
            <span className="text-amber-400">⚡</span>
            <span id="gentle-hint-text">{gentleHint}</span>
          </div>
        </div>
      )}

      {dayCompleteBanner !== null && (
        <div
          id="day-complete-banner"
          className="fixed top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-pop"
        >
          <div className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 shadow-2xl shadow-amber-500/30 border-2 border-amber-200 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-slate-950/15 flex items-center justify-center text-2xl">
              👑
            </div>
            <div>
              <div className="text-xs font-extrabold uppercase tracking-wider text-slate-900/80">
                All 4 Tasks Done
              </div>
              <div
                id="day-complete-title"
                className="text-lg font-extrabold tracking-tight"
              >
                Day {dayCompleteBanner} Complete!
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// 2. UNDO / PAST-DAY RECOVERY BAR
export interface PendingUndoState {
  mode: 'undo_task' | 'recover_past';
  dayNum: number;
  taskIndex?: number;
}

export const UndoRecoveryBar: React.FC<{
  state: HabitState;
  pendingUndo: PendingUndoState | null;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ state, pendingUndo, onConfirm, onCancel }) => {
  if (!pendingUndo) return null;

  const isRecover = pendingUndo.mode === 'recover_past';
  const rec = getDayRecord(state, pendingUndo.dayNum);
  const doneCount = rec.tasks.filter(Boolean).length;
  const taskName =
    pendingUndo.taskIndex !== undefined ? state.taskNames[pendingUndo.taskIndex] : '';

  const message = isRecover
    ? doneCount === 0
      ? `Day ${pendingUndo.dayNum} was detected as Missed & Auto-Locked. Did you complete it earlier?`
      : `Day ${pendingUndo.dayNum} (${doneCount}/4 saved) is Auto-Locked. Need to restore/update it?`
    : `"${taskName}" is already saved on Day ${pendingUndo.dayNum}. Undo?`;

  return (
    <div id="undo-bar" className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40">
      <div className="px-4 py-3 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white shadow-2xl border border-slate-700 flex items-center gap-3.5 max-w-lg w-[92vw] sm:w-auto animate-pop">
        <div className="text-xs sm:text-sm flex-1">
          <span id="undo-bar-message" className="font-medium">
            {message}
          </span>
        </div>
        <button
          id="confirm-undo-btn"
          type="button"
          onClick={onConfirm}
          className={
            isRecover
              ? 'px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition whitespace-nowrap'
              : 'px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-semibold transition whitespace-nowrap'
          }
        >
          {isRecover ? '🔓 Unlock Past Day to Save' : 'Undo Mark'}
        </button>
        <button
          id="cancel-undo-btn"
          type="button"
          onClick={onCancel}
          className="px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs font-medium transition"
        >
          Keep
        </button>
      </div>
    </div>
  );
};

// 3. MILESTONE CELEBRATION MODAL
export const MilestoneModal: React.FC<{
  milestone: Milestone | null;
  onClose: () => void;
}> = ({ milestone, onClose }) => {
  if (!milestone) return null;
  return (
    <div
      id="milestone-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="milestone-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4"
    >
      <div className="relative w-full max-w-md rounded-3xl bg-gradient-to-b from-amber-500/20 via-slate-900 to-slate-900 border-2 border-amber-400/60 p-6 sm:p-8 text-center shadow-2xl text-white animate-pop">
        <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-amber-300 via-amber-400 to-orange-500 flex items-center justify-center text-4xl shadow-lg shadow-amber-500/30">
          🏆
        </div>
        <div
          id="milestone-badge"
          className="text-amber-300 text-xs font-mono font-bold uppercase tracking-widest mb-2"
        >
          {milestone.days}-Day Streak Milestone · {milestone.rank}
        </div>
        <h2
          id="milestone-title"
          className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2"
        >
          {milestone.title}
        </h2>
        <p id="milestone-message" className="text-sm text-slate-300 leading-relaxed mb-6">
          {milestone.msg}
        </p>
        <button
          id="close-milestone-btn"
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/25 transition"
        >
          Keep the Streak Alive
        </button>
      </div>
    </div>
  );
};

// 4. DAILY REFLECTION NOTE & MOOD MODAL
export const DailyNoteModal: React.FC<{
  state: HabitState;
  dayNum: number | null;
  onClose: () => void;
  onSaveNote: (dayNum: number, note: string, mood?: MoodTag) => void;
}> = ({ state, dayNum, onClose, onSaveNote }) => {
  const [noteText, setNoteText] = useState('');
  const [selectedMood, setSelectedMood] = useState<MoodTag | undefined>(undefined);

  useEffect(() => {
    if (dayNum !== null) {
      const rec = getDayRecord(state, dayNum);
      setNoteText(rec.note);
      setSelectedMood(rec.mood);
      window.setTimeout(() => {
        document.getElementById('note-textarea')?.focus();
      }, 40);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayNum]);

  if (dayNum === null) return null;
  const rec = getDayRecord(state, dayNum);
  const dateISO = addDaysISO(state.startDate, dayNum - 1);

  return (
    <div
      id="note-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="note-modal-heading"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-2xl animate-pop">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span
                id="note-modal-day-badge"
                className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400"
              >
                Day {dayNum}
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span
                id="note-modal-date"
                className="text-xs font-mono text-slate-500 dark:text-slate-400"
              >
                {formatShortDate(dateISO, true)}
              </span>
            </div>
            <h3 id="note-modal-heading" className="text-base font-bold mt-1 text-slate-900 dark:text-white">
              Daily Reflection &amp; Mood
            </h3>
          </div>
          <button
            id="close-note-modal-btn"
            type="button"
            onClick={onClose}
            aria-label="Close Note Modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Day's Task Status Summary */}
        <div id="note-modal-tasks-preview" className="flex flex-wrap gap-1.5 mb-3">
          {TASK_THEMES.map((t, idx) => {
            const done = rec.tasks[idx];
            return (
              <span
                key={t.id}
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium flex items-center gap-1 ${
                  done
                    ? `${t.softBg} ${t.textClass}`
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                }`}
              >
                <span>{t.icon}</span>
                <span>
                  {state.taskNames[idx]}: {done ? 'Done' : '—'}
                </span>
              </span>
            );
          })}
        </div>

        {/* Mood Selector */}
        <div className="mb-3">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
            How was your energy today?
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {MOOD_OPTIONS.map(m => {
              const active = selectedMood === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMood(active ? undefined : m.id)}
                  className={`p-1.5 rounded-xl border text-center transition flex flex-col items-center gap-0.5 ${
                    active
                      ? 'bg-amber-500/20 border-amber-500 text-amber-600 dark:text-amber-300 font-bold'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span className="text-base">{m.emoji}</span>
                  <span className="text-[10px] truncate w-full">{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <label
          htmlFor="note-textarea"
          className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5"
        >
          A few words on how the day went:
        </label>
        <textarea
          id="note-textarea"
          rows={3}
          maxLength={280}
          value={noteText}
          onChange={e => setNoteText(e.target.value)}
          placeholder="Wins, energy level, lessons learned, or a quick highlight..."
          className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 p-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 resize-none"
        />
        <div className="flex items-center justify-between mt-3">
          <button
            id="clear-note-btn"
            type="button"
            onClick={() => {
              onSaveNote(dayNum, '', undefined);
              onClose();
            }}
            className="text-xs font-medium text-rose-500 hover:text-rose-400 transition"
          >
            Delete Note
          </button>
          <div className="flex items-center gap-2">
            <button
              id="cancel-note-btn"
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              id="save-note-btn"
              type="button"
              onClick={() => {
                onSaveNote(dayNum, noteText, selectedMood);
                onClose();
              }}
              className="px-4 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm transition"
            >
              Save Note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// 5. DEEP FOCUS HABIT TIMER MODAL
export const FocusTimerModal: React.FC<{
  isOpen: boolean;
  state: HabitState;
  todayDayNum: number;
  initialTaskIdx: number;
  onClose: () => void;
  onCompleteSessionAndMark: (taskIdx: number, minutesLogged: number) => void;
}> = ({
  isOpen,
  state,
  todayDayNum,
  initialTaskIdx,
  onClose,
  onCompleteSessionAndMark
}) => {
  const [activeTaskIdx, setActiveTaskIdx] = useState(initialTaskIdx);
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    setActiveTaskIdx(initialTaskIdx);
  }, [initialTaskIdx]);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  if (!isOpen) return null;

  const totalSeconds = durationMinutes * 60;
  const progress = totalSeconds > 0 ? 1 - secondsLeft / totalSeconds : 0;
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');
  const currentTheme = TASK_THEMES[activeTaskIdx] || TASK_THEMES[0];

  const handlePresetChange = (mins: number) => {
    setIsRunning(false);
    setDurationMinutes(mins);
    setSecondsLeft(mins * 60);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="focus-timer-heading"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl animate-pop">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-violet-500">
              Deep Focus Studio · Day {todayDayNum}
            </span>
            <h3 id="focus-timer-heading" className="text-lg font-extrabold text-slate-900 dark:text-white">
              Habit Focus Timer
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Focus Timer"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Select which Habit to Focus on */}
        <div className="grid grid-cols-2 gap-1.5 mb-5">
          {TASK_THEMES.map((t, idx) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTaskIdx(idx)}
              className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition ${
                activeTaskIdx === idx
                  ? `${t.softBg} ${t.textClass} border-current`
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              <span>{t.icon}</span>
              <span className="truncate">{state.taskNames[idx]}</span>
            </button>
          ))}
        </div>

        {/* Circular Countdown Ring */}
        <div className="relative w-48 h-48 mx-auto my-4 flex items-center justify-center">
          <svg className="w-48 h-48 -rotate-90" viewBox="0 0 180 180">
            <circle
              cx="90"
              cy="90"
              r="78"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-slate-100 dark:text-slate-800"
            />
            <circle
              cx="90"
              cy="90"
              r="78"
              fill="none"
              stroke={currentTheme.colorHex}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 78}
              strokeDashoffset={2 * Math.PI * 78 * (1 - progress)}
              className="transition-all duration-300"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl mb-1">{currentTheme.icon}</span>
            <span className="text-3xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
              {mm}:{ss}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {state.taskNames[activeTaskIdx]}
            </span>
          </div>
        </div>

        {/* Duration Presets */}
        <div className="flex items-center justify-center gap-2 mb-5">
          {[15, 25, 45, 60].map(mins => (
            <button
              key={mins}
              type="button"
              onClick={() => handlePresetChange(mins)}
              className={`px-3 py-1 rounded-lg font-mono text-xs font-bold transition ${
                durationMinutes === mins
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {mins}m
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsRunning(!isRunning)}
            className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
          >
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isRunning ? 'Pause' : 'Start Focus'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRunning(false);
              setSecondsLeft(durationMinutes * 60);
            }}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition"
            title="Reset Timer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRunning(false);
              onCompleteSessionAndMark(activeTaskIdx, durationMinutes);
              onClose();
            }}
            className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Complete &amp; Mark</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// 6. BACKUP & RESTORE MODAL
export const BackupModal: React.FC<{
  isOpen: boolean;
  state: HabitState;
  onClose: () => void;
  onRestoreJson: (rawJson: string) => { ok: boolean; msg: string };
}> = ({ isOpen, state, onClose, onRestoreJson }) => {
  const [jsonText, setJsonText] = useState('');
  const [status, setStatus] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setJsonText(JSON.stringify(state, null, 2));
      setStatus(null);
    }
  }, [isOpen, state]);

  if (!isOpen) return null;

  const handleDownloadJson = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `habit-tracker-1000-backup-${getTodayLocalISO()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatus({ text: 'Backup .json downloaded!', isError: false });
  };

  const handleCopyJson = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(jsonText).catch(() => {});
    }
    setStatus({ text: 'Copied JSON backup to clipboard!', isError: false });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const content = String(ev.target?.result || '');
      setJsonText(content);
      const res = onRestoreJson(content);
      setStatus({ text: res.msg, isError: !res.ok });
    };
    reader.readAsText(file);
  };

  return (
    <div
      id="backup-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="backup-modal-heading"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xl animate-pop">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 id="backup-modal-heading" className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
              Backup &amp; Restore (JSON)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              1000 days of progress should never be lost. Export or restore your data anytime.
            </p>
          </div>
          <button
            id="close-backup-modal-btn"
            type="button"
            onClick={onClose}
            aria-label="Close Backup Modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
          <button
            id="download-json-btn"
            type="button"
            onClick={handleDownloadJson}
            className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition"
          >
            <Download className="w-4 h-4" />
            <span>Download Backup (.json)</span>
          </button>
          <label
            htmlFor="upload-json-input"
            className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition"
          >
            <Upload className="w-4 h-4" />
            <span>Import from .json File</span>
            <input
              id="upload-json-input"
              type="file"
              accept=".json,application/json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="backup-json-textarea"
              className="text-xs font-semibold text-slate-500 dark:text-slate-400"
            >
              Raw JSON Data (Copy or Paste to Restore):
            </label>
            <button
              id="copy-json-btn"
              type="button"
              onClick={handleCopyJson}
              className="text-xs font-semibold text-sky-500 hover:text-sky-400 flex items-center gap-1"
            >
              <Copy className="w-3 h-3" />
              <span>Copy JSON</span>
            </button>
          </div>
          <textarea
            id="backup-json-textarea"
            rows={5}
            value={jsonText}
            onChange={e => setJsonText(e.target.value)}
            className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 p-3 font-mono text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500"
          />
        </div>

        {status && (
          <div
            id="backup-status-msg"
            className={`text-xs font-semibold mb-3 ${
              status.isError ? 'text-rose-500' : 'text-emerald-500'
            }`}
          >
            {status.text}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            id="load-pasted-json-btn"
            type="button"
            onClick={() => {
              const res = onRestoreJson(jsonText);
              setStatus({ text: res.msg, isError: !res.ok });
            }}
            className="px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold transition"
          >
            Restore from Pasted JSON
          </button>
          <button
            id="close-backup-footer-btn"
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

// 7. DESKTOP APP MODE & DOWNLOAD CENTER MODAL
export const DesktopAppModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  isDesktopFrameMode: boolean;
  onToggleDesktopFrameMode: () => void;
  onDownloadStandaloneApp: () => void;
  onDownloadLauncher: (platform: 'windows' | 'mac') => void;
  isPWAInstallable: boolean;
  isPWAInstalled: boolean;
  onTriggerPWAInstall: () => Promise<boolean>;
  rolloverStatusText: string;
}> = ({
  isOpen,
  onClose,
  isDesktopFrameMode,
  onToggleDesktopFrameMode,
  onDownloadStandaloneApp,
  onDownloadLauncher,
  isPWAInstallable,
  isPWAInstalled,
  onTriggerPWAInstall,
  rolloverStatusText
}) => {
  const [downloadFeedback, setDownloadFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const notify = (msg: string) => {
    setDownloadFeedback(msg);
    window.setTimeout(() => setDownloadFeedback(null), 4000);
  };

  return (
    <div
      id="desktop-app-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="desktop-app-modal-heading"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xl animate-pop">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20 shrink-0">
              <Monitor className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Desktop App Studio
                </span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-[11px] font-mono text-sky-600 dark:text-sky-400">
                  Offline-Ready
                </span>
              </div>
              <h3
                id="desktop-app-modal-heading"
                className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white"
              >
                Download &amp; Open as Desktop App
              </h3>
            </div>
          </div>
          <button
            id="close-desktop-modal-btn"
            type="button"
            onClick={onClose}
            aria-label="Close Desktop App Modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2:00 AM Night Rollover Status Card */}
        <div className="mb-4 p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Moon className="w-4 h-4 text-indigo-400 shrink-0" />
            <div className="text-xs">
              <div className="font-bold text-slate-900 dark:text-white">
                2:00 AM Night Rollover Active
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-300 font-mono">
                {rolloverStatusText} (12:00 AM – 1:59 AM stays on your current day)
              </div>
            </div>
          </div>
        </div>

        {/* Option 1: Portable Standalone Desktop App File (.html) */}
        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent border-2 border-amber-500/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  1. Recommended · Portable Desktop File
                </div>
                <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                  Download Standalone Desktop App (.html)
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Downloads <code className="font-mono text-[11px]">1000-Day-Habit-Tracker-Desktop.html</code> with your habits, streaks, notes, and 2:00 AM rollover baked in. Double-click it on your Desktop anytime—works 100% offline!
                </p>
              </div>
              <button
                id="modal-download-portable-btn"
                type="button"
                onClick={() => {
                  onDownloadStandaloneApp();
                  notify('Downloaded 1000-Day-Habit-Tracker-Desktop.html! Double-click it to open.');
                }}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 transition shrink-0"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>Download App (.html)</span>
              </button>
            </div>
          </div>

          {/* Option 2: Native OS Window Install (PWA) + Desktop Window Frame Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between gap-3">
              <div>
                <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                  2. Native Taskbar / Dock App
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                  {isPWAInstalled
                    ? 'Installed as Desktop App'
                    : isPWAInstallable
                      ? 'Install Direct to Desktop / Taskbar'
                      : 'Install via Browser Address Bar'}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {isPWAInstalled
                    ? 'Running in standalone Desktop App mode.'
                    : isPWAInstallable
                      ? 'One click installs the app icon to your Desktop, Start Menu, or macOS Dock.'
                      : 'Click the Install icon (⊕) on the right side of your browser address bar, or download a Desktop Window Launcher below.'}
                </p>
              </div>
              {isPWAInstallable && !isPWAInstalled ? (
                <button
                  id="modal-install-pwa-btn"
                  type="button"
                  onClick={async () => {
                    const ok = await onTriggerPWAInstall();
                    if (ok) notify('Desktop App installed!');
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <Laptop className="w-3.5 h-3.5" />
                  <span>Install Native Desktop App</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      onDownloadLauncher('windows');
                      notify('Downloaded Windows Desktop Launcher (.bat)!');
                    }}
                    className="flex-1 py-2 px-2.5 rounded-xl bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-semibold text-[11px] transition text-center"
                  >
                    Windows (.bat)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onDownloadLauncher('mac');
                      notify('Downloaded macOS Desktop Launcher (.command)!');
                    }}
                    className="flex-1 py-2 px-2.5 rounded-xl bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-semibold text-[11px] transition text-center"
                  >
                    macOS (.command)
                  </button>
                </div>
              )}
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between gap-3">
              <div>
                <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  3. Desktop Workspace Frame
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                  {isDesktopFrameMode ? 'Desktop Window Bar: Active' : 'Enable Desktop Window Mode'}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Adds a dedicated native-style Desktop App Titlebar with live clock, 2:00 AM rollover countdown, and fullscreen toggle.
                </p>
              </div>
              <button
                id="modal-toggle-desktop-frame-btn"
                type="button"
                onClick={() => {
                  onToggleDesktopFrameMode();
                  notify(
                    !isDesktopFrameMode
                      ? 'Desktop App Window Mode enabled!'
                      : 'Standard view restored.'
                  );
                }}
                className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                  isDesktopFrameMode
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                }`}
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>
                  {isDesktopFrameMode ? '✓ Desktop Window Active' : 'Switch to Desktop Window'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {downloadFeedback && (
          <div className="mt-3 p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold text-center">
            {downloadFeedback}
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            All progress auto-saves across 6 local storage layers.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

