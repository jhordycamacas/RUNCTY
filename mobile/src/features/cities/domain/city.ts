export type CityCoverage = 'active' | 'inactive';

export interface City {
  id: string;
  name: string;
  province?: string;
}

export interface CityRepository {
  /** Cities with `coverage == 'active'`, sorted by name. */
  listActive(): Promise<City[]>;
}
