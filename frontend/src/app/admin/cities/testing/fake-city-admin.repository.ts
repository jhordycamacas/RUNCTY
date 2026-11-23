import { vi } from 'vitest';
import { CityAdminRepository, ManagedCity } from '../domain/managed-city';

/** Every port method as a mock, answering an empty catalogue unless a test says otherwise. */
export function fakeCityAdminRepository() {
  return {
    list: vi.fn<CityAdminRepository['list']>().mockResolvedValue([]),
    create: vi.fn<CityAdminRepository['create']>().mockResolvedValue(undefined),
    update: vi.fn<CityAdminRepository['update']>().mockResolvedValue(undefined),
    delete: vi.fn<CityAdminRepository['delete']>().mockResolvedValue(undefined),
  };
}

export type FakeCityAdminRepository = ReturnType<typeof fakeCityAdminRepository>;

export const city = (id: string, overrides: Partial<ManagedCity> = {}): ManagedCity => ({
  id,
  name: id,
  province: 'Loja',
  type: 'city',
  parentCityId: null,
  lat: -3.99,
  lng: -79.2,
  coverage: 'active',
  ...overrides,
});

export const zone = (id: string, parentCityId: string, overrides: Partial<ManagedCity> = {}) =>
  city(id, { type: 'Zona', parentCityId, ...overrides });

/** Lets pending promises and the renders they trigger settle. */
export async function settle(fixture: { detectChanges(): void }): Promise<void> {
  for (let i = 0; i < 4; i += 1) {
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();
  }
}
