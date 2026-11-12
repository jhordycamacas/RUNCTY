import { useEffect, useState, type ReactNode } from 'react';

import { ThemeProvider } from '@/core/theme';
import { LoadingView } from '@/core/ui';
import { useSession } from '@/features/auth';

import { readCachedPreferences } from '../application/preferencesUseCases';
import { preferencesDeps } from '../composition';
import { fontScaleMultiplier, type PreferenciaUsuario } from '../domain';
import { usePreferences } from './hooks/usePreferences';

interface CachedEntry {
  uid: string;
  preferences: PreferenciaUsuario | null;
}

/**
 * RF-01-14: applies the user's appearance and font size on app open. The
 * device cache (per uid) applies first; Firestore wins once it answers.
 * Signed out: device appearance and normal text.
 */
export function PreferencesThemeProvider({ children }: { children: ReactNode }) {
  const { status, user } = useSession();
  const uid = status === 'signedIn' && user ? user.uid : null;
  const remote = usePreferences(uid);
  const [cached, setCached] = useState<CachedEntry | null>(null);

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    void readCachedPreferences(uid, preferencesDeps).then((preferences) => {
      if (!cancelled) setCached({ uid, preferences });
    });
    return () => {
      cancelled = true;
    };
  }, [uid]);

  const cacheReady = cached !== null && cached.uid === uid;
  const active = uid ? (remote.data ?? (cacheReady ? cached.preferences : null)) : null;
  // Reading the local cache takes milliseconds; waiting avoids a theme flash.
  const waitingForCache = uid !== null && remote.data === undefined && !cacheReady;

  return (
    <ThemeProvider
      appearance={active?.appearance ?? 'system'}
      fontScale={active ? fontScaleMultiplier(active.fontScale) : 1}
    >
      {waitingForCache ? <LoadingView label="Preparando RUNCTY…" /> : children}
    </ThemeProvider>
  );
}
