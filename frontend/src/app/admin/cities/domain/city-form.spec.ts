import { CityForm, EMPTY_CITY_FORM, parseCityForm, toCityForm } from './city-form';

const VALID: CityForm = {
  type: 'city',
  id: 'cuenca',
  name: ' Cuenca ',
  province: 'Azuay',
  parentCityId: '',
  lat: '-2,9',
  lng: '-79.0',
  coverage: 'planned',
};

describe('city form', () => {
  it('builds the request of a city: trimmed, numeric location, no parent', () => {
    expect(parseCityForm(VALID, false).input).toEqual({
      id: 'cuenca',
      type: 'city',
      name: 'Cuenca',
      province: 'Azuay',
      location: { lat: -2.9, lng: -79 },
      coverage: 'planned',
    });
  });

  it('builds the request of a zone with its parent city', () => {
    const { input } = parseCityForm(
      { ...VALID, type: 'zone', id: 'cuenca-centro', parentCityId: 'cuenca' },
      false,
    );

    expect(input).toEqual(expect.objectContaining({ type: 'zone', parentCityId: 'cuenca' }));
  });

  it('drops a leftover parent when the type is city', () => {
    expect(parseCityForm({ ...VALID, parentCityId: 'loja' }, false).input).not.toHaveProperty(
      'parentCityId',
    );
  });

  it('explains every invalid field in Spanish and builds nothing', () => {
    const { input, errors } = parseCityForm(EMPTY_CITY_FORM, false);

    expect(input).toBeUndefined();
    expect(errors).toEqual(
      expect.objectContaining({
        type: 'Elige si es una ciudad o una zona.',
        id: expect.stringContaining('minúsculas'),
        name: 'El nombre es obligatorio.',
        province: 'La provincia es obligatoria.',
        lat: expect.stringContaining('latitud'),
        lng: expect.stringContaining('longitud'),
        coverage: 'Elige la cobertura.',
      }),
    );
  });

  it('asks for the parent city of a zone', () => {
    expect(parseCityForm({ ...VALID, type: 'zone', id: 'z1' }, false).errors?.parentCityId).toBe(
      'Elige la ciudad a la que pertenece la zona.',
    );
  });

  it('checks the coordinate ranges', () => {
    const { errors } = parseCityForm({ ...VALID, lat: '91', lng: '-181' }, false);

    expect(errors?.lat).toBe('La latitud debe estar entre -90 y 90.');
    expect(errors?.lng).toBe('La longitud debe estar entre -180 y 180.');
  });

  it.each(['a', 'Cuenca', '-cuenca', 'cu enca', 'x'.repeat(65)])('rejects the id "%s"', (id) => {
    expect(parseCityForm({ ...VALID, id }, false).errors?.id).toBeDefined();
  });

  it.each(['cu', 'loja-centro', '2-de-mayo', 'x'.repeat(64)])('accepts the id "%s"', (id) => {
    expect(parseCityForm({ ...VALID, id }, false).errors?.id).toBeUndefined();
  });

  it('rejects names and provinces over 80 characters', () => {
    const { errors } = parseCityForm(
      { ...VALID, name: 'x'.repeat(81), province: 'y'.repeat(81) },
      false,
    );

    expect(errors?.name).toContain('80');
    expect(errors?.province).toContain('80');
  });

  it('does not validate the identity of a stored city being edited', () => {
    expect(parseCityForm({ ...VALID, id: 'Legacy Id', type: '' as never }, true).errors).toBeUndefined();
  });

  it('fills the form from a stored zone', () => {
    expect(
      toCityForm({
        id: 'z',
        name: 'Centro',
        province: 'Loja',
        type: 'zone',
        parentCityId: 'loja',
        lat: -3.99,
        lng: -79.2,
        coverage: 'active',
      }),
    ).toEqual({
      type: 'zone',
      id: 'z',
      name: 'Centro',
      province: 'Loja',
      parentCityId: 'loja',
      lat: '-3.99',
      lng: '-79.2',
      coverage: 'active',
    });
  });
});
