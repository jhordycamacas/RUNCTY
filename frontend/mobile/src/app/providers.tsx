import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { queryClient } from '@/core/query/queryClient';
import { SessionProvider } from '@/features/auth';
import { PreferencesThemeProvider } from '@/features/preferences';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          {/* Theme follows the signed-in user's preferences (RF-01-14). */}
          <PreferencesThemeProvider>{children}</PreferencesThemeProvider>
        </SessionProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
