import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { View } from 'react-native';

import { ControlledTextField } from '@/core/forms/ControlledTextField';
import { useTheme } from '@/core/theme';
import { AppText, Button, FormMessage, Screen } from '@/core/ui';

import {
  forgotPasswordSchema,
  mapAuthError,
  type ForgotPasswordFormValues,
  type ForgotPasswordInput,
} from '../../domain';
import { usePasswordReset } from '../hooks/useAuthMutations';

// Neutral on purpose: it must not reveal whether the account exists.
const SENT_MESSAGE =
  'Si existe una cuenta con ese correo, te enviamos un enlace para restablecer tu contraseña. Revisa también tu carpeta de spam.';

/** RF-01-7 */
export function ForgotPasswordScreen({ onBackToLogin }: { onBackToLogin: () => void }) {
  const { spacing } = useTheme();
  const reset = usePasswordReset();
  const { control, handleSubmit } = useForm<ForgotPasswordFormValues, unknown, ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = () => void handleSubmit((values) => reset.mutate(values))();

  return (
    <Screen scroll>
      <AppText color="textMuted" style={{ marginBottom: spacing.xl }}>
        Escribe el correo de tu cuenta y te enviaremos un enlace para crear una nueva contraseña.
      </AppText>

      <FormMessage message={reset.isError ? mapAuthError(reset.error) : null} />
      <FormMessage tone="success" message={reset.isSuccess ? SENT_MESSAGE : null} />

      <ControlledTextField
        control={control}
        name="email"
        label="Correo electrónico"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        returnKeyType="send"
        onSubmitEditing={onSubmit}
      />
      <Button label="Enviar enlace" onPress={onSubmit} loading={reset.isPending} />
      <View style={{ marginTop: spacing.md }}>
        <Button label="Volver a iniciar sesión" variant="ghost" onPress={onBackToLogin} />
      </View>
    </Screen>
  );
}
