import { toRoutePlaces } from './route-places';

describe('toRoutePlaces', () => {
  it('keeps cities and zones, marks the zones and sorts by name in Spanish', () => {
    expect(
      toRoutePlaces([
        { id: 'quito', name: 'Quito', type: 'city' },
        { id: 'loja-sur', name: 'Sur', type: 'Barrio', parentCityId: 'loja' },
        { id: 'loja', name: 'Loja' },
        { id: 'azogues', name: 'Ázogues', type: 'city' },
      ]),
    ).toEqual([
      { id: 'azogues', name: 'Ázogues' },
      { id: 'loja', name: 'Loja' },
      { id: 'quito', name: 'Quito' },
      { id: 'loja-sur', name: 'Sur (zona)' },
    ]);
  });

  it('falls back to the id when a record has no name', () => {
    expect(toRoutePlaces([{ id: 'loja', name: '' }])).toEqual([{ id: 'loja', name: 'loja' }]);
  });
});
