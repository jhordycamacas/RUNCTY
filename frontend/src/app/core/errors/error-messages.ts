export const UNEXPECTED_ERROR_MESSAGE = 'Ocurrió un error inesperado. Inténtalo de nuevo.';
export const NETWORK_ERROR_MESSAGE = 'No hay conexión con el servidor. Inténtalo de nuevo.';

const SESSION_EXPIRED = 'Tu sesión expiró. Vuelve a iniciar sesión.';
const NO_PERMISSION = 'No tienes permiso para realizar esta acción.';

/** Spanish text per API `reason` code (backend/apps/*). Unknown codes fall back to the generic text. */
const REASON_MESSAGES: Record<string, string> = {
  // Authentication and authorization.
  unauthenticated: SESSION_EXPIRED,
  'auth-failed': SESSION_EXPIRED,
  'invalid-token': SESSION_EXPIRED,
  'token-expired': SESSION_EXPIRED,
  'token-revoked': 'Tu sesión fue cerrada. Vuelve a iniciar sesión.',
  'user-disabled': 'Esta cuenta está deshabilitada. Contacta al administrador.',
  'permission-denied': NO_PERMISSION,
  'missing-permission': NO_PERMISSION,
  'admin-only': 'Solo un administrador puede realizar esta acción.',
  'permission-escalation': 'No puedes asignar permisos que tú no tienes.',
  'recent-sign-in-required': 'Por seguridad, cierra sesión, vuelve a ingresar e inténtalo de nuevo.',
  // Generic request errors.
  'invalid-argument': 'Los datos enviados no son válidos.',
  'failed-precondition': 'La operación no se puede realizar en este momento.',
  'already-exists': 'El registro ya existe.',
  'not-found': 'El registro no existe.',
  'rate-limited': 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
  internal: UNEXPECTED_ERROR_MESSAGE,
  // Users, profile, sport profile and preferences.
  'user-not-found': 'El usuario no existe.',
  'profile-not-found': 'El perfil no existe.',
  'profile-missing': 'El perfil no existe.',
  'user-profile-missing': 'El perfil no existe.',
  'profile-exists': 'El perfil ya existe.',
  'sport-profile-not-found': 'Aún no tienes un perfil deportivo.',
  'preferences-not-found': 'Aún no tienes preferencias guardadas.',
  'email-required': 'El correo es obligatorio.',
  'invalid-filter': 'Revisa los filtros de búsqueda.',
  'invalid-limit': 'Revisa los filtros de búsqueda.',
  'invalid-cursor': 'No se pudo cargar la página siguiente. Vuelve a buscar.',
  // Roles.
  'invalid-role-id': 'El identificador del rol no es válido.',
  'invalid-role-name': 'El nombre del rol es obligatorio (máximo 60 caracteres).',
  'invalid-role-description': 'La descripción admite máximo 200 caracteres.',
  'invalid-permissions': 'Hay permisos que no existen en el catálogo.',
  'role-exists': 'Ya existe un rol con ese identificador.',
  'role-not-found': 'El rol no existe.',
  'admin-permissions': 'El rol Administrador debe conservar todos los permisos.',
  'system-role': 'Los roles del sistema no se pueden eliminar.',
  'role-has-users': 'No se puede eliminar: el rol tiene usuarios asignados. Cámbiales el rol primero.',
  'self-lockout': 'No puedes quitarte tu propio rol de administrador.',
  'last-admin': 'Debe quedar al menos un administrador.',
  // Cities and zones.
  'invalid-city-id': 'El identificador de la ciudad no es válido.',
  'invalid-city-name': 'El nombre es obligatorio (máximo 80 caracteres).',
  'invalid-city-province': 'La provincia es obligatoria (máximo 80 caracteres).',
  'invalid-city-type': 'Elige si es una ciudad o una zona.',
  'invalid-city-location': 'Revisa las coordenadas de la ubicación.',
  'invalid-coverage': 'Revisa el área de cobertura.',
  'invalid-parent-city': 'La zona debe pertenecer a una ciudad.',
  'city-exists': 'Ya existe una ciudad o zona con ese identificador.',
  'city-not-found': 'La ciudad o zona ya no existe.',
  'city-has-routes': 'No se puede eliminar: tiene rutas asociadas.',
  'city-has-zones': 'No se puede eliminar: la ciudad tiene zonas. Elimina primero sus zonas.',
  // Routes, segments, time slots and risk factors.
  'invalid-route-id': 'El identificador de la ruta no es válido.',
  'invalid-route-name': 'El nombre de la ruta es obligatorio (máximo 80 caracteres).',
  'invalid-route-description': 'La descripción de la ruta admite máximo 500 caracteres.',
  'invalid-route-start': 'Revisa el punto de inicio: necesita nombre (máximo 80 caracteres) y coordenadas válidas.',
  'invalid-route-end': 'Revisa el punto de llegada: necesita nombre (máximo 80 caracteres) y coordenadas válidas.',
  'invalid-distance': 'La distancia debe ser mayor que 0 y máximo 500 km.',
  'invalid-elevation-gain': 'El desnivel debe estar entre 0 y 10000 m.',
  'invalid-surface': 'La superficie es obligatoria y admite máximo 40 caracteres.',
  'invalid-difficulty': 'La dificultad es obligatoria y admite máximo 40 caracteres.',
  'invalid-active': 'El estado de la ruta no es válido.',
  'invalid-segment-id': 'El identificador del tramo no es válido.',
  'invalid-segment-name': 'El nombre del tramo es obligatorio (máximo 80 caracteres).',
  'invalid-coordinates': 'El tramo necesita entre 2 y 500 coordenadas válidas.',
  'invalid-segment-order': 'La posición del tramo debe ser un número entero desde 1.',
  'invalid-time-slot-id': 'El identificador de la franja no es válido.',
  'invalid-slot-label': 'El nombre de la franja admite máximo 40 caracteres.',
  'invalid-start-time': 'La hora de inicio debe tener el formato HH:MM (00:00 a 23:59).',
  'invalid-end-time': 'La hora de fin debe tener el formato HH:MM (00:00 a 24:00).',
  'invalid-time-range':
    'La hora de inicio debe ser anterior a la de fin (mismo día). Si es un factor, completa ambas horas o ninguna.',
  'invalid-valid-from': 'La fecha de inicio de vigencia debe tener el formato AAAA-MM-DD.',
  'invalid-valid-to': 'La fecha de fin de vigencia debe tener el formato AAAA-MM-DD.',
  'invalid-date-range': 'La fecha final de vigencia no puede ser anterior a la inicial.',
  'invalid-risk-factor-id': 'El identificador del factor de riesgo no es válido.',
  'invalid-factor-type': 'El tipo de factor es obligatorio y admite máximo 40 caracteres.',
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

export function messageForReason(reason: string): string {
  return REASON_MESSAGES[reason] ?? UNEXPECTED_ERROR_MESSAGE;
}
