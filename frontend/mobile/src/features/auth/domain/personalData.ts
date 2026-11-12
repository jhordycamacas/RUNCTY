import { z } from 'zod';

import { makeBirthDateSchema } from './birthDate';

const NAME_MAX_LENGTH = 60;

const firstNameSchema = z
  .string()
  .trim()
  .min(1, 'Ingresa tus nombres.')
  .max(NAME_MAX_LENGTH, `Máximo ${NAME_MAX_LENGTH} caracteres.`);

const lastNameSchema = z
  .string()
  .trim()
  .min(1, 'Ingresa tus apellidos.')
  .max(NAME_MAX_LENGTH, `Máximo ${NAME_MAX_LENGTH} caracteres.`);

const cityIdSchema = z.string().min(1, 'Selecciona tu ciudad.');

/**
 * Optional Ecuadorian ID (cédula). Only the shape is checked (10 digits);
 * an empty string means "not provided".
 */
export const idNumberSchema = z
  .string()
  .trim()
  .refine((value) => value === '' || /^\d{10}$/.test(value), 'La cédula debe tener 10 dígitos.');

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email('Ingresa un correo válido.'));

/** Personal data shared by sign-up (RF-01-1) and profile editing (RF-01-3). */
export function makePersonalDataShape(today?: () => Date) {
  return {
    firstName: firstNameSchema,
    lastName: lastNameSchema,
    birthDate: makeBirthDateSchema(today),
    cityId: cityIdSchema,
    idNumber: idNumberSchema,
  };
}

export const personalDataSchema = z.object(makePersonalDataShape());

export type PersonalDataInput = z.input<typeof personalDataSchema>;
export type PersonalData = z.output<typeof personalDataSchema>;
