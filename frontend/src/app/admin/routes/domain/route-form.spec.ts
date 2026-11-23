import { DEFAULT_SETTINGS } from '../../../core/settings/system-settings';
import { route } from '../../../routes/domain/testing/fixtures';
import {
  EMPTY_ROUTE_FORM,
  RouteForm,
  filterRoutesByText,
  parseRouteForm,
  toRouteForm,
} from './route-form';

const VALID: RouteForm = {
  name: '  Parque Jipiro ',
  cityId: 'loja',
  description: ' Circuito plano ',
  startLabel: 'Entrada norte',
  startLat: '-3,97',
  startLng: '-79.2',
  endLabel: 'Entrada sur',
  endLat: '-3.98',
  endLng: '-79.21',
  distanceKm: '3,2',
  elevationGainM: '15',
  surface: 'Asfalto',
  difficulty: 'Principiante',
  active: true,
};

describe('parseRouteForm with the limits of the system settings', () => {
  const limits = {
    ...DEFAULT_SETTINGS,
    routeNameMaxLength: 12,
    routeDescriptionMaxLength: 20,
    routeMaxDistanceKm: 10,
    routeMaxElevationM: 100,
  };

  it('rejects what exceeds the configured limits and names them', () => {
    const { errors } = parseRouteForm(
      {
        ...VALID,
        name: 'Nombre demasiado largo',
        description: 'd'.repeat(21),
        distanceKm: '11',
        elevationGainM: '101',
      },
      limits,
    );

    expect(errors).toEqual({
      name: 'El nombre admite máximo 12 caracteres.',
      description: 'La descripción admite máximo 20 caracteres.',
      distanceKm: 'La distancia debe ser mayor que 0 y máximo 10 km.',
      elevationGainM: 'El desnivel debe estar entre 0 y 100 m.',
    });
  });

  it('accepts values at the configured limits, even above the defaults', () => {
    const wide = { ...limits, routeMaxDistanceKm: 900, routeNameMaxLength: 120 };

    expect(parseRouteForm({ ...VALID, distanceKm: '900', name: 'n'.repeat(120) }, wide).errors)
      .toBeUndefined();
  });
});

