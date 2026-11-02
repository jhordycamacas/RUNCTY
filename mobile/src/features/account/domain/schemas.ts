import { z } from 'zod';

import { passwordSchema } from '@/features/auth/domain';

/** RF-01-3: password change that requires the current password. */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Ingresa tu contraseña actual.'),
    newPassword: passwordSchema,
    confirmNewPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmNewPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmNewPassword'],
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    message: 'La nueva contraseña debe ser distinta de la actual.',
    path: ['newPassword'],
  });

export type ChangePasswordInput = z.output<typeof changePasswordSchema>;
export type ChangePasswordFormValues = z.input<typeof changePasswordSchema>;

/** RF-01-4: explicit consent = current password + acknowledgement. */
export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Ingresa tu contraseña para confirmar.'),
  confirmed: z.boolean().refine((v) => v, 'Confirma que entiendes que esta acción no se puede deshacer.'),
});

export type DeleteAccountInput = z.output<typeof deleteAccountSchema>;
export type DeleteAccountFormValues = z.input<typeof deleteAccountSchema>;
