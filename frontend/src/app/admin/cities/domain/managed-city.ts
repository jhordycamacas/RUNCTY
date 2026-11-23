/**
 * A city, or a zone of a city, as `GET /cities` answers it. `type` and `coverage` are free text
 * the admin typed; a place is a zone when it has a parent city, whatever its type says.
 */
export interface ManagedCity {
  id: string;
  name: string;
  province: string;
  type: string;
  parentCityId: string | null;
  lat: number;
  lng: number;
  coverage: string;
}

/** The editable fields; `parentCityId` is `null` for a top-level city. The id never changes. */
export interface CityInput {
  name: string;
  province: string;
  type: string;
  location: { lat: number; lng: number };
  coverage: string;
  parentCityId: string | null;
}

export interface CityCreateInput extends CityInput {
  id: string;
}

export abstract class CityAdminRepository {
  abstract list(): Promise<ManagedCity[]>;
  abstract create(input: CityCreateInput): Promise<void>;
  abstract update(cityId: string, input: CityInput): Promise<void>;
  abstract delete(cityId: string): Promise<void>;
}

const num = (value: unknown): number => (typeof value === 'number' ? value : 0);

const text = (value: unknown, fallback: string): string =>
  typeof value === 'string' && value ? value : fallback;

/** Tolerant read of one entry of `GET /cities`; a record without `type` predates zones. */
export function toManagedCity(raw: unknown): ManagedCity {
  const data = (raw ?? {}) as Record<string, unknown>;
  const id = typeof data['id'] === 'string' ? data['id'] : '';
  const location = (data['location'] ?? {}) as Record<string, unknown>;
  const parent = data['parentCityId'];
  return {
    id,
    name: typeof data['name'] === 'string' && data['name'] ? data['name'] : id,
    province: typeof data['province'] === 'string' ? data['province'] : '',
    type: text(data['type'], 'city'),
    parentCityId: typeof parent === 'string' && parent ? parent : null,
    lat: num(location['lat']),
    lng: num(location['lng']),
    coverage: text(data['coverage'], 'planned'),
  };
}

/** A city with the zones under it; a zone whose city is gone still shows, as its own group. */
export interface CityGroup {
  city: ManagedCity;
  zones: ManagedCity[];
}

export function groupCities(cities: readonly ManagedCity[]): CityGroup[] {
  const byName = (a: ManagedCity, b: ManagedCity) => a.name.localeCompare(b.name, 'es');
  const roots = cities.filter((city) => city.parentCityId === null);
  const known = new Set(roots.map((city) => city.id));
  const zonesOf = (id: string) => cities.filter((city) => city.parentCityId === id).sort(byName);
  const orphans = cities.filter(
    (city) => city.parentCityId !== null && !known.has(city.parentCityId),
  );
  return [
    ...roots.sort(byName).map((city) => ({ city, zones: zonesOf(city.id) })),
    ...orphans.sort(byName).map((city) => ({ city, zones: [] })),
  ];
}
