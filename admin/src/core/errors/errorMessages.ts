/**
 * Spanish messages for Firebase errors shown in the admin panel.
 * Callables send a stable `details.reason` (see functions/src/shared/errors.ts).
 */
const REASONS: Record<string, string> = {
  'missing-permission': 'No tienes permiso para realizar esta acción.',
  unauthenticated: 'Tu sesión expiró. Vuelve a iniciar sesión.',
  'invalid-role-id': 'El identificador del rol no es válido.',
  'invalid-role-name': 'El nombre del rol es obligatorio (máximo 60 caracteres).',
  'invalid-role-description': 'La descripción admite máximo 200 caracteres.',
  'invalid-permissions': 'Hay permisos que no existen en el catálogo.',
  'role-exists': 'Ya existe un rol con ese identificador.',
  'role-not-found': 'El rol no existe.',
  'admin-permissions': 'El rol Administrador debe conservar todos los permisos.',
  'system-role': 'Los roles del sistema no se pueden eliminar.',
  'role-has-users': 'No se puede eliminar: el rol tiene usuarios asignados. Cámbiales el rol primero.',
  'user-not-found': 'El usuario no existe.',
  'self-lockout': 'No puedes quitarte tu propio rol de administrador.',
  'invalid-filter': 'Revisa los filtros de búsqueda.',
  'invalid-limit': 'Revisa los filtros de búsqueda.',
  'invalid-cursor': 'No se pudo cargar la página siguiente. Vuelve a buscar.',
  'invalid-city-id': 'El identificador de la ciudad no es válido.',
  'city-not-found': 'La ciudad o zona ya no existe.',
  'city-has-routes': 'No se puede eliminar: tiene rutas asociadas.',
  'city-has-zones': 'No se puede eliminar: la ciudad tiene zonas. Elimina primero sus zonas.',
  // Routes, segments, time slots and risk factors (functions/src/routes).
  'invalid-route-id': 'El identificador de la ruta no es válido.',
  'invalid-route-name': 'El nombre de la ruta es obligatorio (máximo 80 caracteres).',
  'invalid-route-description': 'La descripción de la ruta admite máximo 500 caracteres.',
  'invalid-route-start': 'Revisa el punto de inicio: necesita nombre (máximo 80 caracteres) y coordenadas válidas.',
  'invalid-route-end': 'Revisa el punto de llegada: necesita nombre (máximo 80 caracteres) y coordenadas válidas.',
  'invalid-distance': 'La distancia debe ser mayor que 0 y máximo 500 km.',
  'invalid-elevation-gain': 'El desnivel debe estar entre 0 y 10000 m.',
  'invalid-surface': 'Elige un tipo de superficie válido.',
  'invalid-difficulty': 'Elige una dificultad válida.',
  'invalid-active': 'El estado de la ruta no es válido.',
  'invalid-segment-id': 'El identificador del tramo no es válido.',
  'invalid-segment-name': 'El nombre del tramo es obligatorio (máximo 80 caracteres).',
  'invalid-coordinates': 'El tramo necesita entre 2 y 500 coordenadas válidas.',
  'invalid-segment-order': 'La posición del tramo debe ser un número entero desde 1.',
  'invalid-time-slot-id': 'El identificador de la franja no es válido.',
  'invalid-slot-label': 'El nombre de la franja admite máximo 40 caracteres.',
  'invalid-start-time': 'La hora de inicio debe tener el formato HH:MM (00:00 a 23:59).',
  'invalid-end-time': 'La hora de fin debe tener el formato HH:MM (00:00 a 24:00).',
  'invalid-time-range': 'La hora de inicio debe ser anterior a la de fin (mismo día). Si es un factor, completa ambas horas o ninguna.',
  'invalid-valid-from': 'La fecha de inicio de vigencia debe tener el formato AAAA-MM-DD.',
  'invalid-valid-to': 'La fecha de fin de vigencia debe tener el formato AAAA-MM-DD.',
  'invalid-date-range': 'La fecha final de vigencia no puede ser anterior a la inicial.',
  'invalid-risk-factor-id': 'El identificador del factor de riesgo no es válido.',
  'invalid-factor-type': 'Elige un tipo de factor de riesgo válido.',
  'invalid-severity': 'La severidad debe ser baja, media o alta.',
  'invalid-factor-description': 'La descripción del factor es obligatoria (máximo 200 caracteres).',
  'route-not-found': 'La ruta ya no existe.',
  'segment-not-found': 'El tramo ya no existe.',
  'time-slot-not-found': 'La franja ya no existe.',
  'risk-factor-not-found': 'El factor de riesgo ya no existe.',
  'too-many-segments': 'Una ruta admite máximo 50 tramos.',
  'too-many-time-slots': 'Una ruta admite máximo 12 franjas horarias.',
  'too-many-risk-factors': 'Un tramo admite máximo 20 factores de riesgo.',
  'time-slot-overlap': 'La franja se cruza con otra franja de la ruta. Ajusta las horas.',
};

const CALLABLE_CODES: Record<string, string> = {
  'functions/permission-denied': 'No tienes permiso para realizar esta acción.',
  'functions/unauthenticated': 'Tu sesión expiró. Vuelve a iniciar sesión.',
  'functions/unavailable': 'No hay conexión con el servidor. Inténtalo de nuevo.',
  'functions/deadline-exceeded': 'El servidor tardó demasiado. Inténtalo de nuevo.',
  'functions/invalid-argument': 'Los datos enviados no son válidos.',
  'functions/not-found': 'El registro no existe.',
  'permission-denied': 'No tienes permiso para realizar esta acción.',
  unavailable: 'No hay conexión con el servidor. Inténtalo de nuevo.',
};

const UNEXPECTED = 'Ocurrió un error inesperado. Inténtalo de nuevo.';

interface FirebaseLikeError {
  code?: unknown;
  details?: unknown;
}

const asError = (error: unknown): FirebaseLikeError =>
  typeof error === 'object' && error !== null ? (error as FirebaseLikeError) : {};

/** Message for errors of callables and Firestore writes. */
export function callableErrorMessage(error: unknown): string {
  const { code, details } = asError(error);
  const reason = (details as { reason?: unknown } | undefined)?.reason;
  if (typeof reason === 'string' && REASONS[reason]) return REASONS[reason];
  if (typeof code === 'string' && CALLABLE_CODES[code]) return CALLABLE_CODES[code];
  return UNEXPECTED;
}

const WRONG_CREDENTIALS = 'Correo o contraseña incorrectos.';

const AUTH_CODES: Record<string, string> = {
  // Neutral on purpose: do not reveal whether the email exists.
  'auth/invalid-credential': WRONG_CREDENTIALS,
  'auth/wrong-password': WRONG_CREDENTIALS,
  'auth/user-not-found': WRONG_CREDENTIALS,
  'auth/invalid-email': 'El correo no es válido.',
  'auth/user-disabled': 'Esta cuenta está deshabilitada.',
  'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
  'auth/network-request-failed': 'Sin conexión. Revisa tu red e inténtalo de nuevo.',
};

export function authErrorMessage(error: unknown): string {
  const { code } = asError(error);
  return (typeof code === 'string' && AUTH_CODES[code]) || UNEXPECTED;
}
