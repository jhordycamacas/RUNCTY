import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';

import { ControlledTextField } from '@/core/forms/ControlledTextField';
import { Button, Callout, Checkbox, FormMessage, Screen } from '@/core/ui';
import { mapAuthError } from '@/features/auth';

import { deleteAccountSchema, type DeleteAccountFormValues, type DeleteAccountInput } from '../../domain';
import { useDeleteAccount } from '../hooks/useAccount';

const CONFIRM_LABEL = 'Entiendo que esta acción no se puede deshacer';

/**
 * RF-01-4: deletes credentials, profile and preferences. On success the
 * session ends and the app returns to the login screen automatically.
 */
export function DeleteAccountScreen() {
  const remove = useDeleteAccount();
  const { control, handleSubmit } = useForm<DeleteAccountFormValues, unknown, DeleteAccountInput>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: { password: '', confirmed: false },
  });

  const onSubmit = () => void handleSubmit((values) => remove.mutate(values))();

  return (
    <Screen scroll>
      <Callout
        tone="danger"
        icon="warning-outline"
        title="Eliminar tu cuenta es permanente"
        message="Se borrarán tu acceso, tus datos personales, tu perfil deportivo y tus preferencias. No podrás recuperarlos."
      />

      <ControlledTextField
        control={control}
        name="password"
        label="Contraseña actual"
        icon="lock-closed-outline"
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
      <Button
        label="Eliminar mi cuenta"
        variant="danger"
        icon="trash-outline"
        onPress={onSubmit}
        loading={remove.isPending}
      />
    </Screen>
  );
}
