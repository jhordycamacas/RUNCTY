import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';

import { TextField, type TextFieldProps } from '@/core/ui';

export type ControlledTextFieldProps<TValues extends FieldValues, TOutput> = Omit<
  TextFieldProps,
  'value' | 'onChangeText' | 'onBlur' | 'error' | 'ref'
> & {
  control: Control<TValues, unknown, TOutput>;
  name: Path<TValues>;
};

/** TextField bound to react-hook-form; shows the zod message as the field error. */
export function ControlledTextField<TValues extends FieldValues, TOutput>({
  control,
  name,
  ...props
}: ControlledTextFieldProps<TValues, TOutput>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          {...props}
          ref={field.ref}
          value={typeof field.value === 'string' ? field.value : ''}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}
