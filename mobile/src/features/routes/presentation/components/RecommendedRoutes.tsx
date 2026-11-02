import { useMemo } from 'react';
import { View } from 'react-native';

import { useTheme } from '@/core/theme';
import { AppText, Card, EmptyState, LoadingView } from '@/core/ui';

import { useCityRoutes } from '../../application/useRoutes';
import { sortRoutesForSlot } from '../../domain/catalog';
import type { Route } from '../../domain/route';
import { useRunnerCity } from '../hooks/useRunnerCity';
import { useSlotSelection } from '../hooks/useSlotSelection';
import { RouteCard } from './RouteCard';

export interface RecommendedRoutesProps {
  onOpenRoute: (routeId: string, slotKey: string | null) => void;
  /** How many routes to show. */
  limit?: number;
}

const NO_ROUTES: Route[] = [];

/** Home section: the safest routes of the runner's city for the current or next slot. */
export function RecommendedRoutes({ onOpenRoute, limit = 3 }: RecommendedRoutesProps) {
  const { spacing } = useTheme();
  const city = useRunnerCity();
  const routes = useCityRoutes(city.cityId);
  const all = (city.cityId ? routes.data : undefined) ?? NO_ROUTES;
  const { slots, slotKey } = useSlotSelection(all);
  const top = useMemo(() => sortRoutesForSlot(all, slotKey).slice(0, limit), [all, slotKey, limit]);
  const slotLabel = slots.find((slot) => slot.key === slotKey)?.label;

  if (city.isLoading || (city.cityId && routes.isPending)) {
    return (
      <View style={{ minHeight: 120 }}>
        <LoadingView label="Cargando rutas…" />
      </View>
    );
  }

  if (top.length === 0) {
    return (
      <Card padding="sm">
        <EmptyState
          icon="trail-sign-outline"
          title="Aún no hay rutas"
          description="Pronto verás aquí las rutas recomendadas de tu ciudad con su nivel de seguridad por horario."
        />
      </Card>
    );
  }

  return (
    <View>
      {slotLabel ? (
        <AppText variant="label" color="textMuted" style={{ marginBottom: spacing.sm }}>
          {`Nivel de seguridad para la franja de ${slotLabel}`}
        </AppText>
      ) : null}
      {top.map((route) => (
        <RouteCard key={route.id} route={route} slotKey={slotKey} onPress={() => onOpenRoute(route.id, slotKey)} />
      ))}
    </View>
  );
}
