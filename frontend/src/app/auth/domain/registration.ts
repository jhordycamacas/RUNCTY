import { FieldErrors, PersonalData, validateEmail, validatePersonalData } from './personal-data';
import { validatePassword } from './password-policy';

export interface RegisterInput extends PersonalData {
  email: string;
  password: string;
  confirmPassword: string;
  acceptsLopdp: boolean;
}

export type RegisterField = keyof RegisterInput;

export function validateRegistration(
  input: RegisterInput,
  today: Date = new Date(),
): FieldErrors<RegisterField> {
  const errors: FieldErrors<RegisterField> = validatePersonalData(input, today);
  const email = validateEmail(input.email);
  const password = validatePassword(input.password);
  if (email) errors.email = email;
  if (password) errors.password = password;
  if (input.password !== input.confirmPassword)
    errors.confirmPassword = 'Las contraseñas no coinciden.';
  if (!input.acceptsLopdp) {
    errors.acceptsLopdp = 'Debes aceptar el tratamiento de tus datos personales.';
  }
  return errors;
}

/** The sign-in form: the email shape and a non-empty password. */
export function validateLogin(input: {
  email: string;
  password: string;
}): FieldErrors<'email' | 'password'> {
  const errors: FieldErrors<'email' | 'password'> = {};
  const email = validateEmail(input.email);
  if (email) errors.email = email;
  if (input.password === '') errors.password = 'Ingresa tu contraseña.';
  return errors;
}
