import { parseDecimal } from '../../routes/domain/form-parsing';
import { CityCreateInput, ManagedCity } from './managed-city';

const MAX_TEXT = 80;
const MAX_TYPE = 40;
const MAX_COVERAGE = 60;
const CITY_ID = /^[a-z0-9][a-z0-9-]{1,63}$/;

/** The form works with text. `parentCityId` is empty for a top-level city. */
export interface CityForm {
  type: string;
  id: string;
  name: string;
  province: string;
  parentCityId: string;
  lat: string;
  lng: string;
  coverage: string;
}

export type CityFormField = keyof CityForm;
type CityFormErrors = Partial<Record<CityFormField, string>>;

export const EMPTY_CITY_FORM: CityForm = {
  type: '',
  id: '',
  name: '',
  province: '',
  parentCityId: '',
  lat: '',
  lng: '',
  coverage: '',
};

export type CityFormResult =
  | { input: CityCreateInput; errors?: undefined }
  | { input?: undefined; errors: CityFormErrors };

function requiredText(value: string, missing: string, tooLong: string, max = MAX_TEXT) {
  const text = value.trim();
  if (!text) return { text, error: missing };
  return { text, error: text.length > max ? tooLong : undefined };
}

function coordinate(value: string, limit: number, missing: string, outOfRange: string) {
  const number = parseDecimal(value);
  if (number === null) return { number, error: missing };
  return { number, error: Math.abs(number) > limit ? outOfRange : undefined };
}

/**
 * Validates the form with the limits of the API. The id of a stored city never changes, so it is
 * only checked when the city is new.
 */
export function parseCityForm(form: CityForm, editing: boolean): CityFormResult {
  const name = requiredText(
    form.name,
    'El nombre es obligatorio.',
    `El nombre admite máximo ${MAX_TEXT} caracteres.`,
  );
  const province = requiredText(
    form.province,
    'La provincia es obligatoria.',
    `La provincia admite máximo ${MAX_TEXT} caracteres.`,
  );
  const type = requiredText(
    form.type,
    'El tipo es obligatorio.',
    `El tipo admite máximo ${MAX_TYPE} caracteres.`,
    MAX_TYPE,
  );
  const coverage = requiredText(
    form.coverage,
    'La cobertura es obligatoria.',
    `La cobertura admite máximo ${MAX_COVERAGE} caracteres.`,
    MAX_COVERAGE,
  );
  const lat = coordinate(
    form.lat,
    90,
    'Ingresa la latitud, por ejemplo -3.99313.',
    'La latitud debe estar entre -90 y 90.',
  );
  const lng = coordinate(
    form.lng,
    180,
    'Ingresa la longitud, por ejemplo -79.20422.',
    'La longitud debe estar entre -180 y 180.',
  );

  const candidates: CityFormErrors = {
    type: type.error,
    id:
      editing || CITY_ID.test(form.id)
        ? undefined
        : 'Usa de 2 a 64 caracteres: minúsculas, números y guion, sin empezar por guion.',
    name: name.error,
    province: province.error,
    lat: lat.error,
    lng: lng.error,
    coverage: coverage.error,
  };
  const errors = Object.fromEntries(
    Object.entries(candidates).filter(([, message]) => message !== undefined),
  ) as CityFormErrors;

  if (Object.keys(errors).length > 0 || lat.number === null || lng.number === null) {
    return { errors };
  }
  return {
    input: {
      id: form.id,
      type: type.text,
      name: name.text,
      province: province.text,
      location: { lat: lat.number, lng: lng.number },
      coverage: coverage.text,
      parentCityId: form.parentCityId || null,
    },
  };
}

export function toCityForm(city: ManagedCity): CityForm {
  return {
    type: city.type,
    id: city.id,
    name: city.name,
    province: city.province,
    parentCityId: city.parentCityId ?? '',
    lat: String(city.lat),
    lng: String(city.lng),
    coverage: city.coverage,
  };
}
