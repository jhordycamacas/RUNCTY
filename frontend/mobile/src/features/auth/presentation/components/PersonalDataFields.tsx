import type { Control } from 'react-hook-form';

import { ControlledTextField } from '@/core/forms/ControlledTextField';

import type { PersonalDataInput } from '../../domain';
import { CityField } from './CityField';

/**
 * Personal data inputs shared by sign-up (RF-01-1) and profile editing
 * (RF-01-3). Any form whose values include the personal data fields works.
 */
export function PersonalDataFields<TValues extends PersonalDataInput, TOutput>({
  control,
}: {
  control: Control<TValues, unknown, TOutput>;
}) {
  // The generic form is narrowed to the shared personal-data fields.
  const shared = control as unknown as Control<PersonalDataInput, unknown, TOutput>;
  return (
    <>
      <ControlledTextField
        control={shared}
        name="firstName"
        label="Nombres"
        icon="person-outline"
        autoComplete="given-name"
      />
      <ControlledTextField
        control={shared}
        name="lastName"
        label="Apellidos"
        icon="person-outline"
        autoComplete="family-name"
      />
      <ControlledTextField
        control={shared}
        name="birthDate"
        label="Fecha de nacimiento"
        icon="calendar-outline"
        placeholder="AAAA-MM-DD"
        hint="Ejemplo: 1995-04-12"
        keyboardType="numbers-and-punctuation"
        autoComplete="birthdate-full"
        maxLength={10}
      />
      <CityField control={shared} name="cityId" />
      <ControlledTextField
        control={shared}
        name="idNumber"
        label="Cédula (opcional)"
        icon="card-outline"
        hint="10 dígitos. Puedes dejarlo vacío."
        keyboardType="number-pad"
        maxLength={10}
      />
    </>
  );
}
