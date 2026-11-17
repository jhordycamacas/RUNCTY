import { UserFilters } from './managed-user';

/** The search form works with text; empty fields are not sent. */
export interface UserSearchForm {
  firstName: string;
  lastName: string;
  email: string;
  idNumber: string;
  birthDate: string;
  cityId: string;
}

export type UserSearchField = keyof UserSearchForm;
export type UserSearchErrors = Partial<Record<UserSearchField, string>>;

export const EMPTY_USER_SEARCH: UserSearchForm = {
  firstName: '',
  lastName: '',
  email: '',
  idNumber: '',
  birthDate: '',
  cityId: '',
};

export type UserSearchResult =
  | { filters: UserFilters; errors?: undefined }
  | { filters?: undefined; errors: UserSearchErrors };

const ID_NUMBER = /^\d{10}$/;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

function isCalendarDate(value: string): boolean {
  const match = ISO_DATE.exec(value);
  if (!match) return false;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/** Validates the filters with the formats of the API and keeps only the ones with a value. */
export function parseUserSearch(form: UserSearchForm): UserSearchResult {
  const filters = Object.fromEntries(
    Object.entries(form)
      .map(([name, value]) => [name, value.trim()] as const)
      .filter(([, value]) => value !== ''),
  );

  const errors: UserSearchErrors = {};
  if (filters['idNumber'] !== undefined && !ID_NUMBER.test(filters['idNumber'])) {
    errors.idNumber = 'La identificación debe tener 10 dígitos.';
  }
  if (filters['birthDate'] !== undefined && !isCalendarDate(filters['birthDate'])) {
    errors.birthDate = 'Usa el formato AAAA-MM-DD, por ejemplo 1995-04-23.';
  }
  return Object.keys(errors).length > 0 ? { errors } : { filters };
}
