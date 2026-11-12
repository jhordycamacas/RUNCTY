import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/core/theme';
import {
  AppText,
  Avatar,
  Badge,
  Button,
  Card,
  FormMessage,
  ListItem,
  LoadingView,
  Screen,
  ScreenHeader,
  SectionHeader,
} from '@/core/ui';
import { mapAuthError, useSession, useSignedInUser } from '@/features/auth';
import { useActiveCities } from '@/features/cities/application/useActiveCities';

import { useProfile } from '../hooks/useAccount';

export interface ProfileHomeScreenProps {
  onEditPersonalData: () => void;
  onOpenSportProfile: () => void;
  onOpenPreferences: () => void;
  onChangePassword: () => void;
  onDeleteAccount: () => void;
}

/** Perfil tab: user data and account sections. */
export function ProfileHomeScreen({
  onEditPersonalData,
  onOpenSportProfile,
  onOpenPreferences,
  onChangePassword,
  onDeleteAccount,
}: ProfileHomeScreenProps) {
  const { colors, spacing } = useTheme();
  const user = useSignedInUser();
  const { signOut } = useSession();
  const profile = useProfile(user.uid);
  const cities = useActiveCities();
  const [signOutError, setSignOutError] = useState<string | null>(null);

  if (profile.isPending) return <LoadingView label="Cargando tu perfil…" />;

  const data = profile.data;
  const cityName = cities.data?.find((c) => c.id === data?.cityId)?.name ?? data?.cityId ?? '—';
  const fullName = data ? `${data.firstName} ${data.lastName}` : '';

  return (
    <Screen scroll>
      <ScreenHeader title="Perfil" />
      <FormMessage message={profile.isError ? mapAuthError(profile.error) : null} />

      {data ? (
        <Card padding="lg" style={{ marginBottom: spacing.sm }}>
          <View style={styles.identity}>
            <Avatar name={fullName} size={64} />
            <View style={[styles.identityText, { marginLeft: spacing.lg }]}>
              <AppText variant="subtitle" weight="bold">
                {fullName}
              </AppText>
              <AppText variant="label" color="textMuted">
                {data.email || user.email}
              </AppText>
              <View style={[styles.badges, { marginTop: spacing.sm, gap: spacing.xs }]}>
                <Badge label={cityName} tone="primary" icon="location-outline" />
                {user.emailVerified ? (
                  <Badge label="Correo verificado" tone="success" icon="checkmark-circle" />
                ) : (
                  <Badge label="Correo sin verificar" tone="warning" icon="mail-unread-outline" />
                )}
              </View>
            </View>
          </View>
          <View
            style={[
              styles.facts,
              {
                borderTopColor: colors.border,
                marginTop: spacing.lg,
                paddingTop: spacing.md,
                gap: spacing.xl,
              },
            ]}
          >
            <Fact label="Fecha de nacimiento" value={data.birthDate} />
            {data.idNumber ? <Fact label="Cédula" value={data.idNumber} /> : null}
          </View>
        </Card>
      ) : null}

      <SectionHeader title="Tu cuenta" />
      <Card padding="none" style={{ overflow: 'hidden' }}>
        <ListItem
          icon="person-outline"
          title="Datos personales"
          subtitle="Nombre, fecha de nacimiento, ciudad y cédula"
          onPress={onEditPersonalData}
          disabled={!data}
        />
        <ListItem
          divider
          icon="fitness-outline"
          title="Perfil deportivo"
          subtitle="Nivel, objetivos, ritmo y distancia"
          onPress={onOpenSportProfile}
        />
        <ListItem
          divider
          icon="options-outline"
          title="Preferencias"
          subtitle="Apariencia, letra, unidades y notificaciones"
          onPress={onOpenPreferences}
        />
        <ListItem divider icon="lock-closed-outline" title="Cambiar contraseña" onPress={onChangePassword} />
      </Card>

      <SectionHeader title="Sesión" />
      <FormMessage message={signOutError} />
      <Button
        label="Cerrar sesión"
        variant="secondary"
        icon="log-out-outline"
        onPress={() => signOut().catch((e: unknown) => setSignOutError(mapAuthError(e)))}
      />
      <Card padding="none" style={{ marginTop: spacing.lg, overflow: 'hidden' }}>
        <ListItem
          icon="trash-outline"
          tone="danger"
          title="Eliminar cuenta"
          subtitle="Borra tus datos de forma permanente"
          onPress={onDeleteAccount}
        />
      </Card>
    </Screen>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <AppText variant="caption" color="textMuted">
        {label}
      </AppText>
      <AppText weight="medium">{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  identityText: {
    flex: 1,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  facts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
