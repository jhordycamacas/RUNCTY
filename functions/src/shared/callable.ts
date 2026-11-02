import { HttpsError, type CallableRequest } from 'firebase-functions/v2/https';

import type { Permission } from '../roles/permissions';
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
