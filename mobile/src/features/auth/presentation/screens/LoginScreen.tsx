import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { View } from 'react-native';

import { ControlledTextField } from '@/core/forms/ControlledTextField';
import { useTheme } from '@/core/theme';
import { AppText, Button, FormMessage, Screen } from '@/core/ui';

import { loginSchema, mapAuthError, type LoginFormValues, type LoginInput } from '../../domain';
import { useSignIn } from '../hooks/useAuthMutations';

export interface LoginScreenProps {
  onGoToRegister: () => void;
  onGoToForgotPassword: () => void;
}

/** RF-01-6 */
export function LoginScreen({ onGoToRegister, onGoToForgotPassword }: LoginScreenProps) {
  const { spacing } = useTheme();
  const signIn = useSignIn();
  const { control, handleSubmit } = useForm<LoginFormValues, unknown, LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = () => void handleSubmit((values) => signIn.mutate(values))();

  return (
    <Screen scroll>
      <View style={{ marginTop: spacing.xxxl, marginBottom: spacing.xxl }}>
        <AppText variant="display">RUNCTY</AppText>
        <AppText variant="subtitle" color="textMuted">
          Inicia sesión para continuar
        </AppText>
      </View>

      <FormMessage message={signIn.isError ? mapAuthError(signIn.error) : null} />

      <ControlledTextField
        control={control}
        name="email"
        label="Correo electrónico"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
      />
      <ControlledTextField
        control={control}
        name="password"
        label="Contraseña"
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={onSubmit}
      />

      <Button label="Iniciar sesión" onPress={onSubmit} loading={signIn.isPending} />
      <View style={{ marginTop: spacing.md }}>
        <Button label="¿Olvidaste tu contraseña?" variant="ghost" onPress={onGoToForgotPassword} />
        <Button label="Crear una cuenta" variant="secondary" onPress={onGoToRegister} />
      </View>
    </Screen>
  );
}
