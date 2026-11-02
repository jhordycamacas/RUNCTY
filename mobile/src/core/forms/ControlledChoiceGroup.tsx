import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';

import { ChoiceGroup, type ChoiceGroupProps } from '@/core/ui';

export type ControlledChoiceGroupProps<TValues extends FieldValues, TOutput> = Omit<
  ChoiceGroupProps,
  'value' | 'onChange' | 'error'
> & {
  control: Control<TValues, unknown, TOutput>;
  name: Path<TValues>;
};

/**
 * ChoiceGroup bound to react-hook-form. Single mode stores a string,
 * multiple mode stores a string array.
 */
export function ControlledChoiceGroup<TValues extends FieldValues, TOutput>({
  control,
  name,
  multiple = false,
  ...props
}: ControlledChoiceGroupProps<TValues, TOutput>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const raw: unknown = field.value;
        const value = Array.isArray(raw) ? raw.map(String) : typeof raw === 'string' && raw ? [raw] : [];
        return (
          <ChoiceGroup
            {...props}
            multiple={multiple}
            value={value}
            onChange={(next) => field.onChange(multiple ? next : (next[0] ?? ''))}
            error={fieldState.error?.message}
          />
        );
      }}
    />
  );
}
