import { toPickerCities } from './city';

describe('toPickerCities', () => {
  it('keeps cities, drops zones and sorts by name', () => {
    const cities = toPickerCities([
      { id: 'quito', name: 'Quito', province: 'Pichincha', type: 'city' },
      { id: 'loja-centro', name: 'Centro', province: 'Loja', type: 'Barrio', parentCityId: 'loja' },
      { id: 'cuenca', name: 'Cuenca', province: 'Azuay', type: 'city' },
    ]);

    expect(cities).toEqual([
      { id: 'cuenca', name: 'Cuenca', province: 'Azuay' },
      { id: 'quito', name: 'Quito', province: 'Pichincha' },
    ]);
  });

  it('treats records without type as cities and falls back to the id as name', () => {
    expect(toPickerCities([{ id: 'loja' }])).toEqual([
      { id: 'loja', name: 'loja', province: null },
    ]);
  });

  it('sorts accented names the Spanish way', () => {
    const names = toPickerCities([
      { id: 'b', name: 'Zamora' },
      { id: 'a', name: 'Ámbato' },
    ]).map((city) => city.name);

    expect(names).toEqual(['Ámbato', 'Zamora']);
  });
});
