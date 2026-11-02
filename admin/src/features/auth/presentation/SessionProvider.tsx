'use client';

import { useQueryClient } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { canAccessAdmin } from '@/core/permissions/permissions';

import type { AdminSession } from '../domain/session';
import { signOutAdmin, watchSession } from '../infrastructure/firebaseAdminAuth';

type SessionState =
  | { status: 'loading'; session: null }
  | { status: 'signedOut'; session: null }
  | { status: 'signedIn'; session: AdminSession };

const SessionContext = createContext<SessionState>({ status: 'loading', session: null });

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>({ status: 'loading', session: null });
  const queryClient = useQueryClient();

  useEffect(
    () =>
      watchSession((session) => {
        if (session && canAccessAdmin(session.claims)) {
          setState({ status: 'signedIn', session });
          return;
        }
        // A session without admin.access (e.g. role removed) is closed.
        if (session) void signOutAdmin();
        // Do not leak cached admin data to the next session.
        queryClient.clear();
        setState({ status: 'signedOut', session: null });
      }),
    [queryClient],
  );

  return <SessionContext.Provider value={state}>{children}</SessionContext.Provider>;
}

export const useSession = (): SessionState => useContext(SessionContext);
