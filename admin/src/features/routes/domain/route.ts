import { z } from 'zod';

/**
 * RF-05 / RF-07: routes as stored in `routes/{id}`. Same enums and limits as
 * functions/src/routes/domain/inputs.ts (the server is the source of truth).
 */
export const SURFACES = ['asphalt', 'trail', 'mixed', 'track'] as const;
export const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;

export type Surface = (typeof SURFACES)[number];
export type Difficulty = (typeof DIFFICULTIES)[number];
export type Severity = 'low' | 'medium' | 'high';
export type SafetyLevel = 'high' | 'medium' | 'low';

export interface LatLng {
  lat: number;
  lng: number;
}

interface RoutePoint extends LatLng {
  label: string;
}

interface RouteFactor {
  segmentId: string;
  segmentName: string;
  type: string;
  severity: Severity;
  description: string;
}

/** Computed by the backend per time slot id. */
interface IndiceSeguridadRuta {
  level: SafetyLevel;
  score: number;
  startTime: string;
  endTime: string;
  worstSegmentId: string;
  factors: RouteFactor[];
}

export type RouteSafety = Record<string, IndiceSeguridadRuta>;

/** Payload of createRoute / updateRoute (updateRoute also sends `id`). */
export interface RouteInput {
  name: string;
  cityId: string;
  description: string;
  start: RoutePoint;
  end: RoutePoint;
  distanceKm: number;
  elevationGainM: number;
  surface: Surface;
  difficulty: Difficulty;
  active: boolean;
}

export interface Ruta extends RouteInput {
  id: string;
  segmentCount: number;
  safety: RouteSafety;
}

const SURFACE_LABELS: Record<Surface, string> = {
  asphalt: 'Asfalto',
  trail: 'Sendero',
  mixed: 'Mixto',
  track: 'Pista',
};

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
};

const LEVEL_LABELS: Record<SafetyLevel, string> = { high: 'Alto', medium: 'Medio', low: 'Bajo' };

export const surfaceLabel = (surface: Surface): string => SURFACE_LABELS[surface];
export const difficultyLabel = (difficulty: Difficulty): string => DIFFICULTY_LABELS[difficulty];
/** Safety level of a slot: never "segura/insegura". */
export const levelLabel = (level: SafetyLevel): string => LEVEL_LABELS[level];

export const MAX_ROUTE_NAME = 80;
export const MAX_POINT_LABEL = 80;
export const MAX_ROUTE_DESCRIPTION = 500;
const MAX_DISTANCE_KM = 500;
const MAX_ELEVATION_M = 10000;

export interface RouteFormValues {
  name: string;
  cityId: string;
  description: string;
  startLabel: string;
  startLat: string;
  startLng: string;
  endLabel: string;
  endLat: string;
  endLng: string;
  distanceKm: string;
  elevationGainM: string;
  surface: Surface;
  difficulty: Difficulty;
  active: boolean;
}

export const emptyRouteForm = (): RouteFormValues => ({
  name: '',
  cityId: '',
  description: '',
  startLabel: '',
  startLat: '',
  startLng: '',
  endLabel: '',
  endLat: '',
  endLng: '',
  distanceKm: '',
  elevationGainM: '0',
  surface: 'asphalt',
  difficulty: 'beginner',
  active: true,
});

export function routeToForm(route: Ruta): RouteFormValues {
  return {
    name: route.name,
    cityId: route.cityId,
    description: route.description,
    startLabel: route.start.label,
    startLat: String(route.start.lat),
    startLng: String(route.start.lng),
    endLabel: route.end.label,
    endLat: String(route.end.lat),
    endLng: String(route.end.lng),
    distanceKm: String(route.distanceKm),
    elevationGainM: String(route.elevationGainM),
    surface: route.surface,
    difficulty: route.difficulty,
    active: route.active,
  };
}

/** Text input → number, accepting a decimal comma. */
const decimal = (rule: z.ZodNumber) =>
  z
    .string()
    .trim()
    .min(1, 'Obligatorio.')
    .transform((v) => Number(v.replace(',', '.')))
    .pipe(rule);

const coordinate = (min: number, max: number) =>
  decimal(
    z
      .number('Ingresa un número.')
      .refine(Number.isFinite, 'Ingresa un número.')
      .min(min, `Debe estar entre ${min} y ${max}.`)
      .max(max, `Debe estar entre ${min} y ${max}.`),
  );

