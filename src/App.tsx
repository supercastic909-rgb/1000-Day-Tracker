/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { HabitState, Milestone, MoodTag, ViewMode } from './types/habit';
import {
  BLOCK_SIZE,
  computeStreaks,
  computeSummaryStats,
  getDayRecord,
  getTimeUntilNextDayRollover,
  getTodayLocalISO,
  MILESTONES,
  sanitizeParsedState,
  TASK_THEMES,
  TOTAL_DAYS,
  updateDayRecord
} from './utils/habitLogic';
import {
  downloadDesktopWindowLauncher,
  downloadStandaloneHtmlSnapshot,
  loadFromIndexedDB,
  loadInitialState,
  persistStateEverywhere
} from './utils/storageEngine';
import { soundEngine } from './utils/soundEngine';
import { usePWAInstall } from './hooks/usePWAInstall';
import { ConfettiCanvas, ConfettiController } from './components/ConfettiCanvas';
import { TopHeader } from './components/TopHeader';
import { TodayHeroBar } from './components/TodayHeroBar';
import { SidebarMarkerAndStats } from './components/SidebarMarkerAndStats';
import { HundredDayGrid } from './components/HundredDayGrid';
import { MacroThousandMap } from './components/MacroThousandMap';
import { AnalyticsAndJournalView } from './components/AnalyticsAndJournalView';
import {
  BackupModal,
  DailyNoteModal,
  DesktopAppModal,
  FloatingBanners,
  FocusTimerModal,
  MilestoneModal,
  PendingUndoState,
  UndoRecoveryBar
} from './components/Modals';