describe('parseRouteForm', () => {
  it('builds the API input, trimming text and accepting a decimal comma', () => {
    expect(parseRouteForm(VALID).input).toEqual({
      name: 'Parque Jipiro',
      cityId: 'loja',
      description: 'Circuito plano',
      start: { label: 'Entrada norte', lat: -3.97, lng: -79.2 },
      end: { label: 'Entrada sur', lat: -3.98, lng: -79.21 },
      distanceKm: 3.2,
      elevationGainM: 15,
      surface: 'Asfalto',
      difficulty: 'Principiante',
      active: true,
    });
  });

  it('explains every missing field of an empty form', () => {
    expect(parseRouteForm(EMPTY_ROUTE_FORM).errors).toEqual({
      name: 'El nombre es obligatorio.',
      cityId: 'Elige la ciudad o zona de la ruta.',
      startLabel: 'El nombre del punto es obligatorio.',
      startLat: 'Marca el inicio en el mapa.',
      startLng: 'Marca el inicio en el mapa.',
      endLabel: 'El nombre del punto es obligatorio.',
      endLat: 'Marca el fin en el mapa.',
      endLng: 'Marca el fin en el mapa.',
      distanceKm: 'Ingresa la distancia en kilómetros, por ejemplo 5,2.',
      surface: 'Escribe la superficie, por ejemplo Asfalto.',
      difficulty: 'Escribe la dificultad, por ejemplo Media.',
    });
  });

  it('applies the limits of the API', () => {
    const errors = parseRouteForm({
      ...VALID,
      name: 'a'.repeat(81),
      description: 'a'.repeat(501),
      startLabel: 'a'.repeat(81),
      startLat: '90.5',
      endLng: '-181',
      distanceKm: '0',
      elevationGainM: '10001',
      surface: 'a'.repeat(41),
      difficulty: 'a'.repeat(41),
    }).errors;

    expect(errors).toEqual({
      name: 'El nombre admite máximo 80 caracteres.',
      description: 'La descripción admite máximo 500 caracteres.',
      startLabel: 'El nombre del punto admite máximo 80 caracteres.',
      startLat: 'La latitud debe estar entre -90 y 90.',
      endLng: 'La longitud debe estar entre -180 y 180.',
      distanceKm: 'La distancia debe ser mayor que 0 y máximo 500 km.',
      elevationGainM: 'El desnivel debe estar entre 0 y 10000 m.',
      surface: 'La superficie admite máximo 40 caracteres.',
      difficulty: 'La dificultad admite máximo 40 caracteres.',
    });
  });

  it('keeps the typed surface and difficulty, trimmed', () => {
    const { input } = parseRouteForm({ ...VALID, surface: ' Adoquín ', difficulty: 'Media ' });

    expect(input).toMatchObject({ surface: 'Adoquín', difficulty: 'Media' });
  });

  it('rejects text where a number is expected', () => {
    const errors = parseRouteForm({ ...VALID, distanceKm: 'cinco', elevationGainM: '' }).errors;

    expect(errors).toEqual({
      distanceKm: 'Ingresa la distancia en kilómetros, por ejemplo 5,2.',
      elevationGainM: 'Ingresa el desnivel en metros; usa 0 si es plano.',
    });
  });

  it('accepts the upper limits and an inactive route without description', () => {
    const { input } = parseRouteForm({
      ...VALID,
      description: '',
      distanceKm: '500',
      elevationGainM: '10000',
      active: false,
    });

    expect(input).toMatchObject({
      description: '',
      distanceKm: 500,
      elevationGainM: 10000,
      active: false,
    });
  });
});

describe('toRouteForm', () => {
  it('preloads the current values of a route', () => {
    const form = toRouteForm(
      route('jipiro', {
        name: 'Parque Jipiro',
        description: 'Circuito',
        start: { lat: -3.97, lng: -79.2, label: 'Norte' },
        end: { lat: -3.98, lng: -79.21, label: 'Sur' },
        distanceKm: 3.2,
        elevationGainM: 15,
        surface: 'Mixto',
        difficulty: 'Avanzado',
        active: false,
      }),
    );

    expect(form).toEqual({
      name: 'Parque Jipiro',
      cityId: 'loja',
      description: 'Circuito',
      startLabel: 'Norte',
      startLat: '-3.97',
      startLng: '-79.2',
      endLabel: 'Sur',
      endLat: '-3.98',
      endLng: '-79.21',
      distanceKm: '3.2',
      elevationGainM: '15',
      surface: 'Mixto',
      difficulty: 'Avanzado',
      active: false,
    });
    expect(parseRouteForm(form).errors).toBeUndefined();
  });

  it('leaves blank what a stored route lacks, so the form asks for it', () => {
    const form = toRouteForm(
      route('x', { start: null, end: null, surface: null, difficulty: null }),
    );

    expect(form).toMatchObject({
      startLabel: '',
      startLat: '',
      endLng: '',
      surface: '',
      difficulty: '',
    });
  });
});

describe('filterRoutesByText', () => {
  const routes = [
    route('a', { name: 'Parque Jipiro', description: 'Circuito plano' }),
    route('b', { name: 'Río Zamora', description: 'Sendero junto al río' }),
  ];

  it('matches the name or the description, ignoring case and accents', () => {
    expect(filterRoutesByText(routes, 'RIO').map((r) => r.id)).toEqual(['b']);
    expect(filterRoutesByText(routes, 'circuito').map((r) => r.id)).toEqual(['a']);
  });

  it('returns every route for a blank search', () => {
    expect(filterRoutesByText(routes, '  ')).toHaveLength(2);
  });
});