const pointLabel = z
  .string()
  .trim()
  .min(1, 'Obligatorio.')
  .max(MAX_POINT_LABEL, `Máximo ${MAX_POINT_LABEL} caracteres.`);

/** Same rule as CITY_ID_PATTERN in functions/src/cities/deleteCity.ts. */
const CITY_ID = /^[a-z0-9][a-z0-9-]{1,63}$/;

const routeFormSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio.').max(MAX_ROUTE_NAME, `Máximo ${MAX_ROUTE_NAME} caracteres.`),
  cityId: z.string().regex(CITY_ID, 'Elige la ciudad o zona de la ruta.'),
  description: z.string().trim().max(MAX_ROUTE_DESCRIPTION, `Máximo ${MAX_ROUTE_DESCRIPTION} caracteres.`),
  startLabel: pointLabel,
  startLat: coordinate(-90, 90),
  startLng: coordinate(-180, 180),
  endLabel: pointLabel,
  endLat: coordinate(-90, 90),
  endLng: coordinate(-180, 180),
  distanceKm: decimal(
    z
      .number('Ingresa un número.')
      .refine(Number.isFinite, 'Ingresa un número.')
      .refine((v) => v > 0 && v <= MAX_DISTANCE_KM, `Debe ser mayor que 0 y máximo ${MAX_DISTANCE_KM} km.`),
  ),
  elevationGainM: decimal(
    z
      .number('Ingresa un número.')
      .refine(Number.isFinite, 'Ingresa un número.')
      .min(0, `Debe estar entre 0 y ${MAX_ELEVATION_M} m.`)
      .max(MAX_ELEVATION_M, `Debe estar entre 0 y ${MAX_ELEVATION_M} m.`),
  ),
  surface: z.enum(SURFACES),
  difficulty: z.enum(DIFFICULTIES),
  active: z.boolean(),
});

export type RouteFormErrors = Partial<Record<keyof RouteFormValues, string>>;

export type FormResult<T, E> = { ok: true; value: T } | { ok: false; errors: E };

/** First message per field, keyed by the top-level path. */
function collectErrors<K extends string>(issues: readonly z.core.$ZodIssue[]): Partial<Record<K, string>> {
  const errors: Partial<Record<K, string>> = {};
  for (const issue of issues) {
    const key = issue.path[0] as K;
    errors[key] ??= issue.message;
  }
  return errors;
}

export function parseRouteForm(values: RouteFormValues): FormResult<RouteInput, RouteFormErrors> {
  const result = routeFormSchema.safeParse(values);
  if (!result.success) return { ok: false, errors: collectErrors<keyof RouteFormValues>(result.error.issues) };
  const v = result.data;
  return {
    ok: true,
    value: {
      name: v.name,
      cityId: v.cityId,
      description: v.description,
      start: { label: v.startLabel, lat: v.startLat, lng: v.startLng },
      end: { label: v.endLabel, lat: v.endLat, lng: v.endLng },
      distanceKm: v.distanceKm,
      elevationGainM: v.elevationGainM,
      surface: v.surface,
      difficulty: v.difficulty,
      active: v.active,
    },
  };
}

export interface RouteFilters {
  cityId: string;
  difficulty: Difficulty | '';
  text: string;
}

const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

/** RF-05-7: list filter by city, difficulty and name/description text. */
export function filterRoutes(routes: readonly Ruta[], filters: RouteFilters): Ruta[] {
  const text = normalize(filters.text);
  return routes.filter(
    (r) =>
      (filters.cityId === '' || r.cityId === filters.cityId) &&
      (filters.difficulty === '' || r.difficulty === filters.difficulty) &&
      (text === '' || normalize(`${r.name} ${r.description}`).includes(text)),
  );
}

export interface SlotSafetyEntry extends IndiceSeguridadRuta {
  slotId: string;
}

/** Route safety per slot, ordered by start time. */
export function safetyBySlot(safety: RouteSafety): SlotSafetyEntry[] {
  return Object.entries(safety)
    .map(([slotId, s]) => ({ slotId, ...s }))
    .sort((a, b) => a.startTime.localeCompare(b.startTime) || a.endTime.localeCompare(b.endTime));
}
