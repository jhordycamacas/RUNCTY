import { Pressable, StyleSheet, type PressableProps } from 'react-native';

import { MIN_TOUCH_TARGET, useTheme } from '@/core/theme';

import { Icon, type IconColor, type IconName } from './Icon';

export interface IconButtonProps extends Omit<PressableProps, 'children' | 'style' | 'accessibilityLabel'> {
  icon: IconName;
  /** Required: an icon alone says nothing to a screen reader. */
  accessibilityLabel: string;
  /** `tinted` sits on a soft brand background; `plain` is transparent. */
  variant?: 'plain' | 'tinted';
  color?: IconColor;
  size?: number;
}

export function IconButton({
  icon,
  accessibilityLabel,
  variant = 'plain',
  color = 'text',
  size = 24,
  disabled = false,
  ...rest
}: IconButtonProps) {
  const { colors, radii } = useTheme();
  const isDisabled = Boolean(disabled);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      hitSlop={4}
      style={({ pressed }) => [
        styles.base,
        {
          borderRadius: radii.pill,
          opacity: isDisabled ? 0.5 : 1,
          backgroundColor: pressed
            ? colors.primaryTint
            : variant === 'tinted'
              ? colors.surface
              : 'transparent',
        },
      ]}
      {...rest}
    >
      <Icon name={icon} size={size} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
