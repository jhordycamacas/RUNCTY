import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/core/theme';

export interface ScreenProps {
  children: ReactNode;
  /** Wrap content in a ScrollView (forms, long content). */
  scroll?: boolean;
  contentStyle?: ViewStyle;
}

export function Screen({ children, scroll = false, contentStyle }: ScreenProps) {
  const { colors, spacing } = useTheme();
  const padding = { padding: spacing.xl };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]}>
      {scroll ? (
        <ScrollView contentContainerStyle={[padding, contentStyle]} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, padding, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
