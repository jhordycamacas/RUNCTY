import { UnitSystem } from '../../preferences/domain/preferences';
import { formatDistance } from '../../preferences/domain/units';
import { SafetyLevel, Severity } from './route';

/** Spanish UI labels for the route catalog. */
const FACTOR_TYPE_LABELS: Record<string, string> = {
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

/**
 * Wording of the safety index. A route is never called "segura" or "insegura": it has a level
 * (Alto, Medio, Bajo) for a time slot, estimated from the registered risk factors.
 */
export const SAFETY_LEVEL_LABELS: Record<SafetyLevel, { full: string; short: string }> = {
  high: { full: 'Seguridad alta', short: 'Alto' },
  medium: { full: 'Seguridad media', short: 'Medio' },
  low: { full: 'Seguridad baja', short: 'Bajo' },
};

export const SAFETY_DISCLAIMER =
  'El nivel de seguridad es una estimación según los factores registrados. No garantiza seguridad absoluta.';

/** Unknown factor types (added later in the backend) read as "Otro". */
export function factorTypeLabel(type: string): string {
  return Object.prototype.hasOwnProperty.call(FACTOR_TYPE_LABELS, type)
    ? FACTOR_TYPE_LABELS[type]
    : 'Otro';
}

const FEET_PER_METER = 3.28084;

/** Elevation gain in the chosen units: `"120 m"` or `"394 ft"`. */
export function formatElevation(meters: number, units: UnitSystem): string {
  return units === 'imperial'
    ? `${Math.round(meters * FEET_PER_METER)} ft`
    : `${Math.round(meters)} m`;
}

/** Segment lengths: metric `850` -> `"850 m"`, `1234` -> `"1,2 km"`; imperial is always miles. */
export function formatSegmentLength(meters: number, units: UnitSystem): string {
  return units === 'metric' && meters < 1000
    ? `${Math.round(meters)} m`
    : formatDistance(meters / 1000, units);
}
