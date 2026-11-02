import { useState } from 'react';
import { View } from 'react-native';

import { useTheme } from '@/core/theme';
import { AppText, Button, Card, FormMessage, LoadingView, Screen } from '@/core/ui';
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

function Row({ label, value }: { label: string; value: string }) {
  const { spacing } = useTheme();
  return (
    <View style={{ marginBottom: spacing.md }}>
      <AppText variant="label" color="textMuted">
        {label}
      </AppText>
      <AppText weight="medium">{value}</AppText>
    </View>
  );
}

/** Perfil tab: user data and account sections. */
export function ProfileHomeScreen({
  onEditPersonalData,
  onOpenSportProfile,
  onOpenPreferences,
  onChangePassword,
  onDeleteAccount,
}: ProfileHomeScreenProps) {
  const { spacing } = useTheme();
  const user = useSignedInUser();
  const { signOut } = useSession();
  const profile = useProfile(user.uid);
  const cities = useActiveCities();
  const [signOutError, setSignOutError] = useState<string | null>(null);

  if (profile.isPending) return <LoadingView label="Cargando tu perfil…" />;

  const data = profile.data;
  const cityName = cities.data?.find((c) => c.id === data?.cityId)?.name ?? data?.cityId ?? '—';
  const gap = { marginBottom: spacing.md };

  return (
    <Screen scroll>
      <FormMessage message={profile.isError ? mapAuthError(profile.error) : null} />
      {data ? (
        <Card style={{ marginBottom: spacing.xl }}>
          <AppText variant="title" style={gap}>
            {`${data.firstName} ${data.lastName}`}
          </AppText>
          <Row label="Correo" value={data.email || user.email} />
          <Row label="Fecha de nacimiento" value={data.birthDate} />
          <Row label="Ciudad" value={cityName} />
          {data.idNumber ? <Row label="Cédula" value={data.idNumber} /> : null}
        </Card>
      ) : null}

      <View style={gap}>
        <Button label="Datos personales" variant="secondary" onPress={onEditPersonalData} disabled={!data} />
      </View>
      <View style={gap}>
        <Button label="Perfil deportivo" variant="secondary" onPress={onOpenSportProfile} />
      </View>
      <View style={gap}>
        <Button label="Preferencias" variant="secondary" onPress={onOpenPreferences} />
      </View>
      <View style={gap}>
        <Button label="Cambiar contraseña" variant="secondary" onPress={onChangePassword} />
      </View>

      <FormMessage message={signOutError} />
      <View style={gap}>
        <Button
          label="Cerrar sesión"
          onPress={() => signOut().catch((e: unknown) => setSignOutError(mapAuthError(e)))}
        />
      </View>
      <Button label="Eliminar cuenta" variant="ghost" onPress={onDeleteAccount} />
    </Screen>
  );
}
