import type { Control, FieldValues, Path } from 'react-hook-form';
import { View } from 'react-native';

import { ControlledChoiceGroup } from '@/core/forms/ControlledChoiceGroup';
import { useTheme } from '@/core/theme';
import { AppText, Button } from '@/core/ui';
import { useActiveCities } from '@/features/cities/application/useActiveCities';

export interface CityFieldProps<TValues extends FieldValues, TOutput> {
  control: Control<TValues, unknown, TOutput>;
  name: Path<TValues>;
}

/** City picker fed by the active cities catalog (shared with profile editing). */
export function CityField<TValues extends FieldValues, TOutput>({ control, name }: CityFieldProps<TValues, TOutput>) {
  const { spacing } = useTheme();
  const cities = useActiveCities();

  if (cities.isPending) {
    return (
      <AppText color="textMuted" style={{ marginBottom: spacing.lg }}>
        Cargando ciudades…
      </AppText>
    );
  }

  if (cities.isError) {
    return (
      <View style={{ marginBottom: spacing.lg }}>
        <AppText color="danger" style={{ marginBottom: spacing.sm }}>
          No pudimos cargar las ciudades.
        </AppText>
        <Button label="Reintentar" variant="secondary" onPress={() => cities.refetch()} />
      </View>
    );
  }

  return (
    <ControlledChoiceGroup
      control={control}
      name={name}
      label="Ciudad"
      options={cities.data.map((c) => ({ value: c.id, label: c.name }))}
      hint={cities.data.length === 0 ? 'Aún no hay ciudades disponibles.' : undefined}
    />
  );
}
