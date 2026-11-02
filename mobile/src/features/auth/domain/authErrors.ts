/**
 * Maps Firebase error codes to user-facing Spanish messages.
 * Pure: it only reads the `code` property, so it works with any error shape.
 */
export const GENERIC_ERROR_MESSAGE = 'Ocurrió un error inesperado. Inténtalo de nuevo.';

export type AuthErrorContext = 'default' | 'reauthenticate';

const MESSAGES: Record<string, string> = {
  'auth/email-already-in-use': 'Ya existe una cuenta con este correo.',
  'auth/invalid-email': 'Ingresa un correo válido.',
  'auth/weak-password': 'La contraseña es demasiado débil. Usa al menos 8 caracteres con letras y números.',
  'auth/invalid-credential': 'Correo o contraseña incorrectos.',
  'auth/wrong-password': 'Correo o contraseña incorrectos.',
  'auth/user-not-found': 'Correo o contraseña incorrectos.',
  'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
  'auth/network-request-failed': 'Sin conexión. Revisa tu internet e inténtalo de nuevo.',
  'auth/user-disabled': 'Esta cuenta está deshabilitada. Contacta al administrador.',
  'auth/requires-recent-login': 'Por seguridad, cierra sesión, vuelve a ingresar e inténtalo de nuevo.',
  // Firestore / Cloud Functions codes that reach the UI.
  unavailable: 'Sin conexión. Revisa tu internet e inténtalo de nuevo.',
  'functions/unavailable': 'Sin conexión. Revisa tu internet e inténtalo de nuevo.',
  'permission-denied': 'No tienes permiso para realizar esta acción.',
  'functions/unauthenticated': 'Por seguridad, cierra sesión, vuelve a ingresar e inténtalo de nuevo.',
  'functions/failed-precondition': 'Por seguridad, confirma tu contraseña de nuevo e inténtalo otra vez.',
};

const REAUTH_MESSAGES: Record<string, string> = {
  'auth/invalid-credential': 'La contraseña actual no es correcta.',
  'auth/wrong-password': 'La contraseña actual no es correcta.',
};

export function errorCode(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const { code } = error as { code: unknown };
    return typeof code === 'string' ? code : undefined;
  }
  return undefined;
}

export function mapAuthError(error: unknown, context: AuthErrorContext = 'default'): string {
  const code = errorCode(error);
  if (!code) return GENERIC_ERROR_MESSAGE;
  if (context === 'reauthenticate' && REAUTH_MESSAGES[code]) return REAUTH_MESSAGES[code];
  return MESSAGES[code] ?? GENERIC_ERROR_MESSAGE;
}
