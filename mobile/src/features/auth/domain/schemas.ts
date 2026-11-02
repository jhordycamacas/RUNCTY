import { z } from 'zod';

import { passwordSchema } from './passwordPolicy';
import { emailSchema, makePersonalDataShape } from './personalData';

export function makeRegisterSchema(today?: () => Date) {
  return z
    .object({
      ...makePersonalDataShape(today),
      email: emailSchema,
      password: passwordSchema,
      confirmPassword: z.string(),
      acceptsLopdp: z.boolean().refine((v) => v, 'Debes aceptar el tratamiento de tus datos personales.'),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: 'Las contraseñas no coinciden.',
      path: ['confirmPassword'],
    });
}

export const registerSchema = makeRegisterSchema();
export type RegisterFormValues = z.input<typeof registerSchema>;
export type RegisterInput = z.output<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Ingresa tu contraseña.'),
});
export type LoginFormValues = z.input<typeof loginSchema>;
export type LoginInput = z.output<typeof loginSchema>;

export const forgotPasswordSchema = z.object({ email: emailSchema });
export type ForgotPasswordFormValues = z.input<typeof forgotPasswordSchema>;
export type ForgotPasswordInput = z.output<typeof forgotPasswordSchema>;
