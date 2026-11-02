import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useTheme } from '@/core/theme';

import { AppText } from './AppText';

export function LoadingView({ label = 'Cargando…' }: { label?: string }) {
  const { colors, spacing } = useTheme();
  return (
    <View
      style={[styles.center, { backgroundColor: colors.background }]}
      accessibilityRole="progressbar"
      accessibilityLabel={label}
    >
      <ActivityIndicator size="large" color={colors.primaryText} />
      <AppText color="textMuted" style={{ marginTop: spacing.md }}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
