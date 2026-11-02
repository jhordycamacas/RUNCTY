import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { ControlledTextField } from '@/core/forms/ControlledTextField';
import { useTheme } from '@/core/theme';
import { AppText, Button, FormMessage, Screen } from '@/core/ui';

import { loginSchema, mapAuthError, type LoginFormValues, type LoginInput } from '../../domain';
import { AuthHeader } from '../components/AuthHeader';
import { useSignIn } from '../hooks/useAuthMutations';

export interface LoginScreenProps {
  onGoToRegister: () => void;
  onGoToForgotPassword: () => void;
}

/** RF-01-6 */
export function LoginScreen({ onGoToRegister, onGoToForgotPassword }: LoginScreenProps) {
  const { colors, spacing } = useTheme();
  const signIn = useSignIn();
  const { control, handleSubmit } = useForm<LoginFormValues, unknown, LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = () => void handleSubmit((values) => signIn.mutate(values))();

  return (
    <Screen scroll>
      <AuthHeader message="Inicia sesión para continuar" />

      <FormMessage message={signIn.isError ? mapAuthError(signIn.error) : null} />

      <ControlledTextField
        control={control}
        name="email"
        label="Correo electrónico"
        icon="mail-outline"
        placeholder="tucorreo@ejemplo.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
      />
      <ControlledTextField
        control={control}
        name="password"
        label="Contraseña"
        icon="lock-closed-outline"
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={onSubmit}
      />
      <View style={[styles.forgot, { marginTop: -spacing.sm, marginBottom: spacing.md }]}>
        <Button
          label="¿Olvidaste tu contraseña?"
          variant="ghost"
          fullWidth={false}
          onPress={onGoToForgotPassword}
        />
      </View>

      <Button label="Iniciar sesión" icon="log-in-outline" onPress={onSubmit} loading={signIn.isPending} />

      <View style={[styles.divider, { marginVertical: spacing.xl }]}>
        <View style={[styles.line, { backgroundColor: colors.border }]} />
        <AppText variant="label" color="textMuted" style={{ marginHorizontal: spacing.md }}>
          ¿No tienes cuenta?
        </AppText>
        <View style={[styles.line, { backgroundColor: colors.border }]} />
      </View>
      <Button
        label="Crear una cuenta"
        variant="secondary"
        icon="person-add-outline"
        onPress={onGoToRegister}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  forgot: {
    // The wrapper hugs the button and sits on the right.
    alignSelf: 'flex-end',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
});
