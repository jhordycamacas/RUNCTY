import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';

import { ControlledTextField } from '@/core/forms/ControlledTextField';
import { useTheme } from '@/core/theme';
import { AppText, Button, Card, Checkbox, FormMessage, Screen, SectionHeader } from '@/core/ui';

import {
  PASSWORD_HINT,
  mapAuthError,
  registerSchema,
  type RegisterFormValues,
  type RegisterInput,
} from '../../domain';
import { AuthHeader } from '../components/AuthHeader';
import { PersonalDataFields } from '../components/PersonalDataFields';
import { useRegister } from '../hooks/useAuthMutations';

const LOPDP_LABEL = 'Acepto el tratamiento de mis datos personales';
const LOPDP_TEXT =
  'RUNCTY usará tus datos (nombre, correo, fecha de nacimiento, ciudad y, si lo indicas, tu cédula) solo para ' +
  'gestionar tu cuenta y ofrecerte rutas más seguras, conforme a la Ley Orgánica de Protección de Datos ' +
  'Personales del Ecuador. Puedes actualizarlos o eliminar tu cuenta en cualquier momento desde tu perfil.';

const defaultValues: RegisterFormValues = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  birthDate: '',
  cityId: '',
  idNumber: '',
  acceptsLopdp: false,
};

/** RF-01-1 */
export function RegisterScreen({ onGoToLogin }: { onGoToLogin: () => void }) {
  const { colors, spacing } = useTheme();
  const register = useRegister();
  const { control, handleSubmit } = useForm<RegisterFormValues, unknown, RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues,
  });

  const onSubmit = () => void handleSubmit((values) => register.mutate(values))();

  return (
    <Screen scroll>
      <AuthHeader compact message="Completa tus datos para crear tu cuenta de corredor." />

      <SectionHeader title="Tus datos" />
      <PersonalDataFields control={control} />

      <SectionHeader title="Acceso" />
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
        hint={PASSWORD_HINT}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
      />
      <ControlledTextField
        control={control}
        name="confirmPassword"
        label="Confirmar contraseña"
        icon="lock-closed-outline"
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
      />

      <SectionHeader title="Privacidad" />
      <Card
        padding="md"
        elevation="none"
        style={{ backgroundColor: colors.surface, marginBottom: spacing.md }}
      >
        <AppText variant="label" color="textMuted">
          {LOPDP_TEXT}
        </AppText>
      </Card>
      <Controller
        control={control}
        name="acceptsLopdp"
        render={({ field, fieldState }) => (
          <Checkbox
            label={LOPDP_LABEL}
            checked={field.value === true}
            onChange={field.onChange}
            error={fieldState.error?.message}
          />
        )}
      />

      <FormMessage message={register.isError ? mapAuthError(register.error) : null} />

      <Button
        label="Crear cuenta"
        icon="person-add-outline"
        onPress={onSubmit}
        loading={register.isPending}
      />
      <View style={{ marginTop: spacing.md }}>
        <Button label="Ya tengo una cuenta" variant="ghost" onPress={onGoToLogin} />
      </View>
    </Screen>
  );
}
