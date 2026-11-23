/**
 * Pure helpers behind the route catalog: filters, the time slots offered by the routes of a city
 * and the order in which routes are recommended.
 *
 * Time slots are per route in the API (`timeSlots`), so the catalog groups them by window
 * ("05:00-07:00") instead of by id.
 */
import {
  TRAINING_SLOTS,
  TrainingSlot,
  getNextTrainingSlot,
} from '../../training/domain/training-slots';
import { Route, RouteSlotSafety, Segment, SegmentSlotSafety } from './route';

export type DistanceBucket = 'all' | 'upTo5' | 'from5to10' | 'over10';
/** A difficulty typed by the admins, or `all`. */
export type DifficultyFilter = string;

export interface RouteFilters {
  distance: DistanceBucket;
  difficulty: DifficultyFilter;
}

export const DEFAULT_FILTERS: RouteFilters = { distance: 'all', difficulty: 'all' };

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

/** The distinct difficulties found in the routes, in alphabetical order. */
export function listDifficulties(routes: readonly Route[]): string[] {
  const found = new Set<string>();
  for (const route of routes) if (route.difficulty) found.add(route.difficulty);
  return [...found].sort((a, b) => a.localeCompare(b, 'es'));
}

export function filterRoutes(routes: readonly Route[], filters: RouteFilters): Route[] {
  return routes.filter(
    (route) =>
      inBucket(route.distanceKm, filters.distance) &&
      (filters.difficulty === 'all' || route.difficulty === filters.difficulty),
  );
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
 * The slot overlapping the current (or next) recommended training slot, so the catalog opens on
 * the hour the runner is likely to go out. Falls back to the first slot.
 */
export function pickDefaultSlot(
  slots: readonly TimeSlotOption[],
  now: Date,
  trainingSlots: readonly TrainingSlot[] = TRAINING_SLOTS,
): TimeSlotOption | null {
  if (slots.length === 0) return null;
  const { slot } = getNextTrainingSlot(now, trainingSlots);
  const start = slot.startHour * 60;
  const end = slot.endHour * 60;
  return slots.find((s) => minutes(s.startTime) < end && start < minutes(s.endTime)) ?? slots[0];
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
