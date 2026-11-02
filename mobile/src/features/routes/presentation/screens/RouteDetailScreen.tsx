import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/core/theme';
import {
  AppText,
  Badge,
  Callout,
  Card,
  ListItem,
  LoadingView,
  SafetyBadge,
  Screen,
  SectionHeader,
  StatTile,
} from '@/core/ui';

import { useRouteDetail, useRouteSegments } from '../../application/useRoutes';
import { routeSafetyForSlot, segmentSafetyForSlot } from '../../domain/catalog';
import { DIFFICULTY_LABELS, SURFACE_LABELS, formatElevation, formatKm, formatMeters } from '../../domain/labels';
import type { Route, RouteSlotSafety, Segment } from '../../domain/route';
import { ErrorState } from '../components/ErrorState';
import { FactorList } from '../components/FactorList';
import { SlotSelector } from '../components/SlotSelector';
import { useSlotSelection } from '../hooks/useSlotSelection';

export const SAFETY_DISCLAIMER =
  'El nivel de seguridad es una estimación según los factores registrados. No garantiza seguridad absoluta.';

export interface RouteDetailScreenProps {
  routeId: string;
  /** Time slot window chosen in the catalog ("05:00-07:00"). */
  initialSlotKey?: string | null;
}

/** Route detail: key stats, safety for the selected slot and the segments that explain it. */
export function RouteDetailScreen({ routeId, initialSlotKey }: RouteDetailScreenProps) {
  const route = useRouteDetail(routeId);

  if (route.isPending) return <LoadingView label="Cargando ruta…" />;
  if (route.isError || !route.data) {
    return (
      <Screen scroll>
        {route.isError ? (
          <ErrorState title="No pudimos cargar la ruta" onRetry={() => void route.refetch()} />
        ) : (
          <Callout tone="warning" title="Esta ruta ya no está disponible" />
        )}
      </Screen>
    );
  }

  return <RouteDetail route={route.data} initialSlotKey={initialSlotKey} />;
}

function RouteDetail({ route, initialSlotKey }: { route: Route; initialSlotKey?: string | null }) {
  const { spacing } = useTheme();
  const segments = useRouteSegments(route.id);
  const { slots, slotKey, setSlotKey } = useSlotSelection([route], initialSlotKey);
  const safety = routeSafetyForSlot(route, slotKey);

  return (
    <Screen scroll>
      <AppText variant="title">{route.name}</AppText>
      {route.description ? (
        <AppText color="textMuted" style={{ marginTop: spacing.xs }}>
          {route.description}
        </AppText>
      ) : null}

      <View style={{ gap: spacing.md, marginTop: spacing.lg }}>
        <View style={[styles.row, { gap: spacing.md }]}>
          <StatTile icon="walk-outline" label="Distancia" value={formatKm(route.distanceKm)} />
          <StatTile icon="trending-up-outline" label="Desnivel" value={formatElevation(route.elevationGainM)} />
        </View>
        <View style={[styles.row, { gap: spacing.md }]}>
          <StatTile
            icon="speedometer-outline"
            label="Dificultad"
            value={route.difficulty ? DIFFICULTY_LABELS[route.difficulty] : 'Sin dato'}
          />
          <StatTile
            icon="footsteps-outline"
            label="Superficie"
            value={route.surface ? SURFACE_LABELS[route.surface] : 'Sin dato'}
          />
        </View>
      </View>

      {route.start || route.end ? (
        <Card padding="none" style={{ marginTop: spacing.lg }}>
          {route.start ? <ListItem icon="flag-outline" title="Inicio" subtitle={route.start.label || 'Sin nombre'} /> : null}
          {route.end ? (
            <ListItem icon="location-outline" title="Fin" subtitle={route.end.label || 'Sin nombre'} divider={Boolean(route.start)} />
          ) : null}
        </Card>
      ) : null}

      <SectionHeader title="Seguridad por franja" />
      <SlotSelector slots={slots} value={slotKey} onChange={setSlotKey} />
      <SafetySummary safety={safety} hasSlots={slots.length > 0} />

      <SectionHeader title="Tramos" />
      <SegmentsSection
        route={route}
        slotKey={slotKey}
        segments={segments.data}
        isPending={segments.isPending}
        isError={segments.isError}
        onRetry={() => void segments.refetch()}
      />

      <View style={{ marginTop: spacing.xl }}>
        <Callout tone="info" icon="information-circle-outline" title="Sobre el nivel de seguridad" message={SAFETY_DISCLAIMER} />
      </View>
    </Screen>
  );
}

function SafetySummary({ safety, hasSlots }: { safety: RouteSlotSafety | null; hasSlots: boolean }) {
  const { spacing } = useTheme();

  if (!safety) {
    return (
      <Card>
        <Badge label="Sin evaluar" icon="help-circle-outline" />
        <AppText color="textMuted" style={{ marginTop: spacing.sm }}>
          {hasSlots
            ? 'Esta ruta no tiene una evaluación de seguridad para esta franja.'
            : 'Esta ruta aún no tiene una evaluación de seguridad.'}
        </AppText>
      </Card>
    );
  }

  return (
    <Card elevation="md" padding="lg">
      <SafetyBadge level={safety.level} />
      <AppText variant="label" color="textMuted" style={{ marginTop: spacing.sm }}>
        {`Puntaje ${safety.score} de 100`}
      </AppText>
      {safety.factors.length > 0 ? (
        <>
          <AppText weight="bold" accessibilityRole="header" style={{ marginTop: spacing.lg }}>
            Por qué este nivel
          </AppText>
          <FactorList factors={safety.factors} />
        </>
      ) : (
        <AppText style={{ marginTop: spacing.md }}>No hay factores de riesgo registrados para esta franja</AppText>
      )}
    </Card>
  );
}

interface SegmentsSectionProps {
  route: Route;
  slotKey: string | null;
  segments: Segment[] | undefined;
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
}

function SegmentsSection({ route, slotKey, segments, isPending, isError, onRetry }: SegmentsSectionProps) {
  const { spacing } = useTheme();

  if (isPending) {
    return (
      <View style={{ minHeight: 120 }}>
        <LoadingView label="Cargando tramos…" />
      </View>
    );
  }
  if (isError) return <ErrorState title="No pudimos cargar los tramos" onRetry={onRetry} />;
  if (!segments || segments.length === 0) {
    return <AppText color="textMuted">Esta ruta aún no tiene tramos registrados.</AppText>;
  }

  return (
    <View style={{ gap: spacing.md }}>
      {segments.map((segment, index) => {
        const safety = segmentSafetyForSlot(segment, route, slotKey);
        const points = segment.coordinates.length;
        return (
          <Card key={segment.id}>
            <View style={styles.segmentHeader}>
              <View style={styles.flex}>
                <AppText weight="semibold">{`${index + 1}. ${segment.name}`}</AppText>
                <AppText variant="label" color="textMuted">
                  {`${formatMeters(segment.lengthM)} · ${points} ${points === 1 ? 'punto' : 'puntos'}`}
                </AppText>
              </View>
              {safety ? (
                <SafetyBadge level={safety.level} compact style={{ marginLeft: spacing.sm }} />
              ) : (
                <Badge label="Sin evaluar" style={{ marginLeft: spacing.sm }} />
              )}
            </View>
            {safety && safety.factors.length > 0 ? <FactorList factors={safety.factors} /> : null}
          </Card>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  segmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flex: {
    flex: 1,
  },
});
