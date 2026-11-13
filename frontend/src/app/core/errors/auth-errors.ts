import { NETWORK_ERROR_MESSAGE, UNEXPECTED_ERROR_MESSAGE } from './error-messages';

const WRONG_CREDENTIALS = 'Correo o contraseña incorrectos.';

/** Firebase Auth error codes shown while signing in. Neutral on purpose: no account enumeration. */
const AUTH_MESSAGES: Record<string, string> = {
  'auth/invalid-credential': WRONG_CREDENTIALS,
  'auth/wrong-password': WRONG_CREDENTIALS,
  'auth/user-not-found': WRONG_CREDENTIALS,
  'auth/email-already-in-use': 'Ya existe una cuenta con este correo.',
  'auth/weak-password':
    'La contraseña es demasiado débil. Usa al menos 8 caracteres con letras y números.',
  'auth/requires-recent-login':
    'Por seguridad, cierra sesión, vuelve a ingresar e inténtalo de nuevo.',
  'auth/invalid-email': 'Ingresa un correo válido.',
  'auth/user-disabled': 'Esta cuenta está deshabilitada. Contacta al administrador.',
  'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
  'auth/network-request-failed': NETWORK_ERROR_MESSAGE,
};

const WRONG_CURRENT_PASSWORD = 'La contraseña actual no es correcta.';

/** When the user re-types the password of the signed-in account, a mismatch is about that password. */
const REAUTHENTICATE_MESSAGES: Record<string, string> = {
  'auth/invalid-credential': WRONG_CURRENT_PASSWORD,
  'auth/wrong-password': WRONG_CURRENT_PASSWORD,
};

export type AuthErrorContext = 'default' | 'reauthenticate';

/** Pure: it only reads the `code` property, so it works with any error shape. */
export function mapAuthError(error: unknown, context: AuthErrorContext = 'default'): string {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return UNEXPECTED_ERROR_MESSAGE;
  }
  const { code } = error;
  if (typeof code !== 'string') return UNEXPECTED_ERROR_MESSAGE;
  const specific = context === 'reauthenticate' ? REAUTHENTICATE_MESSAGES[code] : undefined;
  return specific ?? AUTH_MESSAGES[code] ?? UNEXPECTED_ERROR_MESSAGE;
}
