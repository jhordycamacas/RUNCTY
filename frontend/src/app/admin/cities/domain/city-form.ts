import { parseDecimal } from '../../routes/domain/form-parsing';
import {
  CITY_TYPES,
  COVERAGES,
  CityCreateInput,
  CityType,
  Coverage,
  ManagedCity,
} from './managed-city';

const MAX_TEXT = 80;
const CITY_ID = /^[a-z0-9][a-z0-9-]{1,63}$/;

/** The form works with text. `type` and `coverage` are empty until the admin chooses. */
export interface CityForm {
  type: CityType | '';
  id: string;
  name: string;
  province: string;
  parentCityId: string;
  lat: string;
  lng: string;
  coverage: Coverage | '';
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

const isType = (value: string): value is CityType => (CITY_TYPES as readonly string[]).includes(value);
const isCoverage = (value: string): value is Coverage =>
  (COVERAGES as readonly string[]).includes(value);

function requiredText(value: string, missing: string, tooLong: string) {
  const text = value.trim();
  if (!text) return { text, error: missing };
  return { text, error: text.length > MAX_TEXT ? tooLong : undefined };
}

function coordinate(value: string, limit: number, missing: string, outOfRange: string) {
  const number = parseDecimal(value);
  if (number === null) return { number, error: missing };
  return { number, error: Math.abs(number) > limit ? outOfRange : undefined };
}

/**
 * Validates the form with the limits of the API. The id and the type of a stored city never
 * change, so they are only checked when it is new.
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
    type: editing || isType(form.type) ? undefined : 'Elige si es una ciudad o una zona.',
    id:
      editing || CITY_ID.test(form.id)
        ? undefined
        : 'Usa de 2 a 64 caracteres: minúsculas, números y guion, sin empezar por guion.',
    name: name.error,
    province: province.error,
    parentCityId:
      form.type === 'zone' && !form.parentCityId
        ? 'Elige la ciudad a la que pertenece la zona.'
        : undefined,
    lat: lat.error,
    lng: lng.error,
    coverage: isCoverage(form.coverage) ? undefined : 'Elige la cobertura.',
  };
  const errors = Object.fromEntries(
    Object.entries(candidates).filter(([, message]) => message !== undefined),
  ) as CityFormErrors;

  if (
    Object.keys(errors).length > 0 ||
    lat.number === null ||
    lng.number === null ||
    !isCoverage(form.coverage)
  ) {
    return { errors };
  }
  return {
    input: {
      id: form.id,
      type: isType(form.type) ? form.type : 'city',
      name: name.text,
      province: province.text,
      location: { lat: lat.number, lng: lng.number },
      coverage: form.coverage,
      ...(form.type === 'zone' ? { parentCityId: form.parentCityId } : {}),
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
