import { DIFFICULTIES, Difficulty, Route, SURFACES, Surface } from '../../../routes/domain/route';
import { parseDecimal } from './form-parsing';
import { RouteInput } from './managed-route';

const MAX_NAME = 80;
const MAX_DESCRIPTION = 500;
const MAX_POINT_LABEL = 80;
const MAX_DISTANCE_KM = 500;
const MAX_ELEVATION_M = 10000;

/** The route form works with text; `active` is a toggle. */
export interface RouteForm {
  name: string;
  cityId: string;
  description: string;
  startLabel: string;
  startLat: string;
  startLng: string;
  endLabel: string;
  endLat: string;
  endLng: string;
  distanceKm: string;
  elevationGainM: string;
  surface: string;
  difficulty: string;
  active: boolean;
}

export type RouteFormField = keyof RouteForm;
export type RouteFormErrors = Partial<Record<RouteFormField, string>>;

export const EMPTY_ROUTE_FORM: RouteForm = {
  name: '',
  cityId: '',
  description: '',
  startLabel: '',
  startLat: '',
  startLng: '',
  endLabel: '',
  endLat: '',
  endLng: '',
  distanceKm: '',
  elevationGainM: '0',
  surface: '',
  difficulty: '',
  active: true,
};

export type RouteFormResult =
  { input: RouteInput; errors?: undefined } | { input?: undefined; errors: RouteFormErrors };

const isSurface = (value: string): value is Surface =>
  (SURFACES as readonly string[]).includes(value);
const isDifficulty = (value: string): value is Difficulty =>
  (DIFFICULTIES as readonly string[]).includes(value);

function requiredText(value: string, max: number, missing: string, tooLong: string) {
  const text = value.trim();
  if (!text) return { text, error: missing };
  return { text, error: text.length > max ? tooLong : undefined };
}

function coordinate(value: string, limit: number, missing: string, outOfRange: string) {
  const number = parseDecimal(value);
  if (number === null) return { number, error: missing };
  return { number, error: Math.abs(number) > limit ? outOfRange : undefined };
}

const latitude = (value: string) =>
  coordinate(
    value,
    90,
    'Ingresa la latitud, por ejemplo -3.99313.',
    'La latitud debe estar entre -90 y 90.',
  );
const longitude = (value: string) =>
  coordinate(
    value,
    180,
    'Ingresa la longitud, por ejemplo -79.20422.',
    'La longitud debe estar entre -180 y 180.',
  );
const pointLabel = (value: string) =>
  requiredText(
    value,
    MAX_POINT_LABEL,
    'El nombre del punto es obligatorio.',
    `El nombre del punto admite máximo ${MAX_POINT_LABEL} caracteres.`,
  );

/** Validates the form with the limits of the API and converts it into the body it expects. */
export function parseRouteForm(form: RouteForm): RouteFormResult {
  const name = requiredText(
    form.name,
    MAX_NAME,
    'El nombre es obligatorio.',
    `El nombre admite máximo ${MAX_NAME} caracteres.`,
  );
  const description = form.description.trim();
  const startLabel = pointLabel(form.startLabel);
  const startLat = latitude(form.startLat);
  const startLng = longitude(form.startLng);
  const endLabel = pointLabel(form.endLabel);
  const endLat = latitude(form.endLat);
  const endLng = longitude(form.endLng);
  const distanceKm = parseDecimal(form.distanceKm);
  const elevationGainM = parseDecimal(form.elevationGainM);

  const candidates: RouteFormErrors = {
    name: name.error,
    cityId: form.cityId ? undefined : 'Elige la ciudad o zona de la ruta.',
    description:
      description.length > MAX_DESCRIPTION
        ? `La descripción admite máximo ${MAX_DESCRIPTION} caracteres.`
        : undefined,
    startLabel: startLabel.error,
    startLat: startLat.error,
    startLng: startLng.error,
    endLabel: endLabel.error,
    endLat: endLat.error,
    endLng: endLng.error,
    distanceKm:
      distanceKm === null
        ? 'Ingresa la distancia en kilómetros, por ejemplo 5,2.'
        : distanceKm <= 0 || distanceKm > MAX_DISTANCE_KM
          ? `La distancia debe ser mayor que 0 y máximo ${MAX_DISTANCE_KM} km.`
          : undefined,
    elevationGainM:
      elevationGainM === null
        ? 'Ingresa el desnivel en metros; usa 0 si es plano.'
        : elevationGainM < 0 || elevationGainM > MAX_ELEVATION_M
          ? `El desnivel debe estar entre 0 y ${MAX_ELEVATION_M} m.`
          : undefined,
    surface: isSurface(form.surface) ? undefined : 'Elige la superficie.',
    difficulty: isDifficulty(form.difficulty) ? undefined : 'Elige la dificultad.',
  };
  const errors = Object.fromEntries(
    Object.entries(candidates).filter(([, message]) => message !== undefined),
  ) as RouteFormErrors;

  if (
    Object.keys(errors).length > 0 ||
    startLat.number === null ||
    startLng.number === null ||
    endLat.number === null ||
    endLng.number === null ||
    distanceKm === null ||
    elevationGainM === null ||
    !isSurface(form.surface) ||
    !isDifficulty(form.difficulty)
  ) {
    return { errors };
  }
  return {
    input: {
      name: name.text,
      cityId: form.cityId,
      description,
      start: { label: startLabel.text, lat: startLat.number, lng: startLng.number },
      end: { label: endLabel.text, lat: endLat.number, lng: endLng.number },
      distanceKm,
      elevationGainM,
      surface: form.surface,
      difficulty: form.difficulty,
      active: form.active,
    },
  };
}

/** The current values of a route; what a stored route lacks stays blank so the form asks. */
export function toRouteForm(route: Route): RouteForm {
  return {
    name: route.name,
    cityId: route.cityId,
    description: route.description,
    startLabel: route.start?.label ?? '',
    startLat: route.start ? String(route.start.lat) : '',
    startLng: route.start ? String(route.start.lng) : '',
    endLabel: route.end?.label ?? '',
    endLat: route.end ? String(route.end.lat) : '',
    endLng: route.end ? String(route.end.lng) : '',
    distanceKm: String(route.distanceKm),
    elevationGainM: String(route.elevationGainM),
    surface: route.surface ?? '',
    difficulty: route.difficulty ?? '',
    active: route.active,
  };
}

const searchable = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

/** Routes whose name or description contains the search, ignoring case and accents. */
export function filterRoutesByText(routes: readonly Route[], search: string): Route[] {
  const query = searchable(search.trim());
  if (!query) return [...routes];
  return routes.filter((route) =>
    [route.name, route.description].some((text) => searchable(text).includes(query)),
  );
}
