import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, StyleSheet, View } from 'react-native';

import { ControlledChoiceGroup } from '@/core/forms/ControlledChoiceGroup';
import { ControlledTextField } from '@/core/forms/ControlledTextField';
import { useTheme } from '@/core/theme';
import { AppText, Badge, Button, Callout, Card, FormMessage, LoadingView, Screen, StatTile } from '@/core/ui';
import { mapAuthError, useSignedInUser } from '@/features/auth';

import {
  EMPTY_SPORT_PROFILE_FORM,
  SPORT_GOALS,
  SPORT_GOAL_LABELS,
  SPORT_LEVELS,
  SPORT_LEVEL_LABELS,
  formatPace,
  sportProfileFormSchema,
  toSportProfileForm,
  type PerfilDeportivo,
  type SportProfileFormValues,
} from '../../domain/sportProfile';
import { useDeleteSportProfile, useSaveSportProfile, useSportProfile } from '../hooks/useSportProfile';

const LEVEL_OPTIONS = SPORT_LEVELS.map((value) => ({ value, label: SPORT_LEVEL_LABELS[value] }));
const GOAL_OPTIONS = SPORT_GOALS.map((value) => ({ value, label: SPORT_GOAL_LABELS[value] }));

/** RF-01-9..12: create, read, update and delete the sport profile. */
export function SportProfileScreen() {
  const user = useSignedInUser();
  const query = useSportProfile(user.uid);
  const save = useSaveSportProfile(user.uid);
  const remove = useDeleteSportProfile(user.uid);
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  if (query.isPending) return <LoadingView label="Cargando tu perfil deportivo…" />;

  const profile = query.data ?? null;

  const confirmDelete = () =>
    Alert.alert(
      'Eliminar perfil deportivo',
      'Se borrarán tu nivel, objetivos, ritmo y distancia preferida. Tu cuenta no se verá afectada.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () =>
            remove.mutate(undefined, { onSuccess: () => setNotice('Perfil deportivo eliminado.') }),
        },
      ],
    );

  const error = query.isError ? query.error : remove.isError ? remove.error : null;

  if (!profile || editing) {
    return (
      <SportProfileForm
        initial={profile}
        saving={save.isPending}
        error={save.isError ? mapAuthError(save.error) : null}
        onCancel={profile ? () => setEditing(false) : undefined}
        onSubmit={(values) =>
          save.mutate(values, {
            onSuccess: () => {
              setEditing(false);
              setNotice('Perfil deportivo guardado.');
            },
          })
        }
      />
    );
  }

  return (
    <SportProfileSummary
      profile={profile}
      notice={notice}
      error={error ? mapAuthError(error) : null}
      deleting={remove.isPending}
      onEdit={() => {
        setNotice(null);
        setEditing(true);
      }}
      onDelete={confirmDelete}
    />
  );
}

interface SummaryProps {
  profile: PerfilDeportivo;
  notice: string | null;
  error: string | null;
  deleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

function SportProfileSummary({ profile, notice, error, deleting, onEdit, onDelete }: SummaryProps) {
  const { spacing } = useTheme();
  const label = { marginBottom: spacing.sm };

  return (
    <Screen scroll>
      <FormMessage tone="success" message={notice} />
      <FormMessage message={error} />

      <View style={[styles.stats, { gap: spacing.md, marginBottom: spacing.lg }]}>
        <StatTile
          icon="speedometer-outline"
          value={`${formatPace(profile.usualPaceSecPerKm)} min/km`}
          label="Ritmo habitual"
        />
        <StatTile
          icon="flag-outline"
          value={`${profile.preferredDistanceKm} km`}
          label="Distancia preferida"
        />
      </View>

      <Card style={{ marginBottom: spacing.xl }}>
        <AppText variant="label" color="textMuted" style={label}>
          Nivel
        </AppText>
        <Badge label={SPORT_LEVEL_LABELS[profile.level]} tone="primary" icon="podium-outline" />
        <AppText variant="label" color="textMuted" style={[label, { marginTop: spacing.lg }]}>
          Objetivos
        </AppText>
        <View style={[styles.badges, { gap: spacing.sm }]}>
          {profile.goals.map((goal) => (
            <Badge key={goal} label={SPORT_GOAL_LABELS[goal]} tone="neutral" />
          ))}
        </View>
      </Card>

      <View style={{ marginBottom: spacing.md }}>
        <Button label="Editar perfil deportivo" icon="create-outline" onPress={onEdit} />
      </View>
      <Button
        label="Eliminar perfil deportivo"
        variant="danger"
        icon="trash-outline"
        onPress={onDelete}
        loading={deleting}
      />
    </Screen>
  );
}

interface FormProps {
  initial: PerfilDeportivo | null;
  saving: boolean;
  error: string | null;
  onSubmit: (profile: PerfilDeportivo) => void;
  onCancel?: () => void;
}

function SportProfileForm({ initial, saving, error, onSubmit, onCancel }: FormProps) {
  const { spacing } = useTheme();
  const { control, handleSubmit } = useForm<SportProfileFormValues, unknown, PerfilDeportivo>({
    resolver: zodResolver(sportProfileFormSchema),
    defaultValues: initial ? toSportProfileForm(initial) : EMPTY_SPORT_PROFILE_FORM,
  });

  const submit = () => void handleSubmit(onSubmit)();

  return (
    <Screen scroll>
      {!initial ? (
        <Callout
          tone="info"
          icon="fitness-outline"
          title="Crea tu perfil deportivo"
          message="Cuéntanos cómo corres para recomendarte mejores rutas."
        />
      ) : null}

      <ControlledChoiceGroup control={control} name="level" label="Nivel" options={LEVEL_OPTIONS} />
      <ControlledChoiceGroup
        control={control}
        name="goals"
        label="Objetivos"
        multiple
        options={GOAL_OPTIONS}
        hint="Puedes elegir varios."
      />
      <ControlledTextField
        control={control}
        name="pace"
        label="Ritmo habitual (min/km)"
        icon="speedometer-outline"
        placeholder="6:30"
        hint="Formato minutos:segundos por kilómetro."
        keyboardType="numbers-and-punctuation"
        maxLength={5}
      />
      <ControlledTextField
        control={control}
        name="distance"
        label="Distancia preferida (km)"
        icon="flag-outline"
        placeholder="10"
        keyboardType="decimal-pad"
        maxLength={5}
      />

      <FormMessage message={error} />
      <Button label="Guardar perfil deportivo" icon="checkmark" onPress={submit} loading={saving} />
      {onCancel ? (
        <View style={{ marginTop: spacing.md }}>
          <Button label="Cancelar" variant="ghost" onPress={onCancel} />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  stats: {
    flexDirection: 'row',
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
