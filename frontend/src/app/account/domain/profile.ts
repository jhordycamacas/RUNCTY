import { PersonalData } from '../../auth/domain/personal-data';
import { validatePassword } from '../../auth/domain/password-policy';

/** The profile of the signed-in account (`GET /users/me`). */
export interface Profile extends Omit<PersonalData, 'idNumber'> {
  uid: string;
  email: string;
  idNumber: string | null;
  role: string | null;
}

export abstract class ProfileRepository {
  abstract get(): Promise<Profile>;
  /** An empty `idNumber` removes it from the profile. */
  abstract update(data: PersonalData): Promise<Profile>;
}

export abstract class AccountRepository {
  /** Server-side deletion of credentials, profile and private data. */
  abstract delete(): Promise<void>;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

/** RF-01-3: password change that requires the current password. */
export function validateChangePassword(
  input: ChangePasswordInput,
): Partial<Record<keyof ChangePasswordInput, string>> {
  const errors: Partial<Record<keyof ChangePasswordInput, string>> = {};
  if (input.currentPassword === '') errors.currentPassword = 'Ingresa tu contraseña actual.';
  const policy = validatePassword(input.newPassword);
  if (policy) errors.newPassword = policy;
  else if (input.newPassword === input.currentPassword) {
    errors.newPassword = 'La nueva contraseña debe ser distinta de la actual.';
  }
  if (input.newPassword !== input.confirmNewPassword) {
    errors.confirmNewPassword = 'Las contraseñas no coinciden.';
  }
  return errors;
}

export interface DeleteAccountInput {
  password: string;
  confirmed: boolean;
}

/** RF-01-4: explicit consent = current password + acknowledgement. */
export function validateDeleteAccount(
  input: DeleteAccountInput,
): Partial<Record<keyof DeleteAccountInput, string>> {
  const errors: Partial<Record<keyof DeleteAccountInput, string>> = {};
  if (input.password === '') errors.password = 'Ingresa tu contraseña para confirmar.';
  if (!input.confirmed) {
    errors.confirmed = 'Confirma que entiendes que esta acción no se puede deshacer.';
  }
  return errors;
}
