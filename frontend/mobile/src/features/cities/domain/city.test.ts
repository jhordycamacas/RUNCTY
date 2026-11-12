import { toPickerCities } from './city';

describe('toPickerCities', () => {
  it('keeps cities, drops zones and sorts by name', () => {
    const cities = toPickerCities([
      { id: 'quito', data: { name: 'Quito', province: 'Pichincha', type: 'city' } },
      { id: 'loja-centro', data: { name: 'Centro', province: 'Loja', type: 'zone', parentCityId: 'loja' } },
      { id: 'cuenca', data: { name: 'Cuenca', province: 'Azuay', type: 'city' } },
    ]);
    expect(cities).toEqual([
      { id: 'cuenca', name: 'Cuenca', province: 'Azuay' },
      { id: 'quito', name: 'Quito', province: 'Pichincha' },
    ]);
  });

  it('treats legacy docs without type as cities and falls back to the id as name', () => {
    expect(toPickerCities([{ id: 'loja', data: {} }])).toEqual([{ id: 'loja', name: 'loja', province: undefined }]);
  });
});
