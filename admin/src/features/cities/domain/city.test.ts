import { describe, expect, it } from 'vitest';

import { canBeParent, coverageLabel, emptyCityForm, parseCityForm, suggestCityId, type Ciudad, type CityFormValues } from './city';

const cityForm: CityFormValues = {
  ...emptyCityForm(),
  id: 'quito',
  name: 'Quito',
  province: 'Pichincha',
  lat: '-0.1807',
  lng: '-78.4678',
  coverage: 'planned',
};

describe('parseCityForm', () => {
  it('converts a valid city form into the Firestore shape', () => {
    expect(parseCityForm(cityForm)).toEqual({
      ok: true,
      id: 'quito',
      value: {
        name: 'Quito',
        province: 'Pichincha',
        country: 'EC',
        type: 'city',
        location: { lat: -0.1807, lng: -78.4678 },
        coverage: 'planned',
      },
    });
  });

  it('accepts a decimal comma in coordinates', () => {
    const result = parseCityForm({ ...cityForm, lat: '-3,99', lng: '-79,2' });
    expect(result.ok && result.value.location).toEqual({ lat: -3.99, lng: -79.2 });
  });

  it('rejects coordinates out of range or not numeric', () => {
    const result = parseCityForm({ ...cityForm, lat: '91', lng: 'abc' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.lat).toMatch(/-90 y 90/);
      expect(result.errors.lng).toBeDefined();
    }
  });

  it('requires a parent city for zones', () => {
    const result = parseCityForm({ ...cityForm, id: 'loja-centro', type: 'zone', parentCityId: '' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.parentCityId).toMatch(/ciudad/);

    const zone = parseCityForm({ ...cityForm, id: 'loja-centro', type: 'zone', parentCityId: 'loja' });
    expect(zone.ok && zone.value).toMatchObject({ type: 'zone', parentCityId: 'loja' });
  });

  it('requires name, province and a slug id', () => {
    const result = parseCityForm({ ...cityForm, id: 'Quito Norte', name: ' ', province: '' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.id).toBeDefined();
      expect(result.errors.name).toBeDefined();
      expect(result.errors.province).toBeDefined();
    }
  });
});

describe('suggestCityId', () => {
  it('slugifies the name and prefixes zones with their city', () => {
    expect(suggestCityId('San Cayetano Alto', 'zone', 'loja')).toBe('loja-san-cayetano-alto');
    expect(suggestCityId('Santo Domingo de los Tsáchilas', 'city', '')).toBe('santo-domingo-de-los-tsachilas');
  });
});

describe('helpers', () => {
  const loja: Ciudad = {
    id: 'loja',
    name: 'Loja',
    province: 'Loja',
    country: 'EC',
    type: 'city',
    location: { lat: -3.99, lng: -79.2 },
    coverage: 'active',
  };

  it('only lets cities be parents, never the zone itself', () => {
    expect(canBeParent(loja, 'loja-centro')).toBe(true);
    expect(canBeParent(loja, 'loja')).toBe(false);
    expect(canBeParent({ ...loja, id: 'z', type: 'zone', parentCityId: 'loja' }, 'x')).toBe(false);
  });

  it('labels coverage in Spanish', () => {
    expect(coverageLabel('active')).toBe('Activa');
    expect(coverageLabel('planned')).toBe('Planificada');
    expect(coverageLabel('suspended')).toBe('Suspendida');
  });
});
