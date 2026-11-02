/**
 * Permission catalog (RF-02). Same keys as functions/src/roles/permissions.ts,
 * which is the source of truth on the server; this copy adds Spanish labels.
 */
export const PERMISSIONS = [
  'admin.access',
  'users.read',
  'roles.manage',
  'cities.manage',
  'routes.manage',
  'reports.validate',
  'ads.manage',
  'clubs.manage',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const LABELS: Record<Permission, string> = {
  'admin.access': 'Acceder al panel de administración',
  'users.read': 'Consultar usuarios',
  'roles.manage': 'Gestionar roles y asignarlos',
  'cities.manage': 'Gestionar ciudades y zonas',
  'routes.manage': 'Gestionar rutas',
  'reports.validate': 'Validar reportes comunitarios',
  'ads.manage': 'Gestionar publicidad',
  'clubs.manage': 'Gestionar clubes',
};

export const permissionLabel = (permission: Permission): string => LABELS[permission];

export function isPermission(value: unknown): value is Permission {
  return typeof value === 'string' && (PERMISSIONS as readonly string[]).includes(value);
}

/** Role and permissions carried by the ID token custom claims. */
export interface AccessClaims {
  role: string | null;
  perms: Permission[];
}

export function readClaims(claims: Record<string, unknown>): AccessClaims {
  return {
    role: typeof claims.role === 'string' ? claims.role : null,
    perms: Array.isArray(claims.perms) ? claims.perms.filter(isPermission) : [],
  };
}

/** Mirrors hasPerm() in firestore.rules: `admin` is a superuser fallback. */
export function hasPermission(claims: AccessClaims | null, permission: Permission): boolean {
  if (!claims) return false;
  return claims.role === 'admin' || claims.perms.includes(permission);
}

export const canAccessAdmin = (claims: AccessClaims | null): boolean => hasPermission(claims, 'admin.access');
