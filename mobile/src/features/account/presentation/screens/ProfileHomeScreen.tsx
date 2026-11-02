import { useState } from 'react';
import { View } from 'react-native';

import { useTheme } from '@/core/theme';
import { AppText, Button, Card, FormMessage, Screen } from '@/core/ui';
import { mapAuthError, useSession, useSignedInUser } from '@/features/auth';

/** Perfil tab. Profile editing and account management arrive in T4. */
export function ProfileHomeScreen() {
  const { spacing } = useTheme();
  const user = useSignedInUser();
  const { signOut } = useSession();
  const [error, setError] = useState<string | null>(null);

  return (
    <Screen scroll>
      <Card style={{ marginBottom: spacing.xl }}>
        <AppText variant="label" color="textMuted">
          Correo
        </AppText>
        <AppText weight="medium">{user.email}</AppText>
      </Card>
      <FormMessage message={error} />
      <View>
        <Button
          label="Cerrar sesión"
          variant="secondary"
          onPress={() => signOut().catch((e: unknown) => setError(mapAuthError(e)))}
        />
      </View>
    </Screen>
  );
}
