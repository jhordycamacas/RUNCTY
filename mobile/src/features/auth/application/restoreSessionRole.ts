import type { AuthGateway } from '../domain';

/** Errors meaning the stored session can never be refreshed again. */
const DEAD_SESSION_CODES = new Set([
  'auth/invalid-refresh-token',
  'auth/user-not-found',
  'auth/user-disabled',
  'auth/user-token-expired',
]);

function errorCode(error: unknown): string | undefined {
  return typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : undefined;
}

/**
 * Validates a restored session and returns its role.
 *
 * A persisted session can point to a deleted or disabled account (for example
 * after the emulators are reset). Without this check the app keeps a "ghost"
 * user and every request fails. Dead sessions are signed out; network errors
 * fall back to the cached token so the app still opens offline.
 */
export async function restoreSessionRole(gateway: AuthGateway): Promise<string | null> {
  try {
    return await gateway.getRole(true);
  } catch (error) {
    if (DEAD_SESSION_CODES.has(errorCode(error) ?? '')) {
      await gateway.signOut().catch(() => undefined);
      return null;
    }
  }
  try {
    return await gateway.getRole(false);
  } catch {
    return null;
  }
}
