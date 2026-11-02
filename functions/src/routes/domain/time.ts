/**
 * Time-of-day helpers for time slots ("franjas") and risk factor windows.
 * Times are "HH:MM" strings within one day; "24:00" is only meaningful as an
 * end bound. Windows are half-open [start, end) in minutes since midnight, so
 * 06:00–09:00 and 09:00–12:00 do not overlap.
 */
export const DAY_MINUTES = 24 * 60;

export interface TimeWindow {
  start: number;
  end: number;
}

const TIME_PATTERN = /^([01]\d|2[0-4]):([0-5]\d)$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Minutes since midnight for "HH:MM" (00:00–24:00), or null. */
export function parseTime(value: unknown): number | null {
  if (typeof value !== 'string') return null;
  const match = TIME_PATTERN.exec(value);
  if (!match) return null;
  const minutes = Number(match[1]) * 60 + Number(match[2]);
  return minutes > DAY_MINUTES ? null : minutes;
}

/** Window for already-validated bounds; missing bounds mean the whole day. */
export function toWindow(startTime: string | undefined, endTime: string | undefined): TimeWindow {
  return {
    start: startTime === undefined ? 0 : (parseTime(startTime) ?? 0),
    end: endTime === undefined ? DAY_MINUTES : (parseTime(endTime) ?? DAY_MINUTES),
  };
}

export function timeWindowsOverlap(a: TimeWindow, b: TimeWindow): boolean {
  return a.start < b.end && b.start < a.end;
}

/** ISO calendar date "YYYY-MM-DD" that actually exists. */
export function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
