import { describe, expect, it } from 'vitest';

import { computeRouteSafety, computeSegmentSafety, levelForScore, type SafetyFactorInput, type SafetySlot } from './safety';

const morning: SafetySlot = { id: 'morning', startTime: '06:00', endTime: '09:00' };
const night: SafetySlot = { id: 'night', startTime: '19:00', endTime: '23:00' };

const factor = (overrides: Partial<SafetyFactorInput> = {}): SafetyFactorInput => ({
  type: 'poor_lighting',
  severity: 'medium',
  description: 'Street lights out',
  ...overrides,
});

describe('levelForScore', () => {
  it('maps scores to high (>=70), medium (40-69) and low (<40)', () => {
    expect(levelForScore(100)).toBe('high');
    expect(levelForScore(70)).toBe('high');
    expect(levelForScore(69)).toBe('medium');
    expect(levelForScore(40)).toBe('medium');
    expect(levelForScore(39)).toBe('low');
    expect(levelForScore(0)).toBe('low');
  });
});

describe('computeSegmentSafety', () => {
  it('starts every slot at 100 (high) without factors', () => {
    expect(computeSegmentSafety([morning, night], [])).toEqual({
      morning: { level: 'high', score: 100, factors: [] },
      night: { level: 'high', score: 100, factors: [] },
    });
  });

  it('subtracts 10/20/35 by severity for factors active in the slot', () => {
    const result = computeSegmentSafety(
      [night],
      [
        factor({ severity: 'low', type: 'traffic', description: 'Busy road' }),
        factor({ severity: 'medium' }),
        factor({ severity: 'high', type: 'isolated_area', description: 'No people around' }),
      ],
    );
    expect(result.night.score).toBe(100 - 10 - 20 - 35);
    expect(result.night.level).toBe('low');
  });

  it('only applies a factor to slots its window overlaps', () => {
    const result = computeSegmentSafety([morning, night], [factor({ severity: 'high', startTime: '18:00', endTime: '24:00' })]);
    expect(result.morning).toEqual({ level: 'high', score: 100, factors: [] });
    expect(result.night.score).toBe(65);
    expect(result.night.level).toBe('medium');
    expect(result.night.factors).toEqual([{ type: 'poor_lighting', severity: 'high', description: 'Street lights out' }]);
  });

  it('applies a factor without a window to every slot', () => {
    const result = computeSegmentSafety([morning, night], [factor({ severity: 'low', type: 'uneven_terrain' })]);
    expect(result.morning.score).toBe(90);
    expect(result.night.score).toBe(90);
  });

  it('does not apply a factor that only touches the slot boundary', () => {
    const result = computeSegmentSafety([morning], [factor({ startTime: '09:00', endTime: '12:00' })]);
    expect(result.morning.score).toBe(100);
  });

  it('floors the score at 0', () => {
    const highs = Array.from({ length: 4 }, () => factor({ severity: 'high' }));
    expect(computeSegmentSafety([night], highs).night).toMatchObject({ score: 0, level: 'low' });
  });

  it('lists the explaining factors by severity, high first', () => {
    const result = computeSegmentSafety(
      [night],
      [factor({ severity: 'low', type: 'traffic' }), factor({ severity: 'high', type: 'harassment' }), factor({ severity: 'medium' })],
    );
    expect(result.night.factors.map((f) => f.severity)).toEqual(['high', 'medium', 'low']);
  });

  it('accepts extra penalty sources (e.g. community reports) tagged with their source', () => {
    const result = computeSegmentSafety([morning, night], [], [
      { source: 'report', type: 'harassment', severity: 'medium', description: 'Reported twice', startTime: '20:00', endTime: '21:00' },
    ]);
    expect(result.morning.score).toBe(100);
    expect(result.night.score).toBe(80);
    expect(result.night.factors).toEqual([
      { type: 'harassment', severity: 'medium', description: 'Reported twice', source: 'report' },
    ]);
  });
});

describe('computeRouteSafety', () => {
  const slots = [morning, night];

  it('takes the worst segment per slot and keeps every explaining factor with its segment', () => {
    const segments = [
      {
        id: 'a',
        name: 'Park',
        order: 0,
        safety: computeSegmentSafety(slots, [factor({ severity: 'high', startTime: '18:00' as string, endTime: '24:00' })]),
      },
      {
        id: 'b',
        name: 'River',
        order: 1,
        safety: computeSegmentSafety(slots, [factor({ severity: 'medium', type: 'flood_risk', description: 'Floods' })]),
      },
    ];
    const result = computeRouteSafety(slots, segments);
    expect(result.morning).toEqual({
      level: 'high',
      score: 80,
      startTime: '06:00',
      endTime: '09:00',
      worstSegmentId: 'b',
      factors: [{ segmentId: 'b', segmentName: 'River', type: 'flood_risk', severity: 'medium', description: 'Floods' }],
    });
    expect(result.night).toMatchObject({ level: 'medium', score: 65, worstSegmentId: 'a' });
    expect(result.night.factors).toEqual([
      { segmentId: 'a', segmentName: 'Park', type: 'poor_lighting', severity: 'high', description: 'Street lights out' },
      { segmentId: 'b', segmentName: 'River', type: 'flood_risk', severity: 'medium', description: 'Floods' },
    ]);
  });

  it('breaks ties with the first segment in route order', () => {
    const segments = [
      { id: 'second', name: 'B', order: 1, safety: computeSegmentSafety(slots, []) },
      { id: 'first', name: 'A', order: 0, safety: computeSegmentSafety(slots, []) },
    ];
    expect(computeRouteSafety(slots, segments).morning.worstSegmentId).toBe('first');
  });

  it('returns no levels for a route without segments', () => {
    expect(computeRouteSafety(slots, [])).toEqual({});
  });

  it('treats a segment missing a slot entry as a full score', () => {
    const segments = [{ id: 'a', name: 'A', order: 0, safety: {} }];
    expect(computeRouteSafety([morning], segments).morning).toMatchObject({ score: 100, level: 'high', factors: [] });
  });
});
