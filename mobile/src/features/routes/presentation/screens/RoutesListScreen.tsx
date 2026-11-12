import { useMemo, useState, type ReactElement } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/core/theme';
import { ChoiceGroup, EmptyState, LoadingView, ScreenHeader } from '@/core/ui';

import { useCityRoutes } from '../../application/useRoutes';
import {
  DEFAULT_FILTERS,
  DISTANCE_BUCKET_LABELS,
  filterRoutes,
  sortRoutesForSlot,
  type DifficultyFilter,
  type DistanceBucket,
  type RouteFilters,
} from '../../domain/catalog';
import { DIFFICULTY_LABELS } from '../../domain/labels';
import { DIFFICULTIES, type Ruta } from '../../domain/route';
import { ErrorState } from '../components/ErrorState';
import { RouteCard } from '../components/RouteCard';
import { SlotSelector } from '../components/SlotSelector';
import { useRunnerCity } from '../hooks/useRunnerCity';
import { useSlotSelection } from '../hooks/useSlotSelection';

export interface RoutesListScreenProps {
  /** Opens a route showing the given time slot window. */
  onOpenRoute: (routeId: string, slotKey: string | null) => void;
  onCompleteProfile: () => void;
}

const DISTANCE_OPTIONS = (Object.keys(DISTANCE_BUCKET_LABELS) as DistanceBucket[]).map((value) => ({
  value,
  label: DISTANCE_BUCKET_LABELS[value],
}));

const DIFFICULTY_OPTIONS = [
  { value: 'all', label: 'Todas' },
  ...DIFFICULTIES.map((value) => ({ value, label: DIFFICULTY_LABELS[value] })),
];

const NO_ROUTES: Ruta[] = [];

/** Rutas tab: the active routes of the runner's city with their safety per time slot. */
export function RoutesListScreen({ onOpenRoute, onCompleteProfile }: RoutesListScreenProps) {
  const { colors, spacing } = useTheme();
  const city = useRunnerCity();
  const routes = useCityRoutes(city.cityId);
  const all = (city.cityId ? routes.data : undefined) ?? NO_ROUTES;
  const { slots, slotKey, setSlotKey } = useSlotSelection(all);
  const [filters, setFilters] = useState<RouteFilters>(DEFAULT_FILTERS);

  const visible = useMemo(() => sortRoutesForSlot(filterRoutes(all, filters), slotKey), [all, filters, slotKey]);

  const header = (
    <View>
      <ScreenHeader title="Rutas" subtitle={city.cityName ?? 'Recorridos de tu ciudad'} />
      {all.length > 0 ? (
        <>
          <SlotSelector slots={slots} value={slotKey} onChange={setSlotKey} />
          <ChoiceGroup
            label="Distancia"
            options={DISTANCE_OPTIONS}
            value={[filters.distance]}
            onChange={([distance]) => setFilters((f) => ({ ...f, distance: distance as DistanceBucket }))}
          />
          <ChoiceGroup
            label="Dificultad"
            options={DIFFICULTY_OPTIONS}
            value={[filters.difficulty]}
            onChange={([difficulty]) => setFilters((f) => ({ ...f, difficulty: difficulty as DifficultyFilter }))}
          />
        </>
      ) : null}
    </View>
  );

  let empty: ReactElement | null = null;
  if (city.isLoading || (city.cityId && routes.isPending)) {
    empty = (
      <View style={{ minHeight: 160 }}>
        <LoadingView label="Cargando rutas…" />
      </View>
    );
  } else if (city.isError) {
    empty = <ErrorState title="No pudimos cargar tu perfil" onRetry={city.refetch} />;
  } else if (!city.cityId) {
    empty = (
      <EmptyState
        icon="location-outline"
        title="Elige tu ciudad"
        description="Completa tu perfil con tu ciudad para ver sus rutas y su nivel de seguridad por horario."
        action={{ label: 'Completar perfil', onPress: onCompleteProfile }}
      />
    );
  } else if (routes.isError) {
    empty = <ErrorState title="No pudimos cargar las rutas" onRetry={() => void routes.refetch()} />;
  } else if (all.length === 0) {
    empty = (
      <EmptyState
        icon="trail-sign-outline"
        title={`Aún no hay rutas en ${city.cityName ?? 'tu ciudad'}`}
        description="Pronto verás aquí las rutas de tu ciudad con su nivel de seguridad por horario."
      />
    );
  } else {
    empty = (
      <EmptyState
        icon="filter-outline"
        title="Ninguna ruta coincide con los filtros"
        description="Prueba con otra distancia o dificultad."
        action={{ label: 'Quitar filtros', onPress: () => setFilters(DEFAULT_FILTERS) }}
      />
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.flex, { backgroundColor: colors.background }]}>
      <FlatList
        data={visible}
        keyExtractor={(route) => route.id}
        renderItem={({ item }) => (
          <RouteCard route={item} slotKey={slotKey} onPress={() => onOpenRoute(item.id, slotKey)} />
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        contentContainerStyle={{ padding: spacing.xl }}
        refreshControl={
          city.cityId ? (
            <RefreshControl
              refreshing={routes.isRefetching}
              onRefresh={() => void routes.refetch()}
              colors={[colors.primary]}
              tintColor={colors.primaryText}
            />
          ) : undefined
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
