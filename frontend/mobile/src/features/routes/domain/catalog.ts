/**
 * Pure helpers behind the route catalog: filters, the time slots offered by
 * the routes of a city and the order in which routes are recommended.
 *
 * Time slots are per route in Firestore (`routes/{id}/timeSlots`), so the
 * catalog groups them by window ("05:00-07:00") instead of by id.
 */
import { TRAINING_SLOTS, getNextTrainingSlot, type TrainingSlot } from '@/features/training/domain/trainingSlots';

import type { Difficulty, Ruta, IndiceSeguridadRuta, Tramo, IndiceSeguridadTramo } from './route';

export type DistanceBucket = 'all' | 'upTo5' | 'from5to10' | 'over10';
export type DifficultyFilter = Difficulty | 'all';

export interface RouteFilters {
  distance: DistanceBucket;
  difficulty: DifficultyFilter;
}

export const DEFAULT_FILTERS: RouteFilters = { distance: 'all', difficulty: 'all' };

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

export function filterRoutes(routes: readonly Ruta[], filters: RouteFilters): Ruta[] {
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
export function listTimeSlots(routes: readonly Ruta[]): TimeSlotOption[] {
  const byKey = new Map<string, TimeSlotOption>();
  for (const route of routes) {
    for (const { startTime, endTime } of route.safety) {
      const key = slotKey(startTime, endTime);
      if (!byKey.has(key)) byKey.set(key, { key, startTime, endTime, label: `${startTime} – ${endTime}` });
    }
  }
  return [...byKey.values()].sort(
    (a, b) => a.startTime.localeCompare(b.startTime) || a.endTime.localeCompare(b.endTime),
  );
}

const minutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));

/**
 * The slot overlapping the current (or next) recommended training slot, so
 * the catalog opens on the hour the runner is likely to go out. Falls back
 * to the first slot.
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

export function routeSafetyForSlot(route: Ruta, key: string | null): IndiceSeguridadRuta | null {
  if (!key) return null;
  return route.safety.find((s) => slotKey(s.startTime, s.endTime) === key) ?? null;
}

/** Segment safety is keyed by the route's own slot id. */
export function segmentSafetyForSlot(segment: Tramo, route: Ruta, key: string | null): IndiceSeguridadTramo | null {
  const routeSlot = routeSafetyForSlot(route, key);
  return routeSlot ? (segment.safety[routeSlot.slotId] ?? null) : null;
}

/** Best safety score first, then the shortest; routes without data for the slot go last. */
export function sortRoutesForSlot(routes: readonly Ruta[], key: string | null): Ruta[] {
  return [...routes].sort((a, b) => {
    const sa = routeSafetyForSlot(a, key);
    const sb = routeSafetyForSlot(b, key);
    if (sa && !sb) return -1;
    if (!sa && sb) return 1;
    if (sa && sb && sa.score !== sb.score) return sb.score - sa.score;
    return a.distanceKm - b.distanceKm;
  });
}
