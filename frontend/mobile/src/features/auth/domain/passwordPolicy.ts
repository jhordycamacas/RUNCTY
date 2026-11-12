import { z } from 'zod';

const PASSWORD_MIN_LENGTH = 8;

/** Password policy (RF-01-1): at least 8 characters, one letter and one number. */
export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`)
  .regex(/\p{L}/u, 'La contraseña debe incluir al menos una letra.')
  .regex(/\d/, 'La contraseña debe incluir al menos un número.');

export const PASSWORD_HINT = 'Mínimo 8 caracteres, con al menos una letra y un número.';
