import { ApiError } from './api-error';
import { mapAuthError } from './auth-errors';
import { UNEXPECTED_ERROR_MESSAGE } from './error-messages';
import { userMessage } from './user-message';

describe('mapAuthError', () => {
  it.each(['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found'])(
    'gives the same neutral text for %s',
    (code) => {
      expect(mapAuthError({ code })).toBe('Correo o contraseña incorrectos.');
    },
  );

  it('translates the other sign-in failures', () => {
    expect(mapAuthError({ code: 'auth/invalid-email' })).toBe('Ingresa un correo válido.');
    expect(mapAuthError({ code: 'auth/too-many-requests' })).toContain('Demasiados intentos');
    expect(mapAuthError({ code: 'auth/network-request-failed' })).toContain('conexión');
  });

  it('translates the sign-up and session failures', () => {
    expect(mapAuthError({ code: 'auth/email-already-in-use' })).toBe(
      'Ya existe una cuenta con este correo.',
    );
    expect(mapAuthError({ code: 'auth/weak-password' })).toContain('demasiado débil');
    expect(mapAuthError({ code: 'auth/requires-recent-login' })).toContain('cierra sesión');
  });

  it('speaks about the current password when re-authenticating', () => {
    const wrong = 'La contraseña actual no es correcta.';
    expect(mapAuthError({ code: 'auth/invalid-credential' }, 'reauthenticate')).toBe(wrong);
    expect(mapAuthError({ code: 'auth/wrong-password' }, 'reauthenticate')).toBe(wrong);
    expect(mapAuthError({ code: 'auth/too-many-requests' }, 'reauthenticate')).toContain(
      'Demasiados intentos',
    );
  });

  it('falls back to the generic text for unknown codes and non-error values', () => {
    expect(mapAuthError({ code: 'auth/other' })).toBe(UNEXPECTED_ERROR_MESSAGE);
    expect(mapAuthError({ code: 5 })).toBe(UNEXPECTED_ERROR_MESSAGE);
    expect(mapAuthError(new Error('x'))).toBe(UNEXPECTED_ERROR_MESSAGE);
    expect(mapAuthError(undefined)).toBe(UNEXPECTED_ERROR_MESSAGE);
  });
});

describe('userMessage', () => {
  it('prefers the translated API message', () => {
    expect(userMessage(new ApiError(403, 'permission-denied', 'Sin permiso'))).toBe('Sin permiso');
  });

  it('maps Firebase errors otherwise', () => {
    expect(userMessage({ code: 'auth/wrong-password' })).toBe('Correo o contraseña incorrectos.');
  });
});
