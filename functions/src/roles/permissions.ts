/**
 * RF-02: permission catalog and system roles.
 *
 * Permissions travel in the `perms` custom claim (`{ role, perms }`), so the
 * security rules and the callables check them without reading Firestore.
 * Keep the catalog small: each entry gates one admin area.
 *
 * | Permission         | Grants                                          |
 * | ------------------ | ----------------------------------------------- |
 * | admin.access       | Sign in to the admin panel                      |
 * | users.read         | Search and read user profiles (RF-01-2)         |
 * | roles.manage       | CRUD roles and assign them to users (RF-02)     |
 * | cities.manage      | CRUD cities and zones (RF-04)                   |
 * | routes.manage      | CRUD routes and segments (RF-05, later sprint)  |
 * | reports.validate   | Validate community reports (RF-17, later)       |
 * | ads.manage         | Manage advertisers and campaigns (RF-24, later) |
 * | clubs.manage       | Manage clubs and memberships (RF-19, later)     |
 *
 * This module has no Firebase imports: the emulator seed script reuses it.
 */
export const ALL_PERMISSIONS = [
  'admin.access',
  'users.read',
  'roles.manage',
  'cities.manage',
  'routes.manage',
  'reports.validate',
  'ads.manage',
  'clubs.manage',
] as const;

export type Permission = (typeof ALL_PERMISSIONS)[number];

export function isPermission(value: unknown): value is Permission {
  return typeof value === 'string' && (ALL_PERMISSIONS as readonly string[]).includes(value);
}

/** Sorted unique catalog permissions, or null if anything is outside the catalog. */
export function normalizePermissions(value: unknown): Permission[] | null {
  if (!Array.isArray(value) || !value.every(isPermission)) return null;
  return [...new Set(value)].sort();
}

export const ADMIN_ROLE = 'admin';
export const RUNNER_ROLE = 'runner';

export interface SystemRole {
  name: string;
  description: string;
  permissions: readonly Permission[];
}

/** Seeded roles. They cannot be deleted, and `admin` always keeps every permission. */
export const SYSTEM_ROLES: Record<'runner' | 'admin' | 'club_rep', SystemRole> = {
  runner: {
    name: 'Corredor',
    description: 'Usuario de la app móvil. Sin acceso al panel de administración.',
    permissions: [],
  },
  admin: {
    name: 'Administrador',
    description: 'Personal de Gacelas con todos los permisos.',
    permissions: ALL_PERMISSIONS,
  },
  club_rep: {
    name: 'Representante de club',
    description: 'Aporta rutas de su ciudad y apoya la revisión de reportes.',
    permissions: ['admin.access', 'routes.manage', 'reports.validate'],
  },
};
