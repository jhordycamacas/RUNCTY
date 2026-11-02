import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { ControlledTextField } from '@/core/forms/ControlledTextField';
import { Button, FormMessage, Screen } from '@/core/ui';
import { PASSWORD_HINT, mapAuthError } from '@/features/auth';

import { changePasswordSchema, type ChangePasswordFormValues, type ChangePasswordInput } from '../../domain';
import { useChangePassword } from '../hooks/useAccount';

/** RF-01-3: change the password after confirming the current one. */
export function ChangePasswordScreen() {
  const change = useChangePassword();
  const { control, handleSubmit, reset } = useForm<ChangePasswordFormValues, unknown, ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmNewPassword: '' },
  });

  const onSubmit = () => void handleSubmit((values) => change.mutate(values, { onSuccess: () => reset() }))();

  return (
    <Screen scroll>
      <FormMessage message={change.isError ? mapAuthError(change.error, 'reauthenticate') : null} />
      <FormMessage tone="success" message={change.isSuccess ? 'Tu contraseña se actualizó.' : null} />

      <ControlledTextField
        control={control}
        name="currentPassword"
        label="Contraseña actual"
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
      />
      <ControlledTextField
        control={control}
        name="newPassword"
        label="Nueva contraseña"
        hint={PASSWORD_HINT}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
      />
      <ControlledTextField
        control={control}
        name="confirmNewPassword"
        label="Confirmar nueva contraseña"
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
      />
      <Button label="Cambiar contraseña" onPress={onSubmit} loading={change.isPending} />
    </Screen>
  );
}
