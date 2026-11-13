import { validateChangePassword, validateDeleteAccount } from './profile';

describe('validateChangePassword', () => {
  const valid = {
    currentPassword: 'Old12345',
    newPassword: 'New12345',
    confirmNewPassword: 'New12345',
  };

  it('accepts a valid change', () => {
    expect(validateChangePassword(valid)).toEqual({});
  });

  it('requires the current password', () => {
    expect(validateChangePassword({ ...valid, currentPassword: '' })).toEqual({
      currentPassword: 'Ingresa tu contraseña actual.',
    });
  });

  it('applies the password policy to the new password', () => {
    expect(
      validateChangePassword({ ...valid, newPassword: 'short', confirmNewPassword: 'short' }),
    ).toEqual({
      newPassword: 'La contraseña debe tener al menos 8 caracteres.',
    });
  });

  it('requires the confirmation to match', () => {
    expect(validateChangePassword({ ...valid, confirmNewPassword: 'New12346' })).toEqual({
      confirmNewPassword: 'Las contraseñas no coinciden.',
    });
  });

  it('requires a password different from the current one', () => {
    expect(
      validateChangePassword({
        currentPassword: 'Same1234',
        newPassword: 'Same1234',
        confirmNewPassword: 'Same1234',
      }),
    ).toEqual({ newPassword: 'La nueva contraseña debe ser distinta de la actual.' });
  });
});

describe('validateDeleteAccount', () => {
  it('requires the password and an explicit confirmation', () => {
    expect(validateDeleteAccount({ password: 'x', confirmed: true })).toEqual({});
    expect(validateDeleteAccount({ password: '', confirmed: true })).toEqual({
      password: 'Ingresa tu contraseña para confirmar.',
    });
    expect(validateDeleteAccount({ password: 'x', confirmed: false })).toEqual({
      confirmed: 'Confirma que entiendes que esta acción no se puede deshacer.',
    });
  });
});
