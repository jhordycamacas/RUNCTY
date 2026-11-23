import { Route, RouteSlotSafety, Segment } from '../route';

/** Test builders shared by the route specs. */
export const slot = (
  slotId: string,
  startTime: string,
  endTime: string,
  score: number,
  level: RouteSlotSafety['level'] = score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low',
): RouteSlotSafety => ({
  slotId,
  startTime,
  endTime,
  score,
  level,
  worstSegmentId: '',
  factors: [],
});

export const route = (id: string, overrides: Partial<Route> = {}): Route => ({
  id,
  name: id,
  cityId: 'loja',
  description: '',
  start: null,
  end: null,
  distanceKm: 5,
  elevationGainM: 0,
  surface: 'Asfalto',
  difficulty: 'Principiante',
  active: true,
  segmentCount: 1,
  preview: [],
  safety: [],
  ...overrides,
});

export const segment = (id: string, overrides: Partial<Segment> = {}): Segment => ({
  id,
  name: id,
  order: 0,
  coordinates: [],
  lengthM: 100,
  safety: {},
  ...overrides,
});
