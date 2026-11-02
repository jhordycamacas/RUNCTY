import { ADMIN_ROLE, type Permission } from '../roles/permissions';

export type Claims = Record<string, unknown>;

/**
 * Permission check over the ID token claims. Mirrors `hasPerm()` in
 * firestore.rules: the `admin` role is a superuser fallback so tokens issued
 * before the `perms` claim existed keep working.
 */
export function hasPermission(token: Claims | undefined, permission: Permission): boolean {
  if (!token) return false;
  if (token.role === ADMIN_ROLE) return true;
  return Array.isArray(token.perms) && token.perms.includes(permission);
}

/** Claims for a role assignment, preserving unrelated custom claims. */
export function claimsFor(existing: Claims | undefined, role: string, perms: readonly string[]): Claims {
  return { ...(existing ?? {}), role, perms: [...perms] };
}
