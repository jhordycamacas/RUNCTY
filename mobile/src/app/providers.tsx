import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { queryClient } from '@/core/query/queryClient';
import { ThemeProvider } from '@/core/theme';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>{children}</ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
