/**
 * Tolerant mappers from Firestore data to the route domain. Routes are edited
 * from the admin panel and the backend may add fields or values later, so
 * unknown or malformed fields fall back to safe defaults instead of throwing.
 */
import {
  DIFFICULTIES,
  SAFETY_LEVELS,
  SEVERITIES,
  SURFACES,
  type LatLng,
  type Ruta,
  type RouteFactor,
  type RoutePoint,
  type IndiceSeguridadRuta,
  type SafetyFactor,
  type Tramo,
  type IndiceSeguridadTramo,
} from './route';

type Data = Record<string, unknown>;

const TIME_PATTERN = /^([01]\d|2[0-4]):[0-5]\d$/;

const asRecord = (value: unknown): Data =>
  typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Data) : {};
const asString = (value: unknown, fallback = ''): string => (typeof value === 'string' ? value : fallback);
const asNumber = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;
const asTime = (value: unknown): string | null =>
  typeof value === 'string' && TIME_PATTERN.test(value) ? value : null;

function oneOf<T extends string>(options: readonly T[], value: unknown): T | null {
  return typeof value === 'string' && (options as readonly string[]).includes(value) ? (value as T) : null;
}

function toLatLng(value: unknown): LatLng | null {
  const data = asRecord(value);
  if (typeof data.lat !== 'number' || typeof data.lng !== 'number') return null;
  if (!Number.isFinite(data.lat) || !Number.isFinite(data.lng)) return null;
  return { lat: data.lat, lng: data.lng };
}

function toRoutePoint(value: unknown): RoutePoint | null {
  const point = toLatLng(value);
  return point ? { ...point, label: asString(asRecord(value).label) } : null;
}

function toFactor(value: unknown): SafetyFactor | null {
  const data = asRecord(value);
  const severity = oneOf(SEVERITIES, data.severity);
  if (!severity) return null;
  return { type: asString(data.type, 'other'), severity, description: asString(data.description) };
}

function toFactors<T>(value: unknown, map: (item: unknown) => T | null): T[] {
  if (!Array.isArray(value)) return [];
  return value.map(map).filter((item): item is T => item !== null);
}

function toRouteFactor(value: unknown): RouteFactor | null {
  const factor = toFactor(value);
  if (!factor) return null;
  const data = asRecord(value);
  return { segmentId: asString(data.segmentId), segmentName: asString(data.segmentName), ...factor };
}

function toRouteSlotSafety(slotId: string, value: unknown): IndiceSeguridadRuta | null {
  const data = asRecord(value);
  const level = oneOf(SAFETY_LEVELS, data.level);
  const startTime = asTime(data.startTime);
  const endTime = asTime(data.endTime);
  if (!level || !startTime || !endTime) return null;
  return {
    slotId,
    level,
    score: asNumber(data.score),
    startTime,
    endTime,
    worstSegmentId: asString(data.worstSegmentId),
    factors: toFactors(data.factors, toRouteFactor),
  };
}

function toSegmentSlotSafety(value: unknown): IndiceSeguridadTramo | null {
  const data = asRecord(value);
  const level = oneOf(SAFETY_LEVELS, data.level);
  if (!level) return null;
  return { level, score: asNumber(data.score), factors: toFactors(data.factors, toFactor) };
}

export function toRoute(id: string, raw: unknown): Ruta {
  const data = asRecord(raw);
  const safety = Object.entries(asRecord(data.safety))
    .map(([slotId, value]) => toRouteSlotSafety(slotId, value))
    .filter((entry): entry is IndiceSeguridadRuta => entry !== null)
    .sort((a, b) => a.startTime.localeCompare(b.startTime) || a.endTime.localeCompare(b.endTime));

  return {
    id,
    name: asString(data.name) || id,
    cityId: asString(data.cityId),
    description: asString(data.description),
    start: toRoutePoint(data.start),
    end: toRoutePoint(data.end),
    distanceKm: asNumber(data.distanceKm),
    elevationGainM: asNumber(data.elevationGainM),
    surface: oneOf(SURFACES, data.surface),
    difficulty: oneOf(DIFFICULTIES, data.difficulty),
    segmentCount: asNumber(data.segmentCount),
    safety,
  };
}

export function toSegment(id: string, raw: unknown): Tramo {
  const data = asRecord(raw);
  const safety: Record<string, IndiceSeguridadTramo> = {};
  for (const [slotId, value] of Object.entries(asRecord(data.safety))) {
    const entry = toSegmentSlotSafety(value);
    if (entry) safety[slotId] = entry;
  }

  return {
    id,
    name: asString(data.name) || id,
    order: asNumber(data.order),
    coordinates: toFactors(data.coordinates, toLatLng),
    lengthM: asNumber(data.lengthM),
    safety,
  };
}