export default function App() {
  const [state, setState] = useState<HabitState>(() => loadInitialState());
  const [selectedTaskIndex, setSelectedTaskIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid100');
  const [currentBlockIndex, setCurrentBlockIndex] = useState<number>(0);
  const [pendingUndo, setPendingUndo] = useState<PendingUndoState | null>(null);
  const [activeNoteDay, setActiveNoteDay] = useState<number | null>(null);
  const [activeMilestone, setActiveMilestone] = useState<Milestone | null>(null);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isDesktopModalOpen, setIsDesktopModalOpen] = useState(false);
  const [isDesktopFrameMode, setIsDesktopFrameMode] = useState(true);
  const [isFocusTimerOpen, setIsFocusTimerOpen] = useState(false);
  const [focusTimerTaskIdx, setFocusTimerTaskIdx] = useState<number>(0);
  const [clockTick, setClockTick] = useState<number>(() => Date.now());

  const { isInstallable, isInstalled, install } = usePWAInstall();

  const [gentleHint, setGentleHint] = useState<string | null>(null);
  const [markerPulse, setMarkerPulse] = useState(false);
  const [dayCompleteBanner, setDayCompleteBanner] = useState<number | null>(null);
  const [saveStatusText, setSaveStatusText] = useState<string>('Auto-saved to browser');
  const [lastPoppedDay, setLastPoppedDay] = useState<{
    dayNum: number;
    label: string;
    color: string;
    ts: number;
  } | null>(null);

  const confettiRef = useRef<ConfettiController | null>(null);
  const hintTimeoutRef = useRef<number | null>(null);
  const bannerTimeoutRef = useRef<number | null>(null);

  // Live 30s ticker so day rollover happens automatically at 2:00 AM at night
  useEffect(() => {
    const id = window.setInterval(() => {
      setClockTick(Date.now());
    }, 30000);
    return () => window.clearInterval(id);
  }, []);

  const todayISO = useMemo(() => getTodayLocalISO(new Date(clockTick)), [clockTick]);
  const rolloverInfo = useMemo(
    () => getTimeUntilNextDayRollover(new Date(clockTick)),
    [clockTick]
  );
  const stats = useMemo(() => computeSummaryStats(state, todayISO), [state, todayISO]);

  // Apply Dark/Light theme class to <html>
  useEffect(() => {
    const htmlEl = document.documentElement;
    if (state.theme === 'dark') {
      htmlEl.classList.add('dark');
    } else {
      htmlEl.classList.remove('dark');
    }
  }, [state.theme]);

  // Check IndexedDB fallback on first mount if state had no days
  useEffect(() => {
    if (Object.keys(state.days).length === 0) {
      loadFromIndexedDB(idbRaw => {
        try {
          const parsed = sanitizeParsedState(JSON.parse(idbRaw));
          if (Object.keys(parsed.days).length > 0) {
            setState(parsed);
          }
        } catch {}
      });
    }
  }, []);

  const showHint = useCallback((msg: string, pulseMarker = false) => {
    setGentleHint(msg);
    if (pulseMarker) {
      setMarkerPulse(true);
      window.setTimeout(() => setMarkerPulse(false), 600);
    }
    if (hintTimeoutRef.current) window.clearTimeout(hintTimeoutRef.current);
    hintTimeoutRef.current = window.setTimeout(() => {
      setGentleHint(null);
    }, 2300);
  }, []);

  const showDayComplete = useCallback((dayNum: number) => {
    setDayCompleteBanner(dayNum);
    if (bannerTimeoutRef.current) window.clearTimeout(bannerTimeoutRef.current);
    bannerTimeoutRef.current = window.setTimeout(() => {
      setDayCompleteBanner(null);
    }, 2800);
  }, []);

  const commitState = useCallback((nextState: HabitState, customLabel?: string) => {
    setState(nextState);
    persistStateEverywhere(nextState);
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    setSaveStatusText(customLabel || `Saved (${hh}:${mm}:${ss})`);
  }, []);

  // Scroll to Today helper
  const scrollToDayBox = useCallback(
    (dayNum: number, smooth = true) => {
      const targetDay = Math.max(1, Math.min(TOTAL_DAYS, dayNum));
      const targetBlock = Math.floor((targetDay - 1) / BLOCK_SIZE);
      setViewMode('grid100');
      setCurrentBlockIndex(targetBlock);
      window.setTimeout(() => {
        const el = document.getElementById(`day-box-${targetDay}`);
        if (el) {
          el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'center' });
        }
      }, 60);
    },
    []
  );

  // Auto-select Today's block on initial load
  useEffect(() => {
    const targetDay = Math.max(1, Math.min(TOTAL_DAYS, stats.todayDayNum));
    const targetBlock = Math.floor((targetDay - 1) / BLOCK_SIZE);
    setCurrentBlockIndex(targetBlock);
  }, []);

  // Core logic to mark a task on a specific day with full celebrations
  const markTaskOnDay = useCallback(
    (dayNum: number, taskIdx: number, originEl?: HTMLElement, extraFocusMinutes?: number) => {
      const rec = getDayRecord(state, dayNum);
      const nextTasks = [...rec.tasks] as [boolean, boolean, boolean, boolean];
      nextTasks[taskIdx] = true;

      const updatedFocus =
        extraFocusMinutes !== undefined
          ? (rec.focusMinutes || 0) + extraFocusMinutes
          : rec.focusMinutes;

      let nextState = updateDayRecord(state, dayNum, nextTasks, rec.note, rec.mood, updatedFocus);
      const newDoneCount = nextTasks.filter(Boolean).length;
      const { current } = computeStreaks(nextState, stats.todayDayNum);

      const hitMilestone =
        newDoneCount === 4 ? MILESTONES.find(m => m.days === current) : undefined;

      if (hitMilestone && !nextState.celebratedMilestones.includes(hitMilestone.days)) {
        nextState = {
          ...nextState,
          celebratedMilestones: [...nextState.celebratedMilestones, hitMilestone.days]
        };
      }

      commitState(nextState);
      setPendingUndo(null);

      const rect = originEl?.getBoundingClientRect();
      const theme = TASK_THEMES[taskIdx];

      setLastPoppedDay({
        dayNum,
        label: newDoneCount === 4 ? '👑 4/4 GOLD!' : `${theme.icon} ${newDoneCount}/4`,
        color: newDoneCount === 4 ? '#f59e0b' : theme.colorHex,
        ts: Date.now()
      });

      if (hitMilestone) {
        soundEngine.playMilestoneGrandSound(nextState.muted, nextState.volume);
        confettiRef.current?.launchDayCompleteShower(true, rect);
        showDayComplete(dayNum);
        setActiveMilestone(hitMilestone);
      } else if (newDoneCount === 4) {
        soundEngine.playDayCompleteFanfare(nextState.muted, nextState.volume);
        confettiRef.current?.launchDayCompleteShower(false, rect);
        showDayComplete(dayNum);
      } else {
        soundEngine.playTaskPop(taskIdx, newDoneCount, nextState.muted, nextState.volume);
        confettiRef.current?.launchTaskPopper(taskIdx, rect);
      }
    },
    [state, stats.todayDayNum, commitState, showDayComplete]
  );

  // Day-Box Tap Handler (Pick first, then single tap)
  const handleTapDayBox = useCallback(
    (dayNum: number, boxEl: HTMLElement) => {
      const todayDayNum = stats.todayDayNum;

      // 1. STRICT FUTURE LOCK
      if (dayNum > todayDayNum) {
        showHint(
          `🔒 Day ${dayNum} is locked! Only Today (Day ${todayDayNum}) is unlocked—future days unlock when their date arrives.`,
          false
        );
        return;
      }

      // 2. PAST-DAY AUTO-LOCK & 1-CLICK RECOVERY
      if (dayNum < todayDayNum && state.lockFutureDays) {
        setPendingUndo({ mode: 'recover_past', dayNum });
        return;
      }

      // 3. Require a selected task in Marker panel
      if (selectedTaskIndex === null) {
        showHint('Pick a task first (select habit 1–4 in the Marker panel)', true);
        return;
      }

      const rec = getDayRecord(state, dayNum);
      const alreadyDone = rec.tasks[selectedTaskIndex];

      // 4. Offer Undo if already marked
      if (alreadyDone) {
        setPendingUndo({ mode: 'undo_task', dayNum, taskIndex: selectedTaskIndex });
        return;
      }

      // 5. Mark task!
      markTaskOnDay(dayNum, selectedTaskIndex, boxEl);
    },
    [stats.todayDayNum, state, selectedTaskIndex, showHint, markTaskOnDay]
  );

  // Direct Today Hero Bar toggle
  const handleDirectToggleTodayTask = useCallback(
    (taskIdx: number, originEl: HTMLElement) => {
      const clampedToday = Math.max(1, Math.min(TOTAL_DAYS, stats.todayDayNum));
      const rec = getDayRecord(state, clampedToday);
      setSelectedTaskIndex(taskIdx);

      if (rec.tasks[taskIdx]) {
        setPendingUndo({ mode: 'undo_task', dayNum: clampedToday, taskIndex: taskIdx });
        return;
      }

      markTaskOnDay(clampedToday, taskIdx, originEl);
    },
    [stats.todayDayNum, state, markTaskOnDay]
  );

  // Confirm Undo or Past Recovery
  const handleConfirmUndoOrRecover = useCallback(() => {
    if (!pendingUndo) return;
    if (pendingUndo.mode === 'recover_past') {
      const targetDay = pendingUndo.dayNum;
      const nextState: HabitState = {
        ...state,
        lockFutureDays: false
      };
      commitState(nextState, 'Past recovery unlocked');
      setPendingUndo(null);
      showHint(
        `🔓 Past Day ${targetDay} unlocked! Pick a task on the left, tap Day ${targetDay}, then click "Save & Lock".`,
        false
      );
      return;
    }

    if (pendingUndo.taskIndex !== undefined) {
      const rec = getDayRecord(state, pendingUndo.dayNum);
      const nextTasks = [...rec.tasks] as [boolean, boolean, boolean, boolean];
      nextTasks[pendingUndo.taskIndex] = false;
      const nextState = updateDayRecord(
        state,
        pendingUndo.dayNum,
        nextTasks,
        rec.note,
        rec.mood,
        rec.focusMinutes
      );
      commitState(nextState, `Undid mark on Day ${pendingUndo.dayNum}`);
      setPendingUndo(null);
    }
  }, [pendingUndo, state, commitState, showHint]);

  // Keyboard shortcuts (1-4 to pick task, Escape to clear/close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName ? target.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea') {
        if (e.key === 'Escape') {
          target?.blur();
        }
        return;
      }

      if (e.key >= '1' && e.key <= '4') {
        const idx = Number(e.key) - 1;
        setSelectedTaskIndex(prev => {
          const next = prev === idx ? null : idx;
          if (next !== null) {
            soundEngine.playSelectTick(next, state.muted, state.volume);
          }
          return next;
        });
        setPendingUndo(null);
      } else if (e.key === 'Escape') {
        setPendingUndo(null);
        setActiveNoteDay(null);
        setIsBackupModalOpen(false);
        setIsFocusTimerOpen(false);
        setSelectedTaskIndex(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.muted, state.volume]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-200">
      {/* Confetti & Particle Physics Canvas */}
      <ConfettiCanvas ref={confettiRef} />

      {/* Floating Feedback Banners */}
      <FloatingBanners gentleHint={gentleHint} dayCompleteBanner={dayCompleteBanner} />

      {/* Undo / Past-Day Recovery Prompt Bar */}
      <UndoRecoveryBar
        state={state}
        pendingUndo={pendingUndo}
        onConfirm={handleConfirmUndoOrRecover}
        onCancel={() => setPendingUndo(null)}
      />

      {/* Top Command Header */}
      <TopHeader
        state={state}
        stats={stats}
        viewMode={viewMode}
        rolloverStatusText={rolloverInfo.statusText}
        isDesktopFrameMode={isDesktopFrameMode}
        onToggleDesktopFrameMode={() => setIsDesktopFrameMode(prev => !prev)}
        onOpenDesktopModal={() => setIsDesktopModalOpen(true)}
        onViewModeChange={setViewMode}
        onStartDateChange={newDate => {
          if (/^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
            const nextState: HabitState = {
              ...state,
              startDate: newDate,
              userChangedStartDate: true
            };
            commitState(nextState, 'Updated Day 1 date');
          }
        }}
        onJumpToday={() => scrollToDayBox(stats.todayDayNum, true)}
        onTogglePastLock={() => {
          const nextLock = !state.lockFutureDays;
          const nextState: HabitState = {
            ...state,
            lockFutureDays: nextLock
          };
          commitState(
            nextState,
            nextLock ? 'All past days locked & saved' : 'Past recovery mode active'
          );
          showHint(
            nextLock
              ? '🔒 Past days locked & saved! Only Today is open (Future days stay locked).'
              : '🛠️ Past-Day Recovery ON: You can now mark/restore past days (Day 1–Yesterday). Future days stay locked!'
          );
        }}
        onToggleMute={() => {
          commitState({ ...state, muted: !state.muted });
        }}
        onVolumeChange={val => {
          commitState({
            ...state,
            volume: val,
            muted: val > 0 ? false : state.muted
          });
        }}
        onSaveStandaloneHtml={() => {
          downloadStandaloneHtmlSnapshot(state).then(() => {
            showHint('💻 Downloaded 1000-Day-Habit-Tracker-Desktop.html! Double-click it to open.');
          });
        }}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        onOpenFocusTimer={() => {
          setFocusTimerTaskIdx(selectedTaskIndex ?? 0);
          setIsFocusTimerOpen(true);
        }}
        onToggleTheme={() => {
          commitState({
            ...state,
            theme: state.theme === 'dark' ? 'light' : 'dark'
          });
        }}
      />

      {/* Main Workspace */}
      <main className="max-w-[1600px] mx-auto px-3 sm:px-6 py-4 space-y-4">
        {/* Today's Ritual Quick Command Bar */}
        <TodayHeroBar
          state={state}
          todayDayNum={stats.todayDayNum}
          rolloverStatusText={rolloverInfo.statusText}
          selectedTaskIndex={selectedTaskIndex}
          onDirectToggleTodayTask={handleDirectToggleTodayTask}
          onOpenDayNote={dayNum => setActiveNoteDay(dayNum)}
          onOpenFocusTimerForTask={idx => {
            setFocusTimerTaskIdx(idx);
            setIsFocusTimerOpen(true);
          }}
        />

        <div className="flex flex-col lg:flex-row gap-5 items-start">
          {/* Left Sticky Sidebar */}
          <SidebarMarkerAndStats
            state={state}
            stats={stats}
            selectedTaskIndex={selectedTaskIndex}
            markerPulse={markerPulse}
            saveStatusText={saveStatusText}
            onSelectTask={idx => {
              setSelectedTaskIndex(idx);
              setPendingUndo(null);
              if (idx !== null) {
                soundEngine.playSelectTick(idx, state.muted, state.volume);
              }
            }}
            onUpdateTaskNames={names => {
              const cleaned = names.map((n, i) => n.trim() || TASK_THEMES[i].defaultName) as [
                string,
                string,
                string,
                string
              ];
              commitState({ ...state, taskNames: cleaned }, 'Saved task names');
            }}
            onManualSaveAndLock={() => {
              commitState(
                { ...state, lockFutureDays: true },
                '✓ All Marks Saved & Locked!'
              );
              showHint('✅ All marked habits & names saved and past days locked!');
            }}
            onPreviewMilestone={m => {
              const unlocked = stats.longestStreak >= m.days || stats.currentStreak >= m.days;
              if (unlocked) {
                soundEngine.playMilestoneGrandSound(state.muted, state.volume);
                confettiRef.current?.launchDayCompleteShower(true);
                setActiveMilestone(m);
              } else {
                showHint(`Reach a ${m.days}-day Gold streak to unlock "${m.title}"!`);
              }
            }}
          />

          {/* Right Main Viewport */}
          <section className="flex-1 w-full min-w-0">
            {viewMode === 'grid100' && (
              <HundredDayGrid
                state={state}
                todayDayNum={stats.todayDayNum}
                currentBlockIndex={currentBlockIndex}
                selectedTaskIndex={selectedTaskIndex}
                lastPoppedDay={lastPoppedDay}
                onSelectBlock={b => {
                  setCurrentBlockIndex(b);
                  setPendingUndo(null);
                }}
                onTapDayBox={handleTapDayBox}
                onOpenNoteModal={dayNum => setActiveNoteDay(dayNum)}
              />
            )}

            {viewMode === 'map1000' && (
              <MacroThousandMap
                state={state}
                todayDayNum={stats.todayDayNum}
                onJumpToDayInGrid={dayNum => scrollToDayBox(dayNum, true)}
                onOpenNoteModal={dayNum => setActiveNoteDay(dayNum)}
              />
            )}

            {viewMode === 'analytics' && (
              <AnalyticsAndJournalView
                state={state}
                stats={stats}
                onOpenNoteModal={dayNum => setActiveNoteDay(dayNum)}
                onToggleStreakFreeze={dayNum => {
                  const exists = state.streakFreezesUsed.includes(dayNum);
                  if (!exists && state.streakFreezesUsed.length >= 5) {
                    showHint('Maximum of 5 Streak Shields can be active at once.');
                    return;
                  }
                  const nextFreezes = exists
                    ? state.streakFreezesUsed.filter(d => d !== dayNum)
                    : [...state.streakFreezesUsed, dayNum];
                  commitState(
                    { ...state, streakFreezesUsed: nextFreezes },
                    exists ? `Removed shield on Day ${dayNum}` : `Shielded Day ${dayNum}`
                  );
                }}
                onJumpToDayInGrid={dayNum => scrollToDayBox(dayNum, true)}
              />
            )}
          </section>
        </div>
      </main>

      {/* Modals */}
      <MilestoneModal
        milestone={activeMilestone}
        onClose={() => setActiveMilestone(null)}
      />

      <DailyNoteModal
        state={state}
        dayNum={activeNoteDay}
        onClose={() => setActiveNoteDay(null)}
        onSaveNote={(dayNum, note, mood) => {
          const rec = getDayRecord(state, dayNum);
          const nextState = updateDayRecord(
            state,
            dayNum,
            rec.tasks,
            note,
            mood as MoodTag | undefined,
            rec.focusMinutes
          );
          commitState(nextState, `Saved note for Day ${dayNum}`);
        }}
      />

      <FocusTimerModal
        isOpen={isFocusTimerOpen}
        state={state}
        todayDayNum={Math.max(1, Math.min(TOTAL_DAYS, stats.todayDayNum))}
        initialTaskIdx={focusTimerTaskIdx}
        onClose={() => setIsFocusTimerOpen(false)}
        onCompleteSessionAndMark={(taskIdx, mins) => {
          const clampedToday = Math.max(1, Math.min(TOTAL_DAYS, stats.todayDayNum));
          markTaskOnDay(clampedToday, taskIdx, undefined, mins);
          showHint(`🎯 ${mins}m Focus Session complete! Marked "${state.taskNames[taskIdx]}" on Day ${clampedToday}.`);
        }}
      />

      <BackupModal
        isOpen={isBackupModalOpen}
        state={state}
        onClose={() => setIsBackupModalOpen(false)}
        onRestoreJson={rawJson => {
          try {
            const parsed = JSON.parse(rawJson);
            if (!parsed || typeof parsed !== 'object' || !parsed.days) {
              return { ok: false, msg: 'Invalid backup JSON: missing habit data.' };
            }
            const restored = sanitizeParsedState(parsed);
            commitState(restored, 'Restored from JSON backup');
            return { ok: true, msg: 'Progress restored! All 1000 days updated.' };
          } catch {
            return {
              ok: false,
              msg: 'Could not parse JSON. Check the format and try again.'
            };
          }
        }}
      />

      <DesktopAppModal
        isOpen={isDesktopModalOpen}
        onClose={() => setIsDesktopModalOpen(false)}
        isDesktopFrameMode={isDesktopFrameMode}
        onToggleDesktopFrameMode={() => setIsDesktopFrameMode(prev => !prev)}
        onDownloadStandaloneApp={() => {
          downloadStandaloneHtmlSnapshot(state).then(() => {
            showHint('💻 Downloaded 1000-Day-Habit-Tracker-Desktop.html! Double-click it to open.');
          });
        }}
        onDownloadLauncher={platform => {
          downloadDesktopWindowLauncher(state, platform);
          showHint(
            platform === 'windows'
              ? '💻 Downloaded Windows Desktop Launcher (.bat)!'
              : '💻 Downloaded macOS Desktop Launcher (.command)!'
          );
        }}
        isPWAInstallable={isInstallable}
        isPWAInstalled={isInstalled}
        onTriggerPWAInstall={install}
        rolloverStatusText={rolloverInfo.statusText}
      />
    </div>
  );
}
