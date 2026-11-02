import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { useTheme } from '@/core/theme';
import { Button, Card, FormMessage, ListItem, LoadingView, Screen, SectionHeader } from '@/core/ui';
import {
  PersonalDataFields,
  mapAuthError,
  personalDataSchema,
  useSignedInUser,
  type PersonalData,
  type PersonalDataInput,
} from '@/features/auth';

import type { UserProfile } from '../../domain';
import { useProfile, useUpdatePersonalData } from '../hooks/useAccount';

/** RF-01-3: edit personal data. The email cannot be changed. */
export function EditPersonalDataScreen({ onDone }: { onDone: () => void }) {
  const user = useSignedInUser();
  const profile = useProfile(user.uid);

  if (profile.isPending) return <LoadingView />;
  if (!profile.data) {
    return (
      <Screen>
        <FormMessage message={profile.isError ? mapAuthError(profile.error) : 'No encontramos tu perfil.'} />
      </Screen>
    );
  }
  return <EditPersonalDataForm profile={profile.data} onDone={onDone} />;
}

function EditPersonalDataForm({ profile, onDone }: { profile: UserProfile; onDone: () => void }) {
  const { spacing } = useTheme();
  const update = useUpdatePersonalData(profile.uid);
  const { control, handleSubmit } = useForm<PersonalDataInput, unknown, PersonalData>({
    resolver: zodResolver(personalDataSchema),
    defaultValues: {
      firstName: profile.firstName,
      lastName: profile.lastName,
      birthDate: profile.birthDate,
      cityId: profile.cityId,
      idNumber: profile.idNumber ?? '',
    },
  });

  const onSubmit = () => void handleSubmit((values) => update.mutate(values, { onSuccess: onDone }))();

  return (
    <Screen scroll>
      <Card padding="none" style={{ marginBottom: spacing.sm }}>
        <ListItem icon="mail-outline" title={profile.email} subtitle="Tu correo no se puede cambiar" />
      </Card>

      <SectionHeader title="Datos personales" />
      <PersonalDataFields control={control} />

      <FormMessage message={update.isError ? mapAuthError(update.error) : null} />
      <Button label="Guardar cambios" icon="checkmark" onPress={onSubmit} loading={update.isPending} />
    </Screen>
  );
}
