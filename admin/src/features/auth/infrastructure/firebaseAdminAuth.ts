'use client';

import { onIdTokenChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';

import { firebaseAuth } from '@/core/firebase/client';
import { canAccessAdmin, readClaims } from '@/core/permissions/permissions';

import type { AdminSession } from '../domain/session';

export class AccessDeniedError extends Error {
  constructor() {
    super('No tienes acceso al panel de administración.');
    this.name = 'AccessDeniedError';
  }
}

async function toSession(user: User, forceRefresh: boolean): Promise<AdminSession> {
  const token = await user.getIdTokenResult(forceRefresh);
  return { uid: user.uid, email: user.email ?? '', claims: readClaims(token.claims) };
}

/**
 * Signs in and requires the `admin.access` permission. Runners and other
 * roles without it are signed out right away.
 */
export async function signInAdmin(email: string, password: string): Promise<AdminSession> {
  const { user } = await signInWithEmailAndPassword(firebaseAuth(), email.trim(), password);
  // Force a refresh so recently changed claims are honored.
  const session = await toSession(user, true);
  if (!canAccessAdmin(session.claims)) {
    await signOut(firebaseAuth());
    throw new AccessDeniedError();
  }
  return session;
}

export const signOutAdmin = (): Promise<void> => signOut(firebaseAuth());

/** Emits the current session (null when signed out) on sign-in and token refresh. */
export function watchSession(listener: (session: AdminSession | null) => void): () => void {
  return onIdTokenChanged(firebaseAuth(), (user) => {
    if (!user) {
      listener(null);
      return;
    }
    toSession(user, false).then(listener, () => listener(null));
  });
}
