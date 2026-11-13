/** Permission catalog; same keys as backend/apps/shared/domain/permissions.py. */
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

export const ADMIN_ROLE = 'admin';

export function isPermission(value: unknown): value is Permission {
  return typeof value === 'string' && (PERMISSIONS as readonly string[]).includes(value);
}

/** Identity and authority of the caller, exactly as `GET /me` answers. */
export interface Session {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  role: string | null;
  perms: readonly Permission[];
}

/**
 * Mirrors the server rule (the `admin` role is a superuser). This only decides what the UI
 * shows; the API enforces every permission again.
 */
export function hasPermission(session: Session | null, permission: Permission): boolean {
  if (!session) return false;
  return session.role === ADMIN_ROLE || session.perms.includes(permission);
}
