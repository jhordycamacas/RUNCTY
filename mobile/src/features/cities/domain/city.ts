/** Coverage of a city or zone (RF-04), managed from the admin panel. */
export type CityCoverage = 'active' | 'planned' | 'suspended';

/** `cities/{id}` holds cities and their zones (`type: 'zone'`, `parentCityId`). */
export type CityType = 'city' | 'zone';

export interface City {
  id: string;
  name: string;
  province?: string;
}

export interface CityRepository {
  /** Active cities (zones excluded), sorted by name. */
  listActive(): Promise<City[]>;
}

export interface CityDocData {
  name?: unknown;
  province?: unknown;
  type?: unknown;
  [key: string]: unknown;
}

/**
 * Sign-up and profile pickers list cities only: zones are subdivisions used
 * by routes. Docs without `type` predate zones and are cities.
 */
export function toPickerCities(docs: { id: string; data: CityDocData }[]): City[] {
  return docs
    .filter(({ data }) => data.type !== 'zone')
    .map(({ id, data }) => ({
      id,
      name: typeof data.name === 'string' && data.name.length > 0 ? data.name : id,
      province: typeof data.province === 'string' ? data.province : undefined,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
}
