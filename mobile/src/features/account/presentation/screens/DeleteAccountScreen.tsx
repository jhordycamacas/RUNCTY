import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';

import { ControlledTextField } from '@/core/forms/ControlledTextField';
import { useTheme } from '@/core/theme';
import { AppText, Button, Card, Checkbox, FormMessage, Screen } from '@/core/ui';
import { mapAuthError } from '@/features/auth';

import { deleteAccountSchema, type DeleteAccountFormValues, type DeleteAccountInput } from '../../domain';
import { useDeleteAccount } from '../hooks/useAccount';

const CONFIRM_LABEL = 'Entiendo que esta acción no se puede deshacer';

/**
 * RF-01-4: deletes credentials, profile and preferences. On success the
 * session ends and the app returns to the login screen automatically.
 */
export function DeleteAccountScreen() {
  const { spacing } = useTheme();
  const remove = useDeleteAccount();
  const { control, handleSubmit } = useForm<DeleteAccountFormValues, unknown, DeleteAccountInput>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: { password: '', confirmed: false },
  });

  const onSubmit = () => void handleSubmit((values) => remove.mutate(values))();

  return (
    <Screen scroll>
      <Card style={{ marginBottom: spacing.xl }}>
        <AppText weight="bold" color="danger" style={{ marginBottom: spacing.sm }}>
          Eliminar tu cuenta es permanente
        </AppText>
        <AppText>
          Se borrarán tu acceso, tus datos personales, tu perfil deportivo y tus preferencias. No podrás
          recuperarlos.
        </AppText>
      </Card>

      <ControlledTextField
        control={control}
        name="password"
        label="Contraseña actual"
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
      />
      <Controller
        control={control}
        name="confirmed"
        render={({ field, fieldState }) => (
          <Checkbox
            label={CONFIRM_LABEL}
            checked={field.value === true}
            onChange={field.onChange}
            error={fieldState.error?.message}
          />
        )}
      />

      <FormMessage message={remove.isError ? mapAuthError(remove.error, 'reauthenticate') : null} />
      <Button label="Eliminar mi cuenta" onPress={onSubmit} loading={remove.isPending} />
    </Screen>
  );
}
