import { GENERIC_ERROR_MESSAGE, mapAuthError } from './authErrors';

const err = (code: string) => Object.assign(new Error(code), { code });

describe('mapAuthError', () => {
  it.each([
    ['auth/email-already-in-use', 'Ya existe una cuenta con este correo.'],
    ['auth/invalid-credential', 'Correo o contraseña incorrectos.'],
    ['auth/wrong-password', 'Correo o contraseña incorrectos.'],
    ['auth/user-not-found', 'Correo o contraseña incorrectos.'],
    ['auth/too-many-requests', 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.'],
    ['auth/network-request-failed', 'Sin conexión. Revisa tu internet e inténtalo de nuevo.'],
    ['auth/user-disabled', 'Esta cuenta está deshabilitada. Contacta al administrador.'],
    ['auth/weak-password', 'La contraseña es demasiado débil. Usa al menos 8 caracteres con letras y números.'],
  ])('maps %s', (code, message) => {
    expect(mapAuthError(err(code))).toBe(message);
  });

  it('speaks about the current password when re-authenticating', () => {
    expect(mapAuthError(err('auth/invalid-credential'), 'reauthenticate')).toBe(
      'La contraseña actual no es correcta.',
    );
    expect(mapAuthError(err('auth/wrong-password'), 'reauthenticate')).toBe('La contraseña actual no es correcta.');
  });

  it('asks to sign in again when the session is too old', () => {
    expect(mapAuthError(err('auth/requires-recent-login'))).toBe(
      'Por seguridad, cierra sesión, vuelve a ingresar e inténtalo de nuevo.',
    );
  });

  it('falls back to a generic message for unknown errors', () => {
    expect(mapAuthError(err('auth/something-new'))).toBe(GENERIC_ERROR_MESSAGE);
    expect(mapAuthError('boom')).toBe(GENERIC_ERROR_MESSAGE);
    expect(mapAuthError(undefined)).toBe(GENERIC_ERROR_MESSAGE);
  });
});
