/**
 * Route catalog (RF-05) with its safety index per time slot (RF-07), as the
 * runner app reads it. The index is computed by the backend
 * (`functions/src/routes/domain/safety.ts`); the app only displays it.
 */
export const SURFACES = ['asphalt', 'trail', 'mixed', 'track'] as const;
export const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;
export const SEVERITIES = ['low', 'medium', 'high'] as const;
export const SAFETY_LEVELS = ['high', 'medium', 'low'] as const;

export type Surface = (typeof SURFACES)[number];
export type Difficulty = (typeof DIFFICULTIES)[number];
export type Severity = (typeof SEVERITIES)[number];
export type SafetyLevel = (typeof SAFETY_LEVELS)[number];

export interface LatLng {
  lat: number;
  lng: number;
}

export interface RoutePoint extends LatLng {
  label: string;
}

/** A risk factor that explains a safety level. */
export interface SafetyFactor {
  /** Risk factor type, e.g. `poor_lighting`; unknown types are kept as-is. */
  type: string;
  severity: Severity;
  description: string;
}

export interface RouteFactor extends SafetyFactor {
  segmentId: string;
  segmentName: string;
}

/** `routes/{id}.safety[slotId]`: the route takes its worst segment. */
export interface RouteSlotSafety {
  slotId: string;
  level: SafetyLevel;
  score: number;
  startTime: string;
  endTime: string;
  worstSegmentId: string;
  factors: RouteFactor[];
}

export interface Route {
  id: string;
  name: string;
  cityId: string;
  description: string;
  start: RoutePoint | null;
  end: RoutePoint | null;
  /** NaN-free; 0 when missing. */
  distanceKm: number;
  elevationGainM: number;
  surface: Surface | null;
  difficulty: Difficulty | null;
  segmentCount: number;
  /** Slot safety entries sorted by start time. */
  safety: RouteSlotSafety[];
}

/** `routes/{id}/segments/{id}.safety[slotId]`. */
export interface SegmentSlotSafety {
  level: SafetyLevel;
  score: number;
  factors: SafetyFactor[];
}

export interface Segment {
  id: string;
  name: string;
  order: number;
  coordinates: LatLng[];
  lengthM: number;
  safety: Record<string, SegmentSlotSafety>;
}

export interface RouteRepository {
  /** Active routes of a city (runners can only read active routes). */
  listActiveByCity(cityId: string): Promise<Route[]>;
  /** Null when the route does not exist. */
  getById(routeId: string): Promise<Route | null>;
  /** Segments sorted by `order`. */
  listSegments(routeId: string): Promise<Segment[]>;
}
