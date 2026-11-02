import type { UnitSystem } from './preferences';

const KM_PER_MILE = 1.609344;

/** `formatDistance(10, 'imperial')` → `"6,2 mi"`. One decimal, Spanish decimal comma. */
export function formatDistance(km: number, units: UnitSystem): string {
  if (!Number.isFinite(km) || km < 0) {
    throw new RangeError(`Invalid distance: ${km}`);
  }
  const value = units === 'imperial' ? km / KM_PER_MILE : km;
  const unit = units === 'imperial' ? 'mi' : 'km';
  return `${value.toFixed(1).replace('.', ',')} ${unit}`;
}
