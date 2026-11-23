/** A place belongs to a parent city when it is a zone, whatever its free-text type says. */
export const isZoneRecord = (record: CityRecord): boolean =>
  typeof record.parentCityId === 'string' && record.parentCityId !== '';

/** A city as the pickers need it. */
export interface City {
  id: string;
  name: string;
  province: string | null;
}

/** One entry of `GET /cities`. */
export interface CityRecord {
  id: string;
  name?: unknown;
  province?: unknown;
  /** Free text typed by the admin; only `parentCityId` tells a zone from a city. */
  type?: unknown;
  parentCityId?: unknown;
}

export abstract class CityRepository {
  /** The public catalogue: cities and zones. */
  abstract list(): Promise<CityRecord[]>;
}

/**
 * Sign-up and profile pickers list cities only: zones (places with a parent city) are
 * subdivisions used by routes.
 */
export function toPickerCities(records: CityRecord[]): City[] {
  return records
    .filter((record) => !isZoneRecord(record))
    .map((record) => ({
      id: record.id,
      name: typeof record.name === 'string' && record.name.length > 0 ? record.name : record.id,
      province: typeof record.province === 'string' ? record.province : null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
}
