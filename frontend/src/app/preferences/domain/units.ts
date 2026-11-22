import { UnitSystem } from './preferences';

const KM_PER_MILE = 1.609344;

/** A figure split from its unit, so a screen can draw the number large and the unit small. */
export interface FigureParts {
  value: string;
  unit: string;
}

/**
 * A distance in the unit the user chose (RF-01-13), as number and unit. Distances are stored and
 * calculated in kilometres; only the text changes. Every screen that shows a distance goes
 * through here.
 */
export function distanceParts(km: number, units: UnitSystem, fixedDecimals?: number): FigureParts {
  const value = units === 'imperial' ? km / KM_PER_MILE : km;
  // Up to one decimal by default ("5 km", "5,2 km"); a live counter asks for a fixed width.
  const text = new Intl.NumberFormat('es', {
    minimumFractionDigits: fixedDecimals ?? 0,
    maximumFractionDigits: fixedDecimals ?? 1,
  }).format(value);
  return { value: text, unit: units === 'imperial' ? 'mi' : 'km' };
}

/** "3,2 km" or "2 mi". */
export function formatDistance(km: number, units: UnitSystem): string {
  const { value, unit } = distanceParts(km, units);
  return `${value} ${unit}`;
}

/** Pace as minutes:seconds per kilometre or mile; "--:--" while there is no pace yet. */
export function paceParts(secondsPerKm: number | null, units: UnitSystem): FigureParts {
  const unit = units === 'imperial' ? 'min/mi' : 'min/km';
  if (secondsPerKm === null || !Number.isFinite(secondsPerKm)) return { value: '--:--', unit };
  const total = Math.round(units === 'imperial' ? secondsPerKm * KM_PER_MILE : secondsPerKm);
  const minutes = Math.floor(total / 60);
  const seconds = String(total % 60).padStart(2, '0');
  return { value: `${minutes}:${seconds}`, unit };
}
