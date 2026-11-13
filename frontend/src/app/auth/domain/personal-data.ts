import { validateBirthDate } from './birth-date';

const NAME_MAX_LENGTH = 60;

/** Personal data shared by sign-up (RF-01-1) and profile editing (RF-01-3). */
export interface PersonalData {
  firstName: string;
  lastName: string;
  birthDate: string;
  cityId: string;
  /** Optional Ecuadorian ID (cédula); an empty string means "not provided". */
  idNumber: string;
}

export type FieldErrors<K extends string> = Partial<Record<K, string>>;

function validateName(raw: string, requiredMessage: string): string | null {
  const value = raw.trim();
  if (value === '') return requiredMessage;
  return value.length > NAME_MAX_LENGTH ? `Máximo ${NAME_MAX_LENGTH} caracteres.` : null;
}

export const validateFirstName = (raw: string) => validateName(raw, 'Ingresa tus nombres.');
export const validateLastName = (raw: string) => validateName(raw, 'Ingresa tus apellidos.');
export const validateCityId = (raw: string) => (raw === '' ? 'Selecciona tu ciudad.' : null);

/** Only the shape is checked (10 digits); the field is optional. */
export function validateIdNumber(raw: string): string | null {
  const value = raw.trim();
  return value === '' || /^\d{10}$/.test(value) ? null : 'La cédula debe tener 10 dígitos.';
}

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function validateEmail(raw: string): string | null {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(raw))
    ? null
    : 'Ingresa un correo válido.';
}

export function validatePersonalData(
  data: PersonalData,
  today: Date = new Date(),
): FieldErrors<keyof PersonalData> {
  const errors: FieldErrors<keyof PersonalData> = {
    firstName: validateFirstName(data.firstName) ?? undefined,
    lastName: validateLastName(data.lastName) ?? undefined,
    birthDate: validateBirthDate(data.birthDate, today) ?? undefined,
    cityId: validateCityId(data.cityId) ?? undefined,
    idNumber: validateIdNumber(data.idNumber) ?? undefined,
  };
  return Object.fromEntries(Object.entries(errors).filter(([, message]) => message !== undefined));
}

/** Form values as the API expects them: everything trimmed (an empty cédula removes it). */
export function trimPersonalData(data: PersonalData): PersonalData {
  return {
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    birthDate: data.birthDate.trim(),
    cityId: data.cityId,
    idNumber: data.idNumber.trim(),
  };
}
