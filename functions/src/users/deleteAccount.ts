/**
 * RF-01-4: account deletion logic (credentials, profile and preferences).
 * Pure apart from the injected dependencies so it is unit-testable.
 */

/** The client re-authenticates right before calling; anything older is rejected. */
export const RECENT_SIGN_IN_MAX_AGE_SEC = 5 * 60;

/** `authTime` is the `auth_time` claim of the ID token (seconds since epoch). */
export function isRecentSignIn(authTime: unknown, nowMs: number): boolean {
  if (typeof authTime !== 'number' || !Number.isFinite(authTime)) return false;
  return nowMs / 1000 - authTime <= RECENT_SIGN_IN_MAX_AGE_SEC;
}

export interface DeleteAccountDeps {
  /** Recursively deletes `users/{uid}` and its sub-collections (`private/*`). */
  deleteUserData(uid: string): Promise<void>;
  deleteAuthUser(uid: string): Promise<void>;
}

export async function deleteUserAccount(uid: string, deps: DeleteAccountDeps): Promise<void> {
  // Data first: if the auth deletion fails, the user can sign in and retry.
  await deps.deleteUserData(uid);
  try {
    await deps.deleteAuthUser(uid);
  } catch (error) {
    if ((error as { code?: unknown }).code === 'auth/user-not-found') return;
    throw error;
  }
}
