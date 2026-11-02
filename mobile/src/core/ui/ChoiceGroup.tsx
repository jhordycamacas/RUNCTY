import { Pressable, StyleSheet, View } from 'react-native';

import { MIN_TOUCH_TARGET, useTheme } from '@/core/theme';

import { AppText } from './AppText';
import { Icon } from './Icon';

export interface ChoiceOption {
  value: string;
  label: string;
  /** Shown but not selectable (e.g. an upcoming option). */
  disabled?: boolean;
}

export interface ChoiceGroupProps {
  label: string;
  options: readonly ChoiceOption[];
  value: readonly string[];
  onChange: (next: string[]) => void;
  /** Multiple selection (checkboxes) instead of a single one (radios). */
  multiple?: boolean;
  error?: string;
  hint?: string;
}

/** Selectable chips: a radio group or a checkbox group. */
export function ChoiceGroup({
  label,
  options,
  value,
  onChange,
  multiple = false,
  error,
  hint,
}: ChoiceGroupProps) {
  const { colors, radii, spacing } = useTheme();

  const toggle = (option: string) => {
    if (!multiple) {
      onChange([option]);
      return;
    }
    onChange(value.includes(option) ? value.filter((v) => v !== option) : [...value, option]);
  };

  return (
    <View
      style={{ marginBottom: spacing.lg }}
      accessibilityRole={multiple ? undefined : 'radiogroup'}
      accessibilityLabel={label}
    >
      <AppText variant="label" weight="medium" style={{ marginBottom: spacing.xs }}>
        {label}
      </AppText>
      <View style={styles.wrap}>
        {options.map((option) => {
          const selected = value.includes(option.value);
          const disabled = Boolean(option.disabled);
          return (
            <Pressable
              key={option.value}
              accessibilityRole={multiple ? 'checkbox' : 'radio'}
              accessibilityLabel={option.label}
              accessibilityState={{ checked: selected, disabled }}
              disabled={disabled}
              onPress={() => toggle(option.value)}
              style={({ pressed }) => [
                styles.chip,
                {
                  borderRadius: radii.pill,
                  borderColor: selected ? colors.primary : colors.border,
                  backgroundColor: selected
                    ? colors.primary
                    : pressed
                      ? colors.primaryTint
                      : colors.surfaceElevated,
                  paddingHorizontal: spacing.lg,
                  marginRight: spacing.sm,
                  marginBottom: spacing.sm,
                  opacity: disabled ? 0.6 : 1,
                },
              ]}
            >
              {selected ? (
                <Icon name="checkmark" size={18} color="onPrimary" style={{ marginRight: spacing.xs }} />
              ) : null}
              <AppText weight="medium" color={selected ? 'onPrimary' : 'text'}>
                {option.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      {error ? (
        <AppText variant="label" color="danger" accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="label" color="textMuted">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    minHeight: MIN_TOUCH_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
});
