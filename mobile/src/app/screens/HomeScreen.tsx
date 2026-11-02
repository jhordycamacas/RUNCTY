import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/core/theme';
import { AppText, Screen } from '@/core/ui';

/** Placeholder home. Auth and the real tabs arrive in T3. */
export function HomeScreen() {
  const { colors, spacing } = useTheme();

  return (
    <Screen contentStyle={styles.center}>
      <View style={[styles.mark, { backgroundColor: colors.primary, marginBottom: spacing.xl }]} />
      <AppText variant="display" align="center">
        RUNCTY
      </AppText>
      <AppText variant="subtitle" color="textMuted" align="center" style={{ marginTop: spacing.sm }}>
        Corre más seguro
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  mark: {
    width: 56,
    height: 8,
    borderRadius: 4,
  },
});
