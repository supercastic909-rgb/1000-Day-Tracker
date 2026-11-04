import React, { useEffect, useState } from 'react';
import { HabitState, ViewMode } from '../types/habit';
import { HabitSummaryStats, TOTAL_DAYS } from '../utils/habitLogic';
import {
  Volume2,
  VolumeX,
  Volume1,
  Sun,
  Moon,
  Lock,
  Unlock,
  Download,
  Database,
  Compass,
  Grid,
  Map,
  BarChart3,
  Timer,
  Monitor,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface TopHeaderProps {
  state: HabitState;
  stats: HabitSummaryStats;
  viewMode: ViewMode;
  rolloverStatusText: string;
  isDesktopFrameMode: boolean;
  onToggleDesktopFrameMode: () => void;
  onOpenDesktopModal: () => void;
  onViewModeChange: (mode: ViewMode) => void;
  onStartDateChange: (newDate: string) => void;
  onJumpToday: () => void;
  onTogglePastLock: () => void;
  onToggleMute: () => void;
  onVolumeChange: (val: number) => void;
  onSaveStandaloneHtml: () => void;
  onOpenBackupModal: () => void;
  onOpenFocusTimer: () => void;
  onToggleTheme: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  state,
  stats,
  viewMode,
  rolloverStatusText,
  isDesktopFrameMode,
  onToggleDesktopFrameMode,
  onOpenDesktopModal,
  onViewModeChange,
  onStartDateChange,
  onJumpToday,
  onTogglePastLock,
  onToggleMute,
  onVolumeChange,
  onSaveStandaloneHtml,
  onOpenBackupModal,
  onOpenFocusTimer,
  onToggleTheme
}) => {
  const displayDayX = stats.todayDayNum < 1 ? 0 : Math.min(TOTAL_DAYS, stats.todayDayNum);
  const batteryPct = Math.max(0, Math.min(100, (displayDayX / TOTAL_DAYS) * 100));
  const [clockText, setClockText] = useState<string>(() =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => {
      setClockText(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 15000);
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFsChange);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('fullscreenchange', onFsChange);
    };
  }, []);

  const handleToggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().catch(() => {});
      } else {
        document.exitFullscreen?.().catch(() => {});
      }
    } catch {}
  };

  return (
    <header className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md sticky top-0 z-30">
      {/* Native Desktop Window Titlebar (Active in Desktop App Mode) */}
      {isDesktopFrameMode && (
        <div
          id="desktop-window-titlebar"
          className="bg-slate-900 dark:bg-slate-950 text-slate-300 border-b border-slate-800 px-4 py-1.5 flex items-center justify-between text-[11px] font-mono select-none"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onToggleDesktopFrameMode}
                title="Exit Desktop Window Frame"
                className="w-3 h-3 rounded-full bg-rose-500 hover:bg-rose-400 transition"
              />
              <button
                type="button"
                onClick={onOpenDesktopModal}
                title="Desktop App Settings & Download"
                className="w-3 h-3 rounded-full bg-amber-400 hover:bg-amber-300 transition"
              />
              <button
                type="button"
                onClick={handleToggleFullscreen}
                title="Toggle Fullscreen Window"
                className="w-3 h-3 rounded-full bg-emerald-500 hover:bg-emerald-400 transition"
              />
            </div>
            <span className="text-slate-400 hidden sm:inline">
              1000-Day Habit Tracker Pro — Desktop Edition
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-indigo-400 font-semibold">{rolloverStatusText}</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-300 font-bold tabular-nums">{clockText}</span>
            <button
              type="button"
              onClick={handleToggleFullscreen}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 transition"
              title="Toggle Native Fullscreen"
            >
              {isFullscreen ? (
                <Minimize2 className="w-3 h-3" />
              ) : (
                <Maximize2 className="w-3 h-3" />
              )}
              <span className="hidden md:inline">
                {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              </span>
            </button>
          </div>
        </div>
      )}

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Zone 1: Brand + Overall Battery Progress Meter */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 flex items-center justify-center text-slate-950 font-extrabold text-sm shadow-md shadow-amber-500/20 font-mono shrink-0">
              1K
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-base sm:text-lg font-extrabold tracking-tight leading-none text-slate-900 dark:text-white whitespace-nowrap">
                  1000-Day Habit Tracker
                </h1>
                <span className="text-xs font-mono font-semibold text-sky-600 dark:text-sky-400 whitespace-nowrap">
                  ·{' '}
                  {stats.todayDayNum < 1
                    ? `Starts in ${1 - stats.todayDayNum}d`
                    : stats.todayDayNum > TOTAL_DAYS
                      ? 'Journey Complete (1000/1000)'
                      : `Today: Day ${stats.todayDayNum}`}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                Pick a habit in the Marker panel, then single-tap any day box · New day at 2:00 AM
              </p>
            </div>
          </div>

          {/* Battery-Style Overall Progress Meter ("Day X of 1000") */}
          <div
            className="flex items-center gap-2.5 pl-0 sm:pl-3 sm:border-l border-slate-200 dark:border-slate-800"
            title="Overall Journey Progress & Gold Days Completed"
          >
            <div className="flex items-center">
              <div className="relative w-36 sm:w-44 h-7 rounded-lg border-2 border-slate-400 dark:border-slate-600 bg-slate-100 dark:bg-slate-950 p-0.5 flex items-center overflow-hidden">
                <div
                  className="h-full rounded-[4px] bg-gradient-to-r from-emerald-500 via-sky-500 to-amber-400 transition-all duration-500"
                  style={{ width: `${Math.max(2, batteryPct)}%` }}
                />
                <div className="absolute inset-0 grid grid-cols-10 pointer-events-none">
                  {Array.from({ length: 9 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="border-r border-slate-900/10 dark:border-white/10"
                    />
                  ))}
                  <div />
                </div>
                <span className="absolute inset-0 flex items-center justify-center text-[11px] font-mono font-bold tracking-tight text-slate-900 dark:text-white drop-shadow-sm tabular-nums">
                  Day {displayDayX} of 1000
                </span>
              </div>
              <div className="battery-cap bg-slate-400 dark:bg-slate-600" />
            </div>
            <div className="hidden xl:block text-[11px] leading-tight tabular-nums">
              <div className="font-semibold text-amber-600 dark:text-amber-400">
                {stats.goldDaysCount} Gold Day{stats.goldDaysCount === 1 ? '' : 's'}
              </div>
              <div className="text-slate-500 dark:text-slate-400">
                {batteryPct.toFixed(1)}% elapsed
              </div>
            </div>
          </div>
        </div>

        {/* Zone 2: Segmented View Switcher */}
        <nav
          aria-label="Workspace View Switcher"
          className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80"
        >
          <button
            type="button"
            onClick={() => onViewModeChange('grid100')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              viewMode === 'grid100'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-amber-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>100-Day Grid</span>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('map1000')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              viewMode === 'map1000'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-amber-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span>1000-Day Map</span>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('analytics')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              viewMode === 'analytics'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-amber-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Analytics &amp; Journal</span>
          </button>
        </nav>

        {/* Zone 3: Controls: Start Date, Jump to Today, Past Lock, Focus Timer, Sound, Backup, Theme */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {/* Start Date Picker */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/90 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80">
            <label
              htmlFor="start-date-input"
              className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap"
            >
              Day 1:
            </label>
            <input
              id="start-date-input"
              type="date"
              value={state.startDate}
              onChange={e => onStartDateChange(e.target.value)}
              className="bg-transparent text-xs font-mono font-semibold text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
            />
          </div>

          {/* Jump to Today Button */}
          <button
            id="jump-today-btn"
            type="button"
            onClick={onJumpToday}
            className="px-2.5 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/25 text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap shrink-0"
            title="Scroll to Today's Box"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Today</span>
          </button>

          {/* Past-Day Recovery Toggle */}
          <button
            id="future-lock-btn"
            type="button"
            onClick={onTogglePastLock}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              state.lockFutureDays
                ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/25'
                : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold'
            }`}
            title="Unlock past days (Day 1 - Yesterday) if you completed them earlier and need to save them. Future days stay strictly locked!"
          >
            {state.lockFutureDays ? (
              <Lock className="w-3.5 h-3.5" />
            ) : (
              <Unlock className="w-3.5 h-3.5" />
            )}
            <span className="hidden md:inline">
              {state.lockFutureDays ? 'Past Days: Locked' : 'Past Recovery: ON'}
            </span>
          </button>

          {/* Focus Timer Launcher */}
          <button
            type="button"
            onClick={onOpenFocusTimer}
            className="px-2.5 py-1.5 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 text-violet-600 dark:text-violet-400 border border-violet-500/25 text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap shrink-0"
            title="Launch Deep Focus Habit Timer"
          >
            <Timer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Focus Timer</span>
          </button>

          {/* Sound Mute + Volume Slider */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/90 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80">
            <button
              id="mute-toggle-btn"
              type="button"
              onClick={onToggleMute}
              className="text-slate-700 dark:text-slate-200 hover:scale-110 transition"
              title="Mute / Unmute Sound Effects"
              aria-label="Toggle Mute"
            >
              {state.muted || state.volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-500" />
              ) : state.volume < 0.45 ? (
                <Volume1 className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              id="volume-slider"
              type="range"
              min="0"
              max="100"
              value={Math.round(state.volume * 100)}
              onChange={e => onVolumeChange(Number(e.target.value) / 100)}
              className="w-12 sm:w-14 h-1.5 accent-amber-500 cursor-pointer"
              title="Sound Volume"
              aria-label="Sound Volume"
            />
          </div>

          {/* Desktop App Mode & Installer Button */}
          <button
            id="open-desktop-app-btn"
            type="button"
            onClick={onOpenDesktopModal}
            className="px-2.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-sm whitespace-nowrap shrink-0"
            title="Desktop App Mode: Download & Open as Desktop Application"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop App</span>
          </button>

          {/* Save Standalone App (.html) */}
          <button
            id="save-standalone-btn"
            type="button"
            onClick={onSaveStandaloneHtml}
            className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-sm whitespace-nowrap shrink-0"
            title="Download this app as a standalone .html file with your progress saved inside"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Save App (.html)</span>
          </button>

          {/* Export / Import JSON Button */}
          <button
            id="open-backup-btn"
            type="button"
            onClick={onOpenBackupModal}
            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap shrink-0"
            title="Export or Import 1000-Day Backup JSON"
          >
            <Database className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Backup</span>
          </button>

          {/* Dark / Light Mode Button */}
          <button
            id="theme-toggle-btn"
            type="button"
            onClick={onToggleTheme}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition shrink-0"
            title="Toggle Dark / Light Mode"
            aria-label="Toggle Theme"
          >
            {state.theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
