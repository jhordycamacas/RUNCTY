export interface Ciudad {
  id: string;
  name: string;
  province?: string;
}

export interface CityRepository {
  /** Active cities (zones excluded), sorted by name. */
  listActive(): Promise<Ciudad[]>;
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
export function toPickerCities(docs: { id: string; data: CityDocData }[]): Ciudad[] {
  return docs
    .filter(({ data }) => data.type !== 'zone')
    .map(({ id, data }) => ({
      id,
      name: typeof data.name === 'string' && data.name.length > 0 ? data.name : id,
      province: typeof data.province === 'string' ? data.province : undefined,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
}
