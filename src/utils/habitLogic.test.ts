import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addDaysISO,
  computeStreaks,
  computeSummaryStats,
  createDefaultState,
  diffDaysISO,
  getDayRecord,
  getTimeUntilNextDayRollover,
  getTodayDayNumber,
  getTodayLocalISO,
  isDayAllFourDone,
  sanitizeParsedState,
  updateDayRecord
} from './habitLogic';

test('date math calculates day offsets and differences accurately across months', () => {
  assert.equal(addDaysISO('2026-11-01', 0), '2026-11-01');
  assert.equal(addDaysISO('2026-11-01', 2), '2026-11-03');
  assert.equal(addDaysISO('2026-11-01', 30), '2026-12-01');
  assert.equal(diffDaysISO('2026-11-01', '2026-11-03'), 2);
  assert.equal(getTodayDayNumber('2026-11-01', '2026-11-03'), 3);
});

test('2:00 AM night rollover keeps 12:00 AM - 1:59 AM on the previous day and starts new day at 2:00 AM', () => {
  // Nov 4 at 12:00 AM (Midnight) should still count as Nov 3 (Day 3)
  const midnightNov4 = new Date(2026, 10, 4, 0, 0, 0);
  assert.equal(getTodayLocalISO(midnightNov4), '2026-11-03');
  assert.equal(getTodayDayNumber('2026-11-01', getTodayLocalISO(midnightNov4)), 3);

  // Nov 4 at 1:59 AM should still count as Nov 3 (Day 3)
  const oneFiftyNineAmNov4 = new Date(2026, 10, 4, 1, 59, 0);
  assert.equal(getTodayLocalISO(oneFiftyNineAmNov4), '2026-11-03');
  const graceInfo = getTimeUntilNextDayRollover(oneFiftyNineAmNov4);
  assert.equal(graceInfo.isLateNightGraceWindow, true);
  assert.equal(graceInfo.hoursLeft, 0);
  assert.equal(graceInfo.minutesLeft, 1);

  // Nov 4 at 2:00 AM sharp rolls over to Nov 4 (Day 4)
  const twoAmNov4 = new Date(2026, 10, 4, 2, 0, 0);
  assert.equal(getTodayLocalISO(twoAmNov4), '2026-11-04');
  assert.equal(getTodayDayNumber('2026-11-01', getTodayLocalISO(twoAmNov4)), 4);
  const daytimeInfo = getTimeUntilNextDayRollover(twoAmNov4);
  assert.equal(daytimeInfo.isLateNightGraceWindow, false);
  assert.equal(daytimeInfo.hoursLeft, 24);
});

test('updateDayRecord marks and cleans up empty days cleanly', () => {
  let state = createDefaultState();
  state = updateDayRecord(state, 1, [true, false, true, false], 'Great start');
  const rec1 = getDayRecord(state, 1);
  assert.deepEqual(rec1.tasks, [true, false, true, false]);
  assert.equal(rec1.note, 'Great start');
  assert.equal(isDayAllFourDone(state, 1), false);

  state = updateDayRecord(state, 1, [true, true, true, true], 'All four!');
  assert.equal(isDayAllFourDone(state, 1), true);

  // Clearing all tasks and note removes the key from state.days
  state = updateDayRecord(state, 1, [false, false, false, false], '   ');
  assert.equal(state.days[1], undefined);
});

test('computeStreaks calculates current and longest Gold streaks accurately', () => {
  let state = createDefaultState();
  // Suppose Today is Day 5
  state = updateDayRecord(state, 1, [true, true, true, true], '');
  state = updateDayRecord(state, 2, [true, true, true, true], '');
  // Day 3 is partial
  state = updateDayRecord(state, 3, [true, true, false, false], '');
  // Day 4 is Gold
  state = updateDayRecord(state, 4, [true, true, true, true], '');
  // Day 5 (Today) is not yet completed
  const streaksBeforeTodayDone = computeStreaks(state, 5);
  assert.equal(streaksBeforeTodayDone.longest, 2);
  assert.equal(streaksBeforeTodayDone.current, 1); // Yesterday (Day 4) is still an active streak!

  // Complete Day 5 (Today)
  state = updateDayRecord(state, 5, [true, true, true, true], '');
  const streaksAfterTodayDone = computeStreaks(state, 5);
  assert.equal(streaksAfterTodayDone.current, 2);
  assert.equal(streaksAfterTodayDone.longest, 2);

  // If Day 3 is also recovered to Gold (4/4), streak becomes 5!
  state = updateDayRecord(state, 3, [true, true, true, true], '');
  const fullStreak = computeStreaks(state, 5);
  assert.equal(fullStreak.current, 5);
  assert.equal(fullStreak.longest, 5);
});

test('computeSummaryStats aggregates Gold days, partial days, missed days, and per-task totals', () => {
  let state = createDefaultState();
  // Day 1: 4/4 Gold
  state = updateDayRecord(state, 1, [true, true, true, true], 'Day 1 win', 'unstoppable', 45);
  // Day 2: 2/4 Partial
  state = updateDayRecord(state, 2, [true, false, true, false], '');
  // Day 3 (Today: 2026-11-03): 0/4 so far

  const summary = computeSummaryStats(state, '2026-11-03');
  assert.equal(summary.todayDayNum, 3);
  assert.equal(summary.goldDaysCount, 1);
  assert.equal(summary.partialDaysCount, 1);
  assert.equal(summary.missedPastDaysCount, 0);
  assert.deepEqual(summary.taskCounts, [2, 1, 2, 1]);
  assert.equal(summary.totalTasksCompleted, 6);
  assert.equal(summary.notesCount, 1);
  assert.equal(summary.totalFocusMinutes, 45);
});

test('sanitizeParsedState safely validates untrusted JSON backup payloads', () => {
  const restored = sanitizeParsedState({
    startDate: '2026-11-01',
    userChangedStartDate: true,
    lockFutureDays: false,
    taskNames: ['Run 5K', 'Code TypeScript', 'Read 20p', 'Outreach'],
    days: {
      '1': { tasks: [1, 1, 1, 1], note: '  Solid day  ' },
      '9999': { tasks: [true, true, true, true], note: 'Out of range' }
    },
    theme: 'light',
    volume: 0.8
  });

  assert.equal(restored.lockFutureDays, false);
  assert.equal(restored.taskNames[0], 'Run 5K');
  assert.deepEqual(restored.days[1]?.tasks, [true, true, true, true]);
  assert.equal(restored.days[1]?.note, 'Solid day');
  assert.equal(restored.days[9999], undefined);
  assert.equal(restored.theme, 'light');
});
