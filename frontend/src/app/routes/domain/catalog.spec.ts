import {
  filterRoutes,
  listDifficulties,
  listTimeSlots,
  pickDefaultSlot,
  resolveSlotKey,
  routeSafetyForSlot,
  segmentSafetyForSlot,
  slotKey,
  sortRoutesForSlot,
} from './catalog';
import {
  SAFETY_LEVEL_LABELS,
  formatElevation,
  formatSegmentLength,
} from './labels';
import { Route } from './route';
import { route, segment, slot } from './testing/fixtures';

describe('filterRoutes', () => {
  const routes = [
    route('a', { distanceKm: 3, difficulty: 'Principiante' }),
    route('b', { distanceKm: 5, difficulty: 'Intermedio' }),
    route('c', { distanceKm: 7.5, difficulty: 'Intermedio' }),
    route('d', { distanceKm: 10, difficulty: 'Avanzado' }),
    route('e', { distanceKm: 12, difficulty: null }),
  ];
  const ids = (list: Route[]) => list.map((r) => r.id);

  it('keeps everything with no filters', () => {
    expect(ids(filterRoutes(routes, { distance: 'all', difficulty: 'all' }))).toEqual([
      'a',
      'b',
      'c',
      'd',
      'e',
    ]);
  });

  it.each([
    ['upTo5', ['a', 'b']],
    ['from5to10', ['c', 'd']],
    ['over10', ['e']],
  ] as const)('filters the %s distance bucket', (distance, expected) => {
    expect(ids(filterRoutes(routes, { distance, difficulty: 'all' }))).toEqual(expected);
  });

  it('combines distance and difficulty', () => {
    expect(
      ids(filterRoutes(routes, { distance: 'from5to10', difficulty: 'Intermedio' })),
    ).toEqual(['c']);
    expect(ids(filterRoutes(routes, { distance: 'all', difficulty: 'Avanzado' }))).toEqual(['d']);
  });
});

describe('listTimeSlots', () => {
  it('lists distinct windows across routes sorted by start time', () => {
    const slots = listTimeSlots([
      route('a', { safety: [slot('a2', '18:00', '20:00', 50)] }),
      route('b', { safety: [slot('b1', '05:00', '07:00', 90), slot('b2', '18:00', '20:00', 30)] }),
      route('c'),
    ]);
    expect(slots).toEqual([
      { key: '05:00-07:00', startTime: '05:00', endTime: '07:00', label: '05:00 – 07:00' },
      { key: '18:00-20:00', startTime: '18:00', endTime: '20:00', label: '18:00 – 20:00' },
    ]);
  });

  it('is empty without safety data', () => {
    expect(listTimeSlots([route('a')])).toEqual([]);
  });
});

describe('pickDefaultSlot', () => {
  const slots = listTimeSlots([
    route('a', {
      safety: [
        slot('m', '05:00', '07:00', 90),
        slot('n', '12:00', '13:00', 90),
        slot('e', '18:00', '20:00', 50),
      ],
    }),
  ]);
  const at = (hours: number, minutes = 0) => new Date(2026, 10, 2, hours, minutes);

  it.each([
    [at(3), '05:00-07:00'],
    [at(6), '05:00-07:00'],
    [at(7), '12:00-13:00'],
    [at(9), '12:00-13:00'],
    [at(12, 30), '12:00-13:00'],
    [at(13), '18:00-20:00'],
    [at(19), '18:00-20:00'],
    [at(21), '05:00-07:00'],
  ])('at %s picks the window in progress, else the next one to start, else the first', (now, expected) => {
    expect(pickDefaultSlot(slots, now)?.key).toBe(expected);
  });

  it('follows whatever windows the admin defined, not a fixed schedule', () => {
    const custom = listTimeSlots([route('a', { safety: [slot('n', '21:00', '22:30', 90)] })]);
    expect(pickDefaultSlot(custom, at(6))?.key).toBe('21:00-22:30');
    expect(pickDefaultSlot(custom, at(22))?.key).toBe('21:00-22:30');
  });

  it('returns null when there are no slots', () => {
    expect(pickDefaultSlot([], at(6))).toBeNull();
  });

  it('keeps a chosen window that still exists and drops one that vanished', () => {
    expect(resolveSlotKey(slots, '18:00-20:00', at(6))).toBe('18:00-20:00');
    expect(resolveSlotKey(slots, '23:00-23:30', at(6))).toBe('05:00-07:00');
    expect(resolveSlotKey([], '18:00-20:00', at(6))).toBeNull();
  });
});

