import { NETWORK_ERROR_MESSAGE, UNEXPECTED_ERROR_MESSAGE } from './error-messages';

const WRONG_CREDENTIALS = 'Correo o contraseña incorrectos.';

/** Firebase Auth error codes shown while signing in. Neutral on purpose: no account enumeration. */
const AUTH_MESSAGES: Record<string, string> = {
  'auth/invalid-credential': WRONG_CREDENTIALS,
  'auth/wrong-password': WRONG_CREDENTIALS,
  'auth/user-not-found': WRONG_CREDENTIALS,
  'auth/invalid-email': 'Ingresa un correo válido.',
  'auth/user-disabled': 'Esta cuenta está deshabilitada. Contacta al administrador.',
  'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
  'auth/network-request-failed': NETWORK_ERROR_MESSAGE,
};

/** Pure: it only reads the `code` property, so it works with any error shape. */
export function mapAuthError(error: unknown): string {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return UNEXPECTED_ERROR_MESSAGE;
  }
  const { code } = error;
  return (typeof code === 'string' && AUTH_MESSAGES[code]) || UNEXPECTED_ERROR_MESSAGE;
}
