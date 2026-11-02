import { describe, expect, it } from 'vitest';

import { DAY_MINUTES, isIsoDate, parseTime, timeWindowsOverlap, toWindow } from './time';

describe('parseTime', () => {
  it('parses HH:MM into minutes since midnight', () => {
    expect(parseTime('00:00')).toBe(0);
    expect(parseTime('06:30')).toBe(390);
    expect(parseTime('23:59')).toBe(1439);
  });

  it('accepts 24:00 as the end of the day', () => {
    expect(parseTime('24:00')).toBe(DAY_MINUTES);
  });

  it('returns null for malformed values', () => {
    for (const value of ['', '6:30', '24:01', '25:00', '12:60', '12:5', 'ab:cd', '12:30:00', 1230, null, undefined]) {
      expect(parseTime(value)).toBeNull();
    }
  });
});

describe('toWindow', () => {
  it('covers the whole day when both bounds are missing', () => {
    expect(toWindow(undefined, undefined)).toEqual({ start: 0, end: DAY_MINUTES });
  });

  it('converts HH:MM bounds', () => {
    expect(toWindow('18:00', '24:00')).toEqual({ start: 1080, end: DAY_MINUTES });
  });
});

describe('timeWindowsOverlap', () => {
  it('detects overlapping windows', () => {
    expect(timeWindowsOverlap({ start: 360, end: 540 }, { start: 480, end: 600 })).toBe(true);
    expect(timeWindowsOverlap({ start: 360, end: 540 }, { start: 400, end: 420 })).toBe(true);
    expect(timeWindowsOverlap({ start: 400, end: 420 }, { start: 360, end: 540 })).toBe(true);
  });

  it('treats windows as half-open, so touching windows do not overlap', () => {
    expect(timeWindowsOverlap({ start: 360, end: 540 }, { start: 540, end: 600 })).toBe(false);
    expect(timeWindowsOverlap({ start: 540, end: 600 }, { start: 360, end: 540 })).toBe(false);
  });

  it('detects disjoint windows', () => {
    expect(timeWindowsOverlap({ start: 0, end: 60 }, { start: 120, end: 180 })).toBe(false);
  });
});

describe('isIsoDate', () => {
  it('accepts real calendar dates only', () => {
    expect(isIsoDate('2026-11-02')).toBe(true);
    expect(isIsoDate('2024-02-29')).toBe(true);
    expect(isIsoDate('2026-02-29')).toBe(false);
    expect(isIsoDate('2026-13-01')).toBe(false);
    expect(isIsoDate('2026-1-01')).toBe(false);
    expect(isIsoDate(20261102)).toBe(false);
  });
});
