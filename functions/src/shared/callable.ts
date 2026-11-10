import { HttpsError, type CallableRequest } from 'firebase-functions/v2/https';

import { ADMIN_ROLE, type Permission } from '../roles/permissions';
import type { RoleCaller } from '../roles/roleService';
import { hasPermission } from './authz';
import { DomainError } from './errors';

/** Ensures the caller is signed in and holds `permission`; returns the caller uid. */
export function requirePermission(request: CallableRequest, permission: Permission): string {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Sign in first.', { reason: 'unauthenticated' });
  }
  if (!hasPermission(request.auth.token, permission)) {
    throw new HttpsError('permission-denied', `Missing permission ${permission}.`, { reason: 'missing-permission' });
  }
  return request.auth.uid;
}

/** Runs domain logic and maps DomainError to HttpsError (`details.reason` for the UI). */
export async function runDomain<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof DomainError) {
      throw new HttpsError(error.code, error.message, { reason: error.reason });
    }
    throw error;
  }
}

/** Role-operation caller (uid, admin flag and permissions) from a signed-in request. */
export function roleCaller(request: CallableRequest): RoleCaller {
  const token: Record<string, unknown> = request.auth?.token ?? {};
  return {
    uid: request.auth?.uid ?? '',
    isAdmin: token.role === ADMIN_ROLE,
    permissions: Array.isArray(token.perms) ? token.perms.filter((p): p is string => typeof p === 'string') : [],
  };
}
