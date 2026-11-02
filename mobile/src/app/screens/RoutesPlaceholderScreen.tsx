import { EmptyState, Screen, ScreenHeader } from '@/core/ui';

/** Rutas tab placeholder until the routes catalog (T5) lands. */
export function RoutesPlaceholderScreen() {
  return (
    <Screen scroll>
      <ScreenHeader title="Rutas" subtitle="Recorridos de tu ciudad con su nivel de seguridad" />
      <EmptyState
        icon="map-outline"
        title="Muy pronto"
        description="Pronto verás aquí las rutas recomendadas de tu ciudad"
      />
    </Screen>
  );
}
