import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { restoreSessionRole } from '../../application/restoreSessionRole';
import { authGateway, userDocGateway } from '../../composition';
import type { AuthUser } from '../../domain';

type SessionStatus = 'loading' | 'signedOut' | 'signedIn';

export interface Session {
  status: SessionStatus;
  user: AuthUser | null;
  /** Role from the ID token claims; null until the Cloud Function assigns it. */
  role: string | null;
  signOut: () => Promise<void>;
  /**
   * Keeps the auth stack mounted while a sign-up is in flight, so a failed
   * profile write (and its rollback) is reported on the register screen.
   */
  setRegistrationInProgress: (inProgress: boolean) => void;
}

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined);
  const [role, setRole] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);

  useEffect(
    () =>
      authGateway.onAuthStateChanged((next) => {
        setUser(next);
        if (!next) {
          setRole(null);
          // Never leak cached data of a previous account.
          queryClient.clear();
        }
      }),
    [queryClient],
  );

  const uid = user?.uid;

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    let stopWatching: (() => void) | undefined;

    restoreSessionRole(authGateway)
      .then((current) => {
        if (cancelled) return;
        setRole(current);
        if (current) return;
        // New account: the claim appears after the Cloud Function runs. It
        // mirrors the role to the doc after setting the claim, so seeing it
        // there means a forced token refresh will include the claim.
        stopWatching = userDocGateway.watchRole(uid, (docRole) => {
          if (!docRole) return;
          authGateway
            .getRole(true)
            .then((fresh) => {
              if (cancelled || !fresh) return;
              setRole(fresh);
              stopWatching?.();
              stopWatching = undefined;
            })
            .catch(() => undefined);
        });
      })
      .catch(() => {
        if (!cancelled) setRole(null);
      });

    return () => {
      cancelled = true;
      stopWatching?.();
    };
  }, [uid]);

  const signOut = useCallback(() => authGateway.signOut(), []);

  const session = useMemo<Session>(() => {
    const status: SessionStatus =
      user === undefined ? 'loading' : user === null || registering ? 'signedOut' : 'signedIn';
    return {
      status,
      user: user ?? null,
      role,
      signOut,
      setRegistrationInProgress: setRegistering,
    };
  }, [user, role, registering, signOut]);

  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}

export function useSession(): Session {
  const session = useContext(SessionContext);
  if (!session) throw new Error('useSession must be used inside <SessionProvider>');
  return session;
}

/** The signed-in user; only call it from screens behind the auth guard. */
export function useSignedInUser(): AuthUser {
  const { user } = useSession();
  if (!user) throw new Error('useSignedInUser called without a signed-in user');
  return user;
}
