import {
  filterRoutes,
  listTimeSlots,
  pickDefaultSlot,
  routeSafetyForSlot,
  segmentSafetyForSlot,
  slotKey,
  sortRoutesForSlot,
} from './catalog';
import { factorTypeLabel, formatKm, formatMeters } from './labels';
import type { Route, RouteSlotSafety, Segment } from './route';

const slot = (
  slotId: string,
  startTime: string,
  endTime: string,
  score: number,
  level: RouteSlotSafety['level'] = score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low',
): RouteSlotSafety => ({ slotId, startTime, endTime, score, level, worstSegmentId: '', factors: [] });

const route = (id: string, overrides: Partial<Route> = {}): Route => ({
  id,
  name: id,
  cityId: 'loja',
  description: '',
  start: null,
  end: null,
  distanceKm: 5,
  elevationGainM: 0,
  surface: 'asphalt',
  difficulty: 'beginner',
  segmentCount: 1,
  safety: [],
  ...overrides,
});

describe('filterRoutes', () => {
  const routes = [
    route('a', { distanceKm: 3, difficulty: 'beginner' }),
    route('b', { distanceKm: 5, difficulty: 'intermediate' }),
    route('c', { distanceKm: 7.5, difficulty: 'intermediate' }),
    route('d', { distanceKm: 10, difficulty: 'advanced' }),
    route('e', { distanceKm: 12, difficulty: null }),
  ];
  const ids = (list: Route[]) => list.map((r) => r.id);

  it('keeps everything with no filters', () => {
    expect(ids(filterRoutes(routes, { distance: 'all', difficulty: 'all' }))).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it.each([
    ['upTo5', ['a', 'b']],
    ['from5to10', ['c', 'd']],
    ['over10', ['e']],
  ] as const)('filters the %s distance bucket', (distance, expected) => {
    expect(ids(filterRoutes(routes, { distance, difficulty: 'all' }))).toEqual(expected);
  });

  it('combines distance and difficulty', () => {
    expect(ids(filterRoutes(routes, { distance: 'from5to10', difficulty: 'intermediate' }))).toEqual(['c']);
    expect(ids(filterRoutes(routes, { distance: 'all', difficulty: 'advanced' }))).toEqual(['d']);
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
      safety: [slot('m', '05:00', '07:00', 90), slot('n', '12:00', '13:00', 90), slot('e', '18:00', '20:00', 50)],
    }),
  ]);
  const at = (hours: number, minutes = 0) => new Date(2026, 10, 2, hours, minutes);

  it.each([
    [at(3), '05:00-07:00'],
    [at(6), '05:00-07:00'],
    [at(9), '18:00-20:00'],
    [at(19), '18:00-20:00'],
    [at(21), '05:00-07:00'],
  ])('at %s picks the slot of the current or next training slot', (now, expected) => {
    expect(pickDefaultSlot(slots, now)?.key).toBe(expected);
  });

  it('falls back to the first slot when none matches a training slot', () => {
    const midday = listTimeSlots([route('a', { safety: [slot('n', '12:00', '13:00', 90)] })]);
    expect(pickDefaultSlot(midday, at(6))?.key).toBe('12:00-13:00');
  });

  it('returns null when there are no slots', () => {
    expect(pickDefaultSlot([], at(6))).toBeNull();
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
    expect(sortRoutesForSlot(routes, key).map((r) => r.id)).toEqual(['topNear', 'topFar', 'mid', 'none', 'otherSlot']);
  });
});

describe('routeSafetyForSlot / segmentSafetyForSlot', () => {
  const r = route('a', { safety: [slot('evening', '18:00', '20:00', 45)] });
  const segment: Segment = {
    id: 's1',
    name: 'Tramo',
    order: 0,
    coordinates: [],
    lengthM: 100,
    safety: { evening: { level: 'medium', score: 45, factors: [] } },
  };

  it('finds the route and segment safety through the slot window', () => {
    expect(routeSafetyForSlot(r, '18:00-20:00')?.score).toBe(45);
    expect(segmentSafetyForSlot(segment, r, '18:00-20:00')).toEqual({ level: 'medium', score: 45, factors: [] });
  });

  it('returns null for unknown slots or missing keys', () => {
    expect(routeSafetyForSlot(r, '05:00-07:00')).toBeNull();
    expect(routeSafetyForSlot(r, null)).toBeNull();
    expect(segmentSafetyForSlot(segment, r, '05:00-07:00')).toBeNull();
  });
});

describe('labels', () => {
  it('formats distances with a Spanish decimal comma', () => {
    expect(formatKm(5.25)).toBe('5,3 km');
    expect(formatMeters(850)).toBe('850 m');
    expect(formatMeters(1234)).toBe('1,2 km');
  });

  it('labels known and unknown factor types', () => {
    expect(factorTypeLabel('poor_lighting')).toBe('Iluminación deficiente');
    expect(factorTypeLabel('flood_risk')).toBe('Riesgo de inundación');
    expect(factorTypeLabel('aliens')).toBe('Otro');
  });
});
