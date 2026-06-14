import type { Schedule } from '../types';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Parse an ISO date string to epoch ms, or undefined if missing/invalid. */
function parseTime(iso: string | undefined): number | undefined {
  if (!iso) return undefined;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? undefined : t;
}

/**
 * Whether `now` falls inside the schedule's active window.
 *
 * - No schedule, or a schedule with neither start nor end → always active.
 * - `start` (inclusive) and `end` (exclusive) bound the window when present.
 *
 * Recurrence (`recurEveryDays`) does not gate visibility here — it only tags iterations via
 * {@link currentIteration}; the window itself remains [start, end).
 */
export function inSchedule(schedule: Schedule | undefined, now: number = Date.now()): boolean {
  if (!schedule) return true;

  const start = parseTime(schedule.start);
  const end = parseTime(schedule.end);

  if (start !== undefined && now < start) return false;
  if (end !== undefined && now >= end) return false;
  return true;
}

/**
 * The current iteration index for a recurring schedule, mirroring PostHog's
 * `$survey_iteration`. Returns 0 for non-recurring schedules (or before `start`).
 *
 * Iteration N spans `[start + N*recurEveryDays, start + (N+1)*recurEveryDays)`.
 */
export function currentIteration(
  schedule: Schedule | undefined,
  now: number = Date.now(),
): number {
  if (!schedule || !schedule.recurEveryDays || schedule.recurEveryDays <= 0) return 0;

  const start = parseTime(schedule.start);
  // Without a start anchor, recurrence is undefined — treat as iteration 0.
  if (start === undefined) return 0;
  if (now < start) return 0;

  const elapsedDays = (now - start) / DAY_MS;
  return Math.floor(elapsedDays / schedule.recurEveryDays);
}
