import { ActivityIndicator, Pressable, StyleSheet, View, type PressableProps } from 'react-native';

import { MIN_TOUCH_TARGET, useTheme } from '@/core/theme';

import { AppText } from './AppText';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  label,
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = true,
  ...rest
}: ButtonProps) {
  const { colors, radii, spacing } = useTheme();
  const isDisabled = Boolean(disabled) || loading;
  const isPrimary = variant === 'primary';

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
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          opacity: isDisabled ? 0.6 : 1,
        },
        isPrimary && { backgroundColor: pressed ? colors.primaryPressed : colors.primary },
        variant === 'secondary' && {
          backgroundColor: pressed ? colors.primaryTint : 'transparent',
          borderWidth: 1.5,
          borderColor: colors.primaryText,
        },
        variant === 'ghost' && { backgroundColor: pressed ? colors.primaryTint : 'transparent' },
      ]}
      {...rest}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator
            color={isPrimary ? colors.onPrimary : colors.primaryText}
            style={{ marginRight: spacing.sm }}
          />
        ) : null}
        <AppText variant="body" weight="bold" color={isPrimary ? 'onPrimary' : 'primaryText'}>
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
