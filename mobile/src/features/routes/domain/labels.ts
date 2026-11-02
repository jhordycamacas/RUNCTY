import type { Difficulty, Severity, Surface } from './route';

/** Spanish UI labels for the route catalog. */
export const SURFACE_LABELS: Record<Surface, string> = {
  asphalt: 'Asfalto',
  trail: 'Sendero',
  mixed: 'Mixto',
  track: 'Pista',
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
};

export const FACTOR_TYPE_LABELS: Record<string, string> = {
  poor_lighting: 'Iluminación deficiente',
  traffic: 'Tráfico',
  isolated_area: 'Zona solitaria',
  harassment: 'Acoso',
  uneven_terrain: 'Terreno irregular',
  flood_risk: 'Riesgo de inundación',
  other: 'Otro',
};

export const SEVERITY_LABELS: Record<Severity, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
};

/** Unknown factor types (added later in the backend) read as "Otro". */
export function factorTypeLabel(type: string): string {
  return Object.prototype.hasOwnProperty.call(FACTOR_TYPE_LABELS, type) ? FACTOR_TYPE_LABELS[type] : 'Otro';
}

const decimal = (value: number, digits: number) => value.toFixed(digits).replace('.', ',');

/** `5.25` → `"5,3 km"`. */
export function formatKm(km: number): string {
  return `${decimal(km, 1)} km`;
}

/** Segment lengths: `850` → `"850 m"`, `1234` → `"1,2 km"`. */
export function formatMeters(meters: number): string {
  return meters < 1000 ? `${Math.round(meters)} m` : formatKm(meters / 1000);
}

/** Elevation gain: `"120 m"`. */
export function formatElevation(meters: number): string {
  return `${Math.round(meters)} m`;
}
