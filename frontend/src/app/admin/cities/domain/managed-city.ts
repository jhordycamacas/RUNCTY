export const CITY_TYPES = ['city', 'zone'] as const;
export type CityType = (typeof CITY_TYPES)[number];

export const COVERAGES = ['active', 'planned', 'suspended'] as const;
export type Coverage = (typeof COVERAGES)[number];

export const CITY_TYPE_LABELS: Record<CityType, string> = { city: 'Ciudad', zone: 'Zona' };
export const COVERAGE_LABELS: Record<Coverage, string> = {
  active: 'Activa',
  planned: 'Planificada',
  suspended: 'Suspendida',
};

/** A city, or a zone of a city, as `GET /cities` answers it. */
export interface ManagedCity {
  id: string;
  name: string;
  province: string;
  type: CityType;
  /** Only a zone has a parent city. */
  parentCityId: string | null;
  lat: number;
  lng: number;
  coverage: Coverage;
}

/** The editable fields; a city sends no `parentCityId`. Identity and type never change. */
export interface CityInput {
  name: string;
  province: string;
  location: { lat: number; lng: number };
  coverage: Coverage;
  parentCityId?: string;
}

export interface CityCreateInput extends CityInput {
  id: string;
  type: CityType;
}

export abstract class CityAdminRepository {
  abstract list(): Promise<ManagedCity[]>;
  abstract create(input: CityCreateInput): Promise<void>;
  abstract update(cityId: string, input: CityInput): Promise<void>;
  abstract delete(cityId: string): Promise<void>;
}

const isCoverage = (value: unknown): value is Coverage =>
  (COVERAGES as readonly unknown[]).includes(value);

const num = (value: unknown): number => (typeof value === 'number' ? value : 0);

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
    type: data['type'] === 'zone' ? 'zone' : 'city',
    parentCityId: typeof parent === 'string' && parent ? parent : null,
    lat: num(location['lat']),
    lng: num(location['lng']),
    coverage: isCoverage(data['coverage']) ? data['coverage'] : 'planned',
  };
}

/** A city with the zones under it; a zone whose city is gone still shows, as its own group. */
export interface CityGroup {
  city: ManagedCity;
  zones: ManagedCity[];
}

export function groupCities(cities: readonly ManagedCity[]): CityGroup[] {
  const byName = (a: ManagedCity, b: ManagedCity) => a.name.localeCompare(b.name, 'es');
  const roots = cities.filter((city) => city.type === 'city');
  const known = new Set(roots.map((city) => city.id));
  const zonesOf = (id: string) => cities.filter((city) => city.parentCityId === id).sort(byName);
  const orphans = cities.filter(
    (city) => city.type === 'zone' && (city.parentCityId === null || !known.has(city.parentCityId)),
  );
  return [
    ...roots.sort(byName).map((city) => ({ city, zones: zonesOf(city.id) })),
    ...orphans.sort(byName).map((city) => ({ city, zones: [] })),
  ];
}
