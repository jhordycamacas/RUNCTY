import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  type Theme as NavTheme,
} from '@react-navigation/native';
import { useMemo } from 'react';

import { fontFamilies, useTheme, useTypeface } from '@/core/theme';
import { LoadingView } from '@/core/ui';
import { useSession } from '@/features/auth';

import { AppTabs } from './AppTabs';
import { AuthNavigator } from './AuthNavigator';

/** Auth guard: loader while the session resolves, then auth stack or app tabs. */
export function RootNavigator() {
  const { scheme, colors } = useTheme();
  const { status } = useSession();
  const customFonts = Boolean(useTypeface('regular').fontFamily);

  const navTheme = useMemo<NavTheme>(() => {
    const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      // Navigator chrome (tab labels, header titles, back labels) uses Inter too.
      fonts: customFonts
        ? {
            regular: { fontFamily: fontFamilies.regular, fontWeight: 'normal' },
            medium: { fontFamily: fontFamilies.medium, fontWeight: 'normal' },
            bold: { fontFamily: fontFamilies.semibold, fontWeight: 'normal' },
            heavy: { fontFamily: fontFamilies.bold, fontWeight: 'normal' },
          }
        : base.fonts,
      colors: {
        ...base.colors,
        primary: colors.primaryText,
        background: colors.background,
        card: colors.background,
        text: colors.text,
        border: colors.border,
        notification: colors.primary,
      },
    };
  }, [scheme, colors, customFonts]);

  if (status === 'loading') {
    return <LoadingView label="Preparando RUNCTY…" />;
  }

  return (
    <NavigationContainer theme={navTheme}>
      {status === 'signedIn' ? <AppTabs /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
