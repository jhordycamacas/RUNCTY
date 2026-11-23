/**
 * Tolerant mappers from API data to the route domain. Routes are edited from the admin area and
 * the backend may add fields or values later, so unknown or malformed fields fall back to safe
 * defaults instead of throwing.
 */
import {
  SAFETY_LEVELS,
  SEVERITIES,
  LatLng,
  Route,
  RouteDetail,
  RouteFactor,
  RoutePoint,
  RouteSlotSafety,
  SafetyFactor,
  Segment,
  SegmentSlotSafety,
} from './route';

type Data = Record<string, unknown>;

const TIME_PATTERN = /^([01]\d|2[0-4]):[0-5]\d$/;

export const asRecord = (value: unknown): Data =>
  typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Data) : {};
export const asString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;
const asNumber = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;
/** Trimmed free text, or null when it is missing or blank. */
const asText = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;
export const asTime = (value: unknown): string | null =>
  typeof value === 'string' && TIME_PATTERN.test(value) ? value : null;

export function oneOf<T extends string>(options: readonly T[], value: unknown): T | null {
  return typeof value === 'string' && (options as readonly string[]).includes(value)
    ? (value as T)
    : null;
}

function toLatLng(value: unknown): LatLng | null {
  const data = asRecord(value);
  if (typeof data['lat'] !== 'number' || typeof data['lng'] !== 'number') return null;
  if (!Number.isFinite(data['lat']) || !Number.isFinite(data['lng'])) return null;
  return { lat: data['lat'], lng: data['lng'] };
}

/** `[lat, lng]` as the list sends the preview. */
function toPair(value: unknown): LatLng | null {
  if (!Array.isArray(value) || value.length !== 2) return null;
  const [lat, lng] = value as unknown[];
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

function toRoutePoint(value: unknown): RoutePoint | null {
  const point = toLatLng(value);
  return point ? { ...point, label: asString(asRecord(value)['label']) } : null;
}

function toFactor(value: unknown): SafetyFactor | null {
  const data = asRecord(value);
  const severity = oneOf(SEVERITIES, data['severity']);
  if (!severity) return null;
  return {
    type: asString(data['type'], 'other'),
    severity,
    description: asString(data['description']),
  };
}

export function toList<T>(value: unknown, map: (item: unknown) => T | null): T[] {
  if (!Array.isArray(value)) return [];
  return value.map(map).filter((item): item is T => item !== null);
}

function toRouteFactor(value: unknown): RouteFactor | null {
  const factor = toFactor(value);
  if (!factor) return null;
  const data = asRecord(value);
  return {
    segmentId: asString(data['segmentId']),
    segmentName: asString(data['segmentName']),
    ...factor,
  };
}

function toRouteSlotSafety(slotId: string, value: unknown): RouteSlotSafety | null {
  const data = asRecord(value);
  const level = oneOf(SAFETY_LEVELS, data['level']);
  const startTime = asTime(data['startTime']);
  const endTime = asTime(data['endTime']);
  if (!level || !startTime || !endTime) return null;
  return {
    slotId,
    level,
    score: asNumber(data['score']),
    startTime,
    endTime,
    worstSegmentId: asString(data['worstSegmentId']),
    factors: toList(data['factors'], toRouteFactor),
  };
}

function toSegmentSlotSafety(value: unknown): SegmentSlotSafety | null {
  const data = asRecord(value);
  const level = oneOf(SAFETY_LEVELS, data['level']);
  if (!level) return null;
  return { level, score: asNumber(data['score']), factors: toList(data['factors'], toFactor) };
}

export function toRoute(raw: unknown): Route {
  const data = asRecord(raw);
  const id = asString(data['id']);
  const safety = Object.entries(asRecord(data['safety']))
    .map(([slotId, value]) => toRouteSlotSafety(slotId, value))
    .filter((entry): entry is RouteSlotSafety => entry !== null)
    .sort((a, b) => a.startTime.localeCompare(b.startTime) || a.endTime.localeCompare(b.endTime));

  return {
    id,
    name: asString(data['name']) || id,
    cityId: asString(data['cityId']),
    description: asString(data['description']),
    start: toRoutePoint(data['start']),
    end: toRoutePoint(data['end']),
    distanceKm: asNumber(data['distanceKm']),
    elevationGainM: asNumber(data['elevationGainM']),
    surface: asText(data['surface']),
    difficulty: asText(data['difficulty']),
    active: data['active'] === true,
    segmentCount: asNumber(data['segmentCount']),
    preview: toList(data['preview'], toPair),
    safety,
  };
}

export function toSegment(raw: unknown): Segment {
  const data = asRecord(raw);
  const id = asString(data['id']);
  const safety: Record<string, SegmentSlotSafety> = {};
  for (const [slotId, value] of Object.entries(asRecord(data['safety']))) {
    const entry = toSegmentSlotSafety(value);
    if (entry) safety[slotId] = entry;
  }

  return {
    id,
    name: asString(data['name']) || id,
    order: asNumber(data['order']),
    coordinates: toList(data['coordinates'], toLatLng),
    lengthM: asNumber(data['lengthM']),
    safety,
  };
}

/** The route detail: the route plus its segments sorted by `order`. */
export function toRouteDetail(raw: unknown): RouteDetail {
  const segments = toList(asRecord(raw)['segments'], (item) => toSegment(item)).sort(
    (a, b) => a.order - b.order,
  );
  return { route: toRoute(raw), segments };
}
