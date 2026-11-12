import { changePasswordSchema, deleteAccountSchema } from './schemas';

describe('changePasswordSchema', () => {
  const valid = { currentPassword: 'Old12345', newPassword: 'New12345', confirmNewPassword: 'New12345' };

  it('accepts a valid change', () => {
    expect(changePasswordSchema.safeParse(valid).success).toBe(true);
  });

  it('requires the current password', () => {
    const result = changePasswordSchema.safeParse({ ...valid, currentPassword: '' });
    expect(result.error?.issues[0]?.message).toBe('Ingresa tu contraseña actual.');
  });

  it('applies the password policy to the new password', () => {
    const result = changePasswordSchema.safeParse({ ...valid, newPassword: 'short', confirmNewPassword: 'short' });
    expect(result.error?.issues[0]?.message).toBe('La contraseña debe tener al menos 8 caracteres.');
  });

  it('requires the confirmation to match', () => {
    const result = changePasswordSchema.safeParse({ ...valid, confirmNewPassword: 'New12346' });
    expect(result.error?.issues[0]).toMatchObject({
      path: ['confirmNewPassword'],
      message: 'Las contraseñas no coinciden.',
    });
  });

  it('requires a password different from the current one', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'Same1234',
      newPassword: 'Same1234',
      confirmNewPassword: 'Same1234',
    });
    expect(result.error?.issues[0]).toMatchObject({
      path: ['newPassword'],
      message: 'La nueva contraseña debe ser distinta de la actual.',
    });
  });
});

describe('deleteAccountSchema', () => {
  it('requires the password and an explicit confirmation', () => {
    expect(deleteAccountSchema.safeParse({ password: 'x', confirmed: true }).success).toBe(true);
    expect(deleteAccountSchema.safeParse({ password: '', confirmed: true }).error?.issues[0]?.message).toBe(
      'Ingresa tu contraseña para confirmar.',
    );
    expect(deleteAccountSchema.safeParse({ password: 'x', confirmed: false }).error?.issues[0]?.message).toBe(
      'Confirma que entiendes que esta acción no se puede deshacer.',
    );
  });
});
