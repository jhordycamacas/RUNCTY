import { Pressable, StyleSheet, View } from 'react-native';

import { MIN_TOUCH_TARGET, useTheme } from '@/core/theme';
import { AppText, Badge, Icon, SAFETY_LEVELS, SafetyBadge } from '@/core/ui';

import { routeSafetyForSlot } from '../../domain/catalog';
import { DIFFICULTY_LABELS, SURFACE_LABELS, factorTypeLabel, formatElevation, formatKm } from '../../domain/labels';
import type { Ruta } from '../../domain/route';

export interface RouteCardProps {
  route: Ruta;
  slotKey: string | null;
  onPress: () => void;
}

/** "3,2 km · 15 m de desnivel · Principiante · Asfalto". */
function routeMeta(route: Ruta): string {
  return [
    formatKm(route.distanceKm),
    `${formatElevation(route.elevationGainM)} de desnivel`,
    route.difficulty ? DIFFICULTY_LABELS[route.difficulty] : null,
    route.surface ? SURFACE_LABELS[route.surface] : null,
  ]
    .filter(Boolean)
    .join(' · ');
}

/** Catalog card: route summary with its safety level for the selected slot. */
export function RouteCard({ route, slotKey, onPress }: RouteCardProps) {
  const { colors, radii, spacing, elevation } = useTheme();
  const safety = routeSafetyForSlot(route, slotKey);
  const meta = routeMeta(route);
  const top = safety?.factors[0];
  const topLine = top
    ? `${factorTypeLabel(top.type)}${top.segmentName ? ` en ${top.segmentName}` : ''}`
    : safety
      ? 'Sin factores de riesgo registrados'
      : null;
  const safetyLabel = safety ? SAFETY_LEVELS[safety.level].label : 'Sin evaluar en esta franja';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[route.name, meta, safetyLabel, topLine].filter(Boolean).join('. ')}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        elevation.sm,
        {
          backgroundColor: pressed ? colors.surface : colors.surfaceElevated,
          borderColor: colors.border,
          borderRadius: radii.lg,
          padding: spacing.lg,
          marginBottom: spacing.md,
        },
      ]}
    >
      <View style={styles.header}>
        <AppText variant="subtitle" weight="bold" style={styles.title}>
          {route.name}
        </AppText>
        <Icon name="chevron-forward" size={20} color="textMuted" />
      </View>
      <AppText variant="label" color="textMuted" style={{ marginTop: spacing.xxs }}>
        {meta}
      </AppText>
      <View style={[styles.safetyRow, { marginTop: spacing.md }]}>
        {safety ? (
          <SafetyBadge level={safety.level} />
        ) : (
          <Badge label="Sin evaluar" icon="help-circle-outline" />
        )}
      </View>
      {topLine ? (
        <AppText variant="label" color="textMuted" numberOfLines={2} style={{ marginTop: spacing.sm }}>
          {topLine}
        </AppText>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: MIN_TOUCH_TARGET,
    borderWidth: StyleSheet.hairlineWidth,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    marginRight: 8,
  },
  safetyRow: {
    flexDirection: 'row',
  },
});
