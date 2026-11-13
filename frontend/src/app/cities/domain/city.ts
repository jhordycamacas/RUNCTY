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
  type?: unknown;
}

export abstract class CityRepository {
  /** The public catalogue: cities and zones. */
  abstract list(): Promise<CityRecord[]>;
}

/**
 * Sign-up and profile pickers list cities only: zones are subdivisions used by routes.
 * Records without `type` predate zones and are cities.
 */
export function toPickerCities(records: CityRecord[]): City[] {
  return records
    .filter((record) => record.type !== 'zone')
    .map((record) => ({
      id: record.id,
      name: typeof record.name === 'string' && record.name.length > 0 ? record.name : record.id,
      province: typeof record.province === 'string' ? record.province : null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
}
