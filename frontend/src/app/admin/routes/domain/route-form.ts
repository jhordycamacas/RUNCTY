import { DEFAULT_SETTINGS, SystemSettings } from '../../../core/settings/system-settings';
import { Route } from '../../../routes/domain/route';
import { parseDecimal } from './form-parsing';
import { RouteInput } from './managed-route';

const MAX_POINT_LABEL = 80;
const MAX_CATEGORY = 40;

/** The parameters the route form validates against (Configuración). */
export type RouteLimits = Pick<
  SystemSettings,
  'routeNameMaxLength' | 'routeDescriptionMaxLength' | 'routeMaxDistanceKm' | 'routeMaxElevationM'
>;

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

/** The points are marked on the map, never typed: a missing one points the admin back to it. */
const MISSING_START = 'Marca el inicio en el mapa.';
const MISSING_END = 'Marca el fin en el mapa.';

const latitude = (value: string, missing: string) =>
  coordinate(value, 90, missing, 'La latitud debe estar entre -90 y 90.');
const longitude = (value: string, missing: string) =>
  coordinate(value, 180, missing, 'La longitud debe estar entre -180 y 180.');
const pointLabel = (value: string) =>
  requiredText(
    value,
    MAX_POINT_LABEL,
    'El nombre del punto es obligatorio.',
    `El nombre del punto admite máximo ${MAX_POINT_LABEL} caracteres.`,
  );

/**
 * Validates the form with the limits of the API (the system settings, the defaults when they could
 * not be read) and converts it into the body it expects.
 */
export function parseRouteForm(
  form: RouteForm,
  limits: RouteLimits = DEFAULT_SETTINGS,
): RouteFormResult {
  const {
    routeNameMaxLength: maxName,
    routeDescriptionMaxLength: maxDescription,
    routeMaxDistanceKm: maxDistanceKm,
    routeMaxElevationM: maxElevationM,
  } = limits;
  const name = requiredText(
    form.name,
    maxName,
    'El nombre es obligatorio.',
    `El nombre admite máximo ${maxName} caracteres.`,
  );
  const description = form.description.trim();
  const startLabel = pointLabel(form.startLabel);
  const startLat = latitude(form.startLat, MISSING_START);
  const startLng = longitude(form.startLng, MISSING_START);
  const endLabel = pointLabel(form.endLabel);
  const endLat = latitude(form.endLat, MISSING_END);
  const endLng = longitude(form.endLng, MISSING_END);
  const distanceKm = parseDecimal(form.distanceKm);
  const elevationGainM = parseDecimal(form.elevationGainM);
  const surface = requiredText(
    form.surface,
    MAX_CATEGORY,
    'Escribe la superficie, por ejemplo Asfalto.',
    `La superficie admite máximo ${MAX_CATEGORY} caracteres.`,
  );
  const difficulty = requiredText(
    form.difficulty,
    MAX_CATEGORY,
    'Escribe la dificultad, por ejemplo Media.',
    `La dificultad admite máximo ${MAX_CATEGORY} caracteres.`,
  );

  const candidates: RouteFormErrors = {
    name: name.error,
    cityId: form.cityId ? undefined : 'Elige la ciudad o zona de la ruta.',
    description:
      description.length > maxDescription
        ? `La descripción admite máximo ${maxDescription} caracteres.`
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
        : distanceKm <= 0 || distanceKm > maxDistanceKm
          ? `La distancia debe ser mayor que 0 y máximo ${maxDistanceKm} km.`
          : undefined,
    elevationGainM:
      elevationGainM === null
        ? 'Ingresa el desnivel en metros; usa 0 si es plano.'
        : elevationGainM < 0 || elevationGainM > maxElevationM
          ? `El desnivel debe estar entre 0 y ${maxElevationM} m.`
          : undefined,
    surface: surface.error,
    difficulty: difficulty.error,
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
    elevationGainM === null
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
      surface: surface.text,
      difficulty: difficulty.text,
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