describe('sortRoutesForSlot', () => {
  it('sorts by score desc, then distance, leaving routes without data last', () => {
    const key = slotKey('05:00', '07:00');
    const routes = [
      route('none', { distanceKm: 1 }),
      route('mid', { distanceKm: 3, safety: [slot('x', '05:00', '07:00', 60)] }),
      route('topFar', { distanceKm: 9, safety: [slot('x', '05:00', '07:00', 90)] }),
      route('topNear', { distanceKm: 4, safety: [slot('x', '05:00', '07:00', 90)] }),
      route('otherSlot', { distanceKm: 2, safety: [slot('y', '18:00', '20:00', 100)] }),
    ];
    expect(sortRoutesForSlot(routes, key).map((r) => r.id)).toEqual([
      'topNear',
      'topFar',
      'mid',
      'none',
      'otherSlot',
    ]);
  });

  it('does not mutate the given list', () => {
    const routes = [route('b', { distanceKm: 9 }), route('a', { distanceKm: 1 })];
    sortRoutesForSlot(routes, null);
    expect(routes.map((r) => r.id)).toEqual(['b', 'a']);
  });
});

describe('routeSafetyForSlot / segmentSafetyForSlot', () => {
  const r = route('a', { safety: [slot('evening', '18:00', '20:00', 45)] });
  const s = segment('s1', {
    safety: { evening: { level: 'medium', score: 45, factors: [] } },
  });

  it('finds the route and segment safety through the slot window', () => {
    expect(routeSafetyForSlot(r, '18:00-20:00')?.score).toBe(45);
    expect(segmentSafetyForSlot(s, r, '18:00-20:00')).toEqual({
      level: 'medium',
      score: 45,
      factors: [],
    });
  });

  it('returns null for unknown slots or missing keys', () => {
    expect(routeSafetyForSlot(r, '05:00-07:00')).toBeNull();
    expect(routeSafetyForSlot(r, null)).toBeNull();
    expect(segmentSafetyForSlot(s, r, '05:00-07:00')).toBeNull();
  });
});

describe('labels', () => {
  it('formats segment lengths and elevation with the units preference', () => {
    expect(formatSegmentLength(850, 'metric')).toBe('850 m');
    expect(formatSegmentLength(1234, 'metric')).toBe('1,2 km');
    expect(formatSegmentLength(1609.344, 'imperial')).toBe('1 mi');
    expect(formatElevation(15, 'metric')).toBe('15 m');
    expect(formatElevation(100, 'imperial')).toBe('328 ft');
  });

  it('never calls a route absolutely safe or unsafe', () => {
    const words = Object.values(SAFETY_LEVEL_LABELS).flatMap((l) => [l.full, l.short]);
    expect(words.join(' ').toLowerCase()).not.toMatch(/insegur|segura\b/);
    expect(words).toContain('Alto');
    expect(words).toContain('Medio');
    expect(words).toContain('Bajo');
  });
});

describe('listDifficulties', () => {
  it('lists each typed difficulty once, sorted, ignoring routes without one', () => {
    const routes = [
      route('a', { difficulty: 'Media' }),
      route('b', { difficulty: 'Alta' }),
      route('c', { difficulty: 'Media' }),
      route('d', { difficulty: null }),
    ];

    expect(listDifficulties(routes)).toEqual(['Alta', 'Media']);
  });
});
