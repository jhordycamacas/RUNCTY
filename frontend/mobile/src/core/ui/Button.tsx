import { ActivityIndicator, Pressable, StyleSheet, View, type PressableProps } from 'react-native';

import { MIN_TOUCH_TARGET, useTheme } from '@/core/theme';

import { AppText, type TextColor } from './AppText';
import { Icon, type IconName } from './Icon';

/** `danger` is an outlined destructive action (never a filled red block). */
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
  fullWidth?: boolean;
  /** Optional leading icon; decorative, the label stays the accessible name. */
  icon?: IconName;
}

const TEXT_COLOR: Record<ButtonVariant, TextColor> = {
  primary: 'onPrimary',
  secondary: 'primaryText',
  ghost: 'primaryText',
  danger: 'danger',
};

export function Button({
  label,
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = true,
  icon,
  ...rest
}: ButtonProps) {
  const { colors, radii, spacing, elevation } = useTheme();
  const isDisabled = Boolean(disabled) || loading;
  const isPrimary = variant === 'primary';
  const textColor = TEXT_COLOR[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          borderRadius: radii.md,
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.md,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          opacity: isDisabled ? 0.6 : 1,
        },
        isPrimary && {
          ...(pressed || isDisabled ? elevation.none : elevation.sm),
          backgroundColor: pressed ? colors.primaryPressed : colors.primary,
        },
        variant === 'secondary' && {
          backgroundColor: pressed ? colors.primaryTint : 'transparent',
          borderWidth: 1.5,
          borderColor: colors.primaryText,
        },
        variant === 'ghost' && { backgroundColor: pressed ? colors.primaryTint : 'transparent' },
        variant === 'danger' && {
          backgroundColor: pressed ? colors.dangerTint : 'transparent',
          borderWidth: 1.5,
          borderColor: colors.danger,
        },
      ]}
      {...rest}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={colors[textColor]} style={{ marginRight: spacing.sm }} />
        ) : icon ? (
          <Icon name={icon} size={20} color={textColor} style={{ marginRight: spacing.sm }} />
        ) : null}
        <AppText variant="body" weight="semibold" color={textColor} align="center">
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: MIN_TOUCH_TARGET,
    minWidth: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
