import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { useMemo } from 'react';

import { useTheme, useTypeface } from '@/core/theme';

/** Native stack headers shared by every stack: flat, themed, Inter titles. */
export function useStackScreenOptions(): NativeStackNavigationOptions {
  const { colors, typography, fontScale } = useTheme();
  const { fontFamily } = useTypeface('semibold');

  return useMemo<NativeStackNavigationOptions>(
    () => ({
      headerBackTitle: 'Atrás',
      headerShadowVisible: false,
      headerTintColor: colors.primaryText,
      headerStyle: { backgroundColor: colors.background },
      headerTitleStyle: {
        color: colors.text,
        fontSize: typography.sizes.subtitle * fontScale,
        // Without Inter (failed to load) the system font gets the weight instead.
        ...(fontFamily ? { fontFamily } : { fontWeight: '600' as const }),
      },
      contentStyle: { backgroundColor: colors.background },
    }),
    [colors, typography, fontScale, fontFamily],
  );
}
