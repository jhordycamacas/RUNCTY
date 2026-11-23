/**
 * Pure helpers behind the route catalog: filters, the time slots offered by the routes of a city
 * and the order in which routes are recommended.
 *
 * Time slots are per route in the API (`timeSlots`), so the catalog groups them by window
 * ("05:00-07:00") instead of by id.
 */
import { Route, RouteSlotSafety, Segment, SegmentSlotSafety } from './route';

export type DistanceBucket = 'all' | 'upTo5' | 'from5to10' | 'over10';
/** A difficulty typed by the admins, or `all`. */
export type DifficultyFilter = string;

export interface RouteFilters {
  distance: DistanceBucket;
  difficulty: DifficultyFilter;
  /** A surface typed by the admins, or `all`. */
  surface: string;
}

export const DEFAULT_FILTERS: RouteFilters = { distance: 'all', difficulty: 'all', surface: 'all' };

/** Buckets are in kilometres whatever the units preference is; only the route cards convert. */
export const DISTANCE_BUCKET_LABELS: Record<DistanceBucket, string> = {
  all: 'Todas',
  upTo5: 'Hasta 5 km',
  from5to10: '5–10 km',
  over10: 'Más de 10 km',
};

function inBucket(km: number, bucket: DistanceBucket): boolean {
  switch (bucket) {
    case 'upTo5':
      return km <= 5;
    case 'from5to10':
      return km > 5 && km <= 10;
    case 'over10':
      return km > 10;
    default:
      return true;
  }
}

function distinctSorted(values: readonly (string | null)[]): string[] {
  const found = new Set<string>();
  for (const value of values) if (value) found.add(value);
  return [...found].sort((a, b) => a.localeCompare(b, 'es'));
}

/** The distinct difficulties found in the routes, in alphabetical order. */
export function listDifficulties(routes: readonly Route[]): string[] {
  return distinctSorted(routes.map((route) => route.difficulty));
}

/** The distinct surfaces found in the routes, in alphabetical order. */
export function listSurfaces(routes: readonly Route[]): string[] {
  return distinctSorted(routes.map((route) => route.surface));
}

export function filterRoutes(routes: readonly Route[], filters: RouteFilters): Route[] {
  return routes.filter(
    (route) =>
      inBucket(route.distanceKm, filters.distance) &&
      (filters.difficulty === 'all' || route.difficulty === filters.difficulty) &&
      (filters.surface === 'all' || route.surface === filters.surface),
  );
}

/** How many filters are set to something other than "Todas". */
export function countActiveFilters(filters: RouteFilters): number {
  return (Object.keys(DEFAULT_FILTERS) as (keyof RouteFilters)[]).filter(
    (key) => filters[key] !== DEFAULT_FILTERS[key],
  ).length;
}

/** Lower case without accents, so "Malecón" is found typing "malecon". */
const fold = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase();

/** Routes whose name contains the typed text, ignoring case and accents; blank keeps all. */
export function searchRoutes(routes: readonly Route[], query: string): Route[] {
  const wanted = fold(query).trim();
  return wanted ? routes.filter((route) => fold(route.name).includes(wanted)) : [...routes];
}

export interface TimeSlotOption {
  /** "05:00-07:00": identifies the window across routes. */
  key: string;
  startTime: string;
  endTime: string;
  /** "05:00 – 07:00". */
  label: string;
}

export const slotKey = (startTime: string, endTime: string) => `${startTime}-${endTime}`;

/** Distinct time slot windows present in the routes' safety, by start time. */
export function listTimeSlots(routes: readonly Route[]): TimeSlotOption[] {
  const byKey = new Map<string, TimeSlotOption>();
  for (const route of routes) {
    for (const { startTime, endTime } of route.safety) {
      const key = slotKey(startTime, endTime);
      if (!byKey.has(key)) {
        byKey.set(key, { key, startTime, endTime, label: `${startTime} – ${endTime}` });
      }
    }
  }
  return [...byKey.values()].sort(
    (a, b) => a.startTime.localeCompare(b.startTime) || a.endTime.localeCompare(b.endTime),
  );
}

const minutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));

/**
 * The window the runner is likely to go out in: the one in progress, else the next one to start
 * today, else the first of tomorrow. The windows are the ones the admins defined (`slots` are
 * ordered by start time), so no schedule is fixed in the app.
 */
export function pickDefaultSlot(
  slots: readonly TimeSlotOption[],
  now: Date,
): TimeSlotOption | null {
  if (slots.length === 0) return null;
  const current = now.getHours() * 60 + now.getMinutes();
  const inProgress = slots.find(
    (s) => minutes(s.startTime) <= current && current < minutes(s.endTime),
  );
  return inProgress ?? slots.find((s) => minutes(s.startTime) > current) ?? slots[0];
}

/** The chosen window when the routes still offer it, else the default one. */
export function resolveSlotKey(
  slots: readonly TimeSlotOption[],
  chosen: string | null,
  now: Date,
): string | null {
  return chosen && slots.some((slot) => slot.key === chosen)
    ? chosen
    : (pickDefaultSlot(slots, now)?.key ?? null);
}

export function routeSafetyForSlot(route: Route, key: string | null): RouteSlotSafety | null {
  if (!key) return null;
  return route.safety.find((s) => slotKey(s.startTime, s.endTime) === key) ?? null;
}

/** Segment safety is keyed by the route's own slot id. */
export function segmentSafetyForSlot(
  segment: Segment,
  route: Route,
  key: string | null,
): SegmentSlotSafety | null {
  const routeSlot = routeSafetyForSlot(route, key);
  return routeSlot ? (segment.safety[routeSlot.slotId] ?? null) : null;
}

/** Best safety score first, then the shortest; routes without data for the slot go last. */
export function sortRoutesForSlot(routes: readonly Route[], key: string | null): Route[] {
  return [...routes].sort((a, b) => {
    const sa = routeSafetyForSlot(a, key);
    const sb = routeSafetyForSlot(b, key);
    if (sa && !sb) return -1;
    if (!sa && sb) return 1;
    if (sa && sb && sa.score !== sb.score) return sb.score - sa.score;
    return a.distanceKm - b.distanceKm;
  });
}

export type RouteSort = 'safety' | 'distance' | 'name';

export const ROUTE_SORT_LABELS: Record<RouteSort, string> = {
  safety: 'Más segura',
  distance: 'Distancia',
  name: 'Nombre',
};

/** Orders the routes by safety for the slot, shortest distance or name (accents ignored). */
export function sortRoutes(
  routes: readonly Route[],
  sort: RouteSort,
  key: string | null,
): Route[] {
  switch (sort) {
    case 'distance':
      return [...routes].sort((a, b) => a.distanceKm - b.distanceKm || byName(a, b));
    case 'name':
      return [...routes].sort(byName);
    default:
      return sortRoutesForSlot(routes, key);
  }
}

const byName = (a: Route, b: Route) => a.name.localeCompare(b.name, 'es');
