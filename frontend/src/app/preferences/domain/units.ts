import { UnitSystem } from './preferences';

const KM_PER_MILE = 1.609344;

/**
 * A distance in the unit the user chose (RF-01-13). Distances are stored and calculated in
 * kilometres; only the text changes. Every screen that shows a distance goes through here.
 */
export function formatDistance(km: number, units: UnitSystem): string {
  const value = units === 'imperial' ? km / KM_PER_MILE : km;
  const text = new Intl.NumberFormat('es', { maximumFractionDigits: 1 }).format(value);
  return `${text} ${units === 'imperial' ? 'mi' : 'km'}`;
}
