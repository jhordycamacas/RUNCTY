import { ManagedCity, groupCities, toManagedCity } from './managed-city';

const city = (id: string, overrides: Partial<ManagedCity> = {}): ManagedCity => ({
  id,
  name: id,
  province: 'Loja',
  type: 'city',
  parentCityId: null,
  lat: 0,
  lng: 0,
  coverage: 'active',
  ...overrides,
});

describe('managed city', () => {
  it('maps a stored city', () => {
    expect(
      toManagedCity({
        id: 'loja-centro',
        name: 'Centro',
        province: 'Loja',
        type: 'zone',
        parentCityId: 'loja',
        location: { lat: -3.99, lng: -79.2 },
        coverage: 'suspended',
      }),
    ).toEqual({
      id: 'loja-centro',
      name: 'Centro',
      province: 'Loja',
      type: 'zone',
      parentCityId: 'loja',
      lat: -3.99,
      lng: -79.2,
      coverage: 'suspended',
    });
  });

  it('reads a record that predates zones as a planned city with no location', () => {
    expect(toManagedCity({ id: 'quito' })).toEqual({
      id: 'quito',
      name: 'quito',
      province: '',
      type: 'city',
      parentCityId: null,
      lat: 0,
      lng: 0,
      coverage: 'planned',
    });
  });

  it('groups the zones under their city, sorted by name', () => {
    const groups = groupCities([
      city('z2', { name: 'Sur', type: 'zone', parentCityId: 'loja' }),
      city('quito', { name: 'Quito' }),
      city('z1', { name: 'Norte', type: 'zone', parentCityId: 'loja' }),
      city('loja', { name: 'Loja' }),
    ]);

    expect(groups.map((g) => g.city.id)).toEqual(['loja', 'quito']);
    expect(groups[0].zones.map((z) => z.id)).toEqual(['z1', 'z2']);
    expect(groups[1].zones).toEqual([]);
  });

  it('keeps a zone whose city is not in the catalogue as its own group', () => {
    const groups = groupCities([city('loja'), city('z', { type: 'zone', parentCityId: 'gone' })]);

    expect(groups.map((g) => g.city.id)).toEqual(['loja', 'z']);
  });
});
