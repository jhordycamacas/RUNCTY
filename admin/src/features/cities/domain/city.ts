import { z } from 'zod';

/** RF-04: `cities/{id}` holds cities and their zones. */
export type CityType = 'city' | 'zone';
export type CityCoverage = 'active' | 'planned' | 'suspended';

export interface Ciudad {
  id: string;
  name: string;
  province: string;
  country: 'EC';
  type: CityType;
  /** Zones only. */
  parentCityId?: string;
  location: { lat: number; lng: number };
  coverage: CityCoverage;
}

/** Firestore fields written by the panel (timestamps are added by the repository). */
export type CityData = Omit<Ciudad, 'id'>;

export const COVERAGES: CityCoverage[] = ['active', 'planned', 'suspended'];

const COVERAGE_LABELS: Record<CityCoverage, string> = {
  active: 'Activa',
  planned: 'Planificada',
  suspended: 'Suspendida',
};

export const coverageLabel = (coverage: CityCoverage): string => COVERAGE_LABELS[coverage];

export interface CityFormValues {
  id: string;
  name: string;
  province: string;
  type: CityType;
  parentCityId: string;
  lat: string;
  lng: string;
  coverage: CityCoverage;
}

export const emptyCityForm = (): CityFormValues => ({
  id: '',
  name: '',
  province: '',
  type: 'city',
  parentCityId: '',
  lat: '',
  lng: '',
  coverage: 'planned',
});

export function cityToForm(city: Ciudad): CityFormValues {
  return {
    id: city.id,
    name: city.name,
    province: city.province,
    type: city.type,
    parentCityId: city.parentCityId ?? '',
    lat: String(city.location.lat),
    lng: String(city.location.lng),
    coverage: city.coverage,
  };
}

/** Same rule as CITY_ID_PATTERN in functions/src/cities/deleteCity.ts. */
const CITY_ID = /^[a-z0-9][a-z0-9-]{1,63}$/;

const coordinate = (min: number, max: number) =>
  z
    .string()
    .trim()
    .min(1, 'Obligatorio.')
    .transform((v) => Number(v.replace(',', '.')))
    .pipe(
      z
        .number('Ingresa un número.')
        .refine(Number.isFinite, 'Ingresa un número.')
        .min(min, `Debe estar entre ${min} y ${max}.`)
        .max(max, `Debe estar entre ${min} y ${max}.`),
    );

const cityFormSchema = z
  .object({
    id: z.string().regex(CITY_ID, 'Usa de 2 a 64 minúsculas, números o guiones.'),
    name: z.string().trim().min(1, 'El nombre es obligatorio.').max(80, 'Máximo 80 caracteres.'),
    province: z.string().trim().min(1, 'La provincia es obligatoria.').max(80, 'Máximo 80 caracteres.'),
    type: z.enum(['city', 'zone']),
    parentCityId: z.string().trim(),
    lat: coordinate(-90, 90),
    lng: coordinate(-180, 180),
    coverage: z.enum(['active', 'planned', 'suspended']),
  })
  .superRefine((v, ctx) => {
    if (v.type === 'zone' && v.parentCityId === '') {
      ctx.addIssue({ code: 'custom', path: ['parentCityId'], message: 'Elige la ciudad a la que pertenece la zona.' });
    }
    if (v.type === 'zone' && v.parentCityId === v.id) {
      ctx.addIssue({ code: 'custom', path: ['parentCityId'], message: 'Una zona no puede pertenecer a sí misma.' });
    }
  });

export type CityFormErrors = Partial<Record<keyof CityFormValues, string>>;

export function parseCityForm(
  values: CityFormValues,
): { ok: true; id: string; value: CityData } | { ok: false; errors: CityFormErrors } {
  const result = cityFormSchema.safeParse(values);
  if (!result.success) {
    const errors: CityFormErrors = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0] as keyof CityFormValues;
      errors[key] ??= issue.message;
    }
    return { ok: false, errors };
  }
  const v = result.data;
  return {
    ok: true,
    id: v.id,
    value: {
      name: v.name,
      province: v.province,
      country: 'EC',
      type: v.type,
      ...(v.type === 'zone' ? { parentCityId: v.parentCityId } : {}),
      location: { lat: v.lat, lng: v.lng },
      coverage: v.coverage,
    },
  };
}

const slug = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/** Id suggestion: "Loja" → "loja"; zone "San Cayetano" of loja → "loja-san-cayetano". */
export function suggestCityId(name: string, type: CityType, parentCityId: string): string {
  const base = slug(name);
  return (type === 'zone' && parentCityId && base ? `${parentCityId}-${base}` : base).slice(0, 64);
}

/** Zones hang from cities only (one level), never from themselves. */
export const canBeParent = (candidate: Ciudad, zoneId: string): boolean =>
  candidate.type === 'city' && candidate.id !== zoneId;
