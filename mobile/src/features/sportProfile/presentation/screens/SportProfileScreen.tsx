import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, View } from 'react-native';

import { ControlledChoiceGroup } from '@/core/forms/ControlledChoiceGroup';
import { ControlledTextField } from '@/core/forms/ControlledTextField';
import { useTheme } from '@/core/theme';
import { AppText, Button, Card, FormMessage, LoadingView, Screen } from '@/core/ui';
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
  type SportProfile,
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
          onPress: () => remove.mutate(undefined, { onSuccess: () => setNotice('Perfil deportivo eliminado.') }),
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
  profile: SportProfile;
  notice: string | null;
  error: string | null;
  deleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

function SportProfileSummary({ profile, notice, error, deleting, onEdit, onDelete }: SummaryProps) {
  const { spacing } = useTheme();
  const rows: [string, string][] = [
    ['Nivel', SPORT_LEVEL_LABELS[profile.level]],
    ['Objetivos', profile.goals.map((g) => SPORT_GOAL_LABELS[g]).join(', ')],
    ['Ritmo habitual', `${formatPace(profile.usualPaceSecPerKm)} min/km`],
    ['Distancia preferida', `${profile.preferredDistanceKm} km`],
  ];

  return (
    <Screen scroll>
      <FormMessage tone="success" message={notice} />
      <FormMessage message={error} />
      <Card style={{ marginBottom: spacing.xl }}>
        {rows.map(([label, value]) => (
          <View key={label} style={{ marginBottom: spacing.md }}>
            <AppText variant="label" color="textMuted">
              {label}
            </AppText>
            <AppText weight="medium">{value}</AppText>
          </View>
        ))}
      </Card>
      <View style={{ marginBottom: spacing.md }}>
        <Button label="Editar perfil deportivo" onPress={onEdit} />
      </View>
      <Button label="Eliminar perfil deportivo" variant="ghost" onPress={onDelete} loading={deleting} />
    </Screen>
  );
}

interface FormProps {
  initial: SportProfile | null;
  saving: boolean;
  error: string | null;
  onSubmit: (profile: SportProfile) => void;
  onCancel?: () => void;
}

function SportProfileForm({ initial, saving, error, onSubmit, onCancel }: FormProps) {
  const { spacing } = useTheme();
  const { control, handleSubmit } = useForm<SportProfileFormValues, unknown, SportProfile>({
    resolver: zodResolver(sportProfileFormSchema),
    defaultValues: initial ? toSportProfileForm(initial) : EMPTY_SPORT_PROFILE_FORM,
  });

  const submit = () => void handleSubmit(onSubmit)();

  return (
    <Screen scroll>
      {!initial ? (
        <AppText color="textMuted" style={{ marginBottom: spacing.xl }}>
          Aún no tienes perfil deportivo. Cuéntanos cómo corres para recomendarte mejores rutas.
        </AppText>
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
        placeholder="6:30"
        hint="Formato minutos:segundos por kilómetro."
        keyboardType="numbers-and-punctuation"
        maxLength={5}
      />
      <ControlledTextField
        control={control}
        name="distance"
        label="Distancia preferida (km)"
        placeholder="10"
        keyboardType="decimal-pad"
        maxLength={5}
      />

      <FormMessage message={error} />
      <Button label="Guardar perfil deportivo" onPress={submit} loading={saving} />
      {onCancel ? (
        <View style={{ marginTop: spacing.md }}>
          <Button label="Cancelar" variant="ghost" onPress={onCancel} />
        </View>
      ) : null}
    </Screen>
  );
}
