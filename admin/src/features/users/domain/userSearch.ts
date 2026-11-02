import { z } from 'zod';

/** Form values of the user search (RF-01-2). Empty strings mean "no filter". */
export interface UserFilterForm {
  firstName: string;
  lastName: string;
  email: string;
  idNumber: string;
  birthDate: string;
  cityId: string;
}

export type UserFilters = Partial<UserFilterForm>;

export const EMPTY_FILTERS: UserFilterForm = {
  firstName: '',
  lastName: '',
  email: '',
  idNumber: '',
  birthDate: '',
  cityId: '',
};

/** Shape returned by the `searchUsers` callable (data minimization). */
export interface UserSummary {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  cityId: string;
  role: string;
}

export interface UserSearchPage {
  users: UserSummary[];
  nextCursor: string | null;
}

const optional = (schema: z.ZodType<string, string>) =>
  z
    .string()
    .trim()
    .transform((v) => (v === '' ? undefined : v))
    .pipe(schema.optional());

const filtersSchema = z.object({
  firstName: optional(z.string().max(60, 'Máximo 60 caracteres.')),
  lastName: optional(z.string().max(60, 'Máximo 60 caracteres.')),
  email: optional(z.email('Ingresa un correo válido.')),
  idNumber: optional(z.string().regex(/^[0-9]{10}$/, 'La identificación tiene 10 dígitos.')),
  birthDate: optional(z.string().regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/, 'Usa el formato AAAA-MM-DD.')),
  cityId: optional(z.string().max(64)),
});

export type FilterErrors = Partial<Record<keyof UserFilterForm, string>>;

export function parseUserFilters(
  form: UserFilterForm,
): { ok: true; filters: UserFilters } | { ok: false; errors: FilterErrors } {
  const result = filtersSchema.safeParse(form);
  if (result.success) {
    const filters = Object.fromEntries(Object.entries(result.data).filter(([, v]) => v !== undefined)) as UserFilters;
    return { ok: true, filters };
  }
  const errors: FilterErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] as keyof UserFilterForm;
    errors[key] ??= issue.message;
  }
  return { ok: false, errors };
}

export function fullName(user: Pick<UserSummary, 'firstName' | 'lastName'>): string {
  return `${user.firstName} ${user.lastName}`.trim() || '—';
}
