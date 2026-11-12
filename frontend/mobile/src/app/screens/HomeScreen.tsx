import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { MIN_TOUCH_TARGET, useTheme } from '@/core/theme';
import {
  AppText,
  BrandMark,
  Callout,
  Card,
  Icon,
  ScreenHeader,
  SectionHeader,
  Screen,
  type IconName,
} from '@/core/ui';
import { useProfile } from '@/features/account/presentation/hooks/useAccount';
import { useSignedInUser } from '@/features/auth';
import { RecommendedRoutes } from '@/features/routes/presentation/components/RecommendedRoutes';
import { getNextTrainingSlot } from '@/features/training/domain/trainingSlots';

export interface HomeScreenProps {
  onOpenRoutes: () => void;
  /** Opens a route in the Rutas tab showing the given time slot window. */
  onOpenRoute: (routeId: string, slotKey: string | null) => void;
  onOpenProfile: () => void;
  onOpenPreferences: () => void;
}

/** Current time, refreshed every minute so the next-slot card stays current. */
function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/** Inicio tab: greeting, next training slot, shortcuts and recommended routes. */
export function HomeScreen({ onOpenRoutes, onOpenRoute, onOpenProfile, onOpenPreferences }: HomeScreenProps) {
  const { spacing } = useTheme();
  const user = useSignedInUser();
  const profile = useProfile(user.uid);
  const firstName = profile.data?.firstName.trim().split(/\s+/)[0];
  const now = useNow();

  return (
    <Screen scroll>
      <ScreenHeader
        left={<BrandMark size={44} />}
        title={firstName ? `Hola, ${firstName}` : 'Hola'}
        subtitle="Corre más seguro"
      />

      {!user.emailVerified ? (
        <Callout
          tone="warning"
          icon="mail-unread-outline"
          title="Verifica tu correo"
          message={`Te enviamos un enlace a ${user.email}. Verificar tu correo nos ayuda a proteger tu cuenta.`}
        />
      ) : null}

      <NextSlotCard now={now} />

      <SectionHeader title="Accesos rápidos" />
      <View style={[styles.tiles, { gap: spacing.md }]}>
        <QuickAction icon="map-outline" label="Rutas" onPress={onOpenRoutes} />
        <QuickAction icon="person-outline" label="Perfil" onPress={onOpenProfile} />
        <QuickAction icon="options-outline" label="Preferencias" onPress={onOpenPreferences} />
      </View>

      <SectionHeader title="Rutas recomendadas" action={{ label: 'Ver todas', onPress: onOpenRoutes }} />
      <RecommendedRoutes onOpenRoute={onOpenRoute} />
    </Screen>
  );
}

function NextSlotCard({ now }: { now: Date }) {
  const { colors, spacing } = useTheme();
  const next = getNextTrainingSlot(now);
  const heading = next.isNow ? 'Estás en una franja recomendada' : 'Próxima franja recomendada';

  return (
    <Card
      elevation="md"
      padding="lg"
      accessible
      accessibilityLabel={`${heading}: ${next.label}, de ${next.rangeLabel}`}
      style={{ backgroundColor: colors.primary, borderColor: colors.primary, marginBottom: spacing.sm }}
    >
      <View style={styles.slotHeader}>
        <Icon name="time-outline" size={20} color="onPrimary" style={{ marginRight: spacing.sm }} />
        <AppText variant="label" weight="medium" color="onPrimary">
          {heading}
        </AppText>
      </View>
      <AppText variant="display" color="onPrimary" style={{ marginTop: spacing.sm }}>
        {next.label}
      </AppText>
      <AppText color="onPrimary" style={{ marginTop: spacing.xxs }}>
        {`Franja de ${next.rangeLabel}`}
      </AppText>
    </Card>
  );
}

function QuickAction({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const { colors, radii, spacing, elevation } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        elevation.sm,
        {
          backgroundColor: pressed ? colors.primaryTint : colors.surfaceElevated,
          borderColor: colors.border,
          borderRadius: radii.lg,
          paddingVertical: spacing.lg,
          paddingHorizontal: spacing.sm,
        },
      ]}
    >
      <View style={[styles.tileIcon, { backgroundColor: colors.primaryTint, marginBottom: spacing.sm }]}>
        <Icon name={icon} size={22} color="primaryText" />
      </View>
      <AppText variant="label" weight="semibold" align="center" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tiles: {
    flexDirection: 'row',
  },
  tile: {
    flex: 1,
    alignItems: 'center',
    minHeight: MIN_TOUCH_TARGET,
    borderWidth: StyleSheet.hairlineWidth,
  },
  tileIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
