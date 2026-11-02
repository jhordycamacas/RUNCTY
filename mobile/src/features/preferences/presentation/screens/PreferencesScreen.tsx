import { useState } from 'react';
import { Alert, View } from 'react-native';

import { useTheme } from '@/core/theme';
import { AppText, Button, Card, ChoiceGroup, FormMessage, LoadingView, Screen, SwitchRow } from '@/core/ui';
import { mapAuthError, useSignedInUser } from '@/features/auth';

import {
  APPEARANCES,
  APPEARANCE_LABELS,
  FONT_SCALES,
  FONT_SCALE_LABELS,
  LOCATION_PRIVACY_LABELS,
  LOCATION_PRIVACY_OPTIONS,
  UNIT_SYSTEMS,
  UNIT_SYSTEM_LABELS,
  fontScaleMultiplier,
  type NotificationPreferences,
  type Preferences,
} from '../../domain';
import { usePreferences, useResetPreferences, useSavePreferences } from '../hooks/usePreferences';

const LANGUAGE_OPTIONS = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English (próximamente)', disabled: true },
];

function optionsOf<T extends string>(values: readonly T[], labels: Record<T, string>) {
  return values.map((value) => ({ value, label: labels[value] }));
}

/** Maps a single-choice selection back to its enum value. */
function single<T extends string>(values: readonly T[], next: string[]): T | undefined {
  return values.find((v) => v === next[0]);
}

/** RF-01-13..16: create, view, update and reset the preferences. */
export function PreferencesScreen() {
  const user = useSignedInUser();
  const query = usePreferences(user.uid);
  const save = useSavePreferences(user.uid);
  const reset = useResetPreferences(user.uid);
  const [notice, setNotice] = useState<string | null>(null);

  if (query.isPending) return <LoadingView label="Cargando tus preferencias…" />;

  if (query.isError) {
    return (
      <Screen>
        <FormMessage message={mapAuthError(query.error)} />
        <Button label="Reintentar" onPress={() => void query.refetch()} />
      </Screen>
    );
  }

  const confirmReset = () =>
    Alert.alert(
      'Restablecer preferencias',
      'Se aplicarán los valores predeterminados de idioma, letra, apariencia, unidades, notificaciones y ubicación.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restablecer',
          style: 'destructive',
          onPress: () =>
            reset.mutate(undefined, { onSuccess: () => setNotice('Se restablecieron los valores predeterminados.') }),
        },
      ],
    );

  const mutationError = save.isError ? save.error : reset.isError ? reset.error : null;

  return (
    <PreferencesForm
      // Remount with fresh values after a save or a reset.
      key={query.dataUpdatedAt}
      initial={query.data}
      notice={notice}
      error={mutationError ? mapAuthError(mutationError) : null}
      saving={save.isPending}
      resetting={reset.isPending}
      onChange={() => setNotice(null)}
      onSave={(preferences) => save.mutate(preferences, { onSuccess: () => setNotice('Preferencias guardadas.') })}
      onReset={confirmReset}
    />
  );
}

interface FormProps {
  initial: Preferences;
  notice: string | null;
  error: string | null;
  saving: boolean;
  resetting: boolean;
  onChange: () => void;
  onSave: (preferences: Preferences) => void;
  onReset: () => void;
}

function PreferencesForm({ initial, notice, error, saving, resetting, onChange, onSave, onReset }: FormProps) {
  const { spacing, typography } = useTheme();
  const [draft, setDraft] = useState<Preferences>(initial);

  const update = (patch: Partial<Preferences>) => {
    onChange();
    setDraft((current) => ({ ...current, ...patch }));
  };
  const updateNotifications = (patch: Partial<NotificationPreferences>) =>
    update({ notifications: { ...draft.notifications, ...patch } });

  const previewSize = typography.sizes.body * fontScaleMultiplier(draft.fontScale);
  const sectionTitle = { marginBottom: spacing.sm };

  return (
    <Screen scroll>
      <ChoiceGroup
        label="Idioma"
        options={LANGUAGE_OPTIONS}
        value={[draft.language]}
        onChange={() => undefined}
        hint="Por ahora RUNCTY está disponible solo en español."
      />

      <ChoiceGroup
        label="Tamaño de letra"
        options={optionsOf(FONT_SCALES, FONT_SCALE_LABELS)}
        value={[draft.fontScale]}
        onChange={(next) => update({ fontScale: single(FONT_SCALES, next) ?? draft.fontScale })}
      />
      <Card style={{ marginBottom: spacing.xl }}>
        <AppText variant="label" color="textMuted">
          Vista previa
        </AppText>
        <AppText style={{ fontSize: previewSize, lineHeight: Math.round(previewSize * 1.35) }}>
          Así se verá el texto en RUNCTY.
        </AppText>
      </Card>

      <ChoiceGroup
        label="Apariencia"
        options={optionsOf(APPEARANCES, APPEARANCE_LABELS)}
        value={[draft.appearance]}
        onChange={(next) => update({ appearance: single(APPEARANCES, next) ?? draft.appearance })}
      />

      <ChoiceGroup
        label="Unidades de distancia"
        options={optionsOf(UNIT_SYSTEMS, UNIT_SYSTEM_LABELS)}
        value={[draft.units]}
        onChange={(next) => update({ units: single(UNIT_SYSTEMS, next) ?? draft.units })}
      />

      <View style={{ marginBottom: spacing.lg }}>
        <AppText variant="label" weight="medium" accessibilityRole="header" style={sectionTitle}>
          Notificaciones
        </AppText>
        <SwitchRow
          label="Recibir notificaciones"
          value={draft.notifications.enabled}
          onChange={(enabled) => updateNotifications({ enabled })}
        />
        <SwitchRow
          label="Alertas de seguridad"
          value={draft.notifications.safetyAlerts}
          disabled={!draft.notifications.enabled}
          onChange={(safetyAlerts) => updateNotifications({ safetyAlerts })}
        />
        <SwitchRow
          label="Eventos"
          value={draft.notifications.events}
          disabled={!draft.notifications.enabled}
          onChange={(events) => updateNotifications({ events })}
        />
      </View>

      <ChoiceGroup
        label="Privacidad de ubicación"
        options={optionsOf(LOCATION_PRIVACY_OPTIONS, LOCATION_PRIVACY_LABELS)}
        value={[draft.locationPrivacy]}
        onChange={(next) =>
          update({ locationPrivacy: single(LOCATION_PRIVACY_OPTIONS, next) ?? draft.locationPrivacy })
        }
        hint="Decide quién puede ver tu ubicación."
      />

      <FormMessage tone="success" message={notice} />
      <FormMessage message={error} />
      <View style={{ marginBottom: spacing.md }}>
        <Button label="Guardar preferencias" onPress={() => onSave(draft)} loading={saving} disabled={resetting} />
      </View>
      <Button
        label="Restablecer valores predeterminados"
        variant="ghost"
        onPress={onReset}
        loading={resetting}
        disabled={saving}
      />
    </Screen>
  );
}
