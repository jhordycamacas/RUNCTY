import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/core/theme';
import { AppText, Card, Screen } from '@/core/ui';
import { useSignedInUser } from '@/features/auth';

/** Inicio tab. Routes and safety content arrive in later sprints. */
export function HomeScreen() {
  const { colors, spacing } = useTheme();
  const user = useSignedInUser();

  return (
    <Screen>
      <View style={styles.center}>
        <View style={[styles.mark, { backgroundColor: colors.primary, marginBottom: spacing.xl }]} />
        <AppText variant="display" align="center">
          RUNCTY
        </AppText>
        <AppText variant="subtitle" color="textMuted" align="center" style={{ marginTop: spacing.sm }}>
          Corre más seguro
        </AppText>
      </View>
      {!user.emailVerified ? (
        <Card>
          <AppText weight="medium">Verifica tu correo</AppText>
          <AppText color="textMuted">
            Te enviamos un enlace a {user.email}. Verificar tu correo nos ayuda a proteger tu cuenta.
          </AppText>
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mark: {
    width: 56,
    height: 8,
    borderRadius: 4,
  },
});
