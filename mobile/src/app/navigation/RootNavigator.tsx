import { DarkTheme, DefaultTheme, NavigationContainer, type Theme as NavTheme } from '@react-navigation/native';
import { useMemo } from 'react';

import { useTheme } from '@/core/theme';
import { LoadingView } from '@/core/ui';
import { useSession } from '@/features/auth';

import { AppTabs } from './AppTabs';
import { AuthNavigator } from './AuthNavigator';

/** Auth guard: loader while the session resolves, then auth stack or app tabs. */
export function RootNavigator() {
  const { scheme, colors } = useTheme();
  const { status } = useSession();

  const navTheme = useMemo<NavTheme>(() => {
    const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.primaryText,
        background: colors.background,
        card: colors.surface,
        text: colors.text,
        border: colors.border,
        notification: colors.primary,
      },
    };
  }, [scheme, colors]);

  if (status === 'loading') {
    return <LoadingView label="Preparando RUNCTY…" />;
  }

  return (
    <NavigationContainer theme={navTheme}>
      {status === 'signedIn' ? <AppTabs /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
