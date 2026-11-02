import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import type { StyleProp, TextStyle } from 'react-native';

import { useTheme, type ThemeColors } from '@/core/theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];
export type IconColor = keyof ThemeColors;

export interface IconProps {
  name: IconName;
  size?: number;
  color?: IconColor;
  style?: StyleProp<TextStyle>;
  testID?: string;
}

/**
 * Ionicons glyph painted with a theme color. Icons are decorative: the control
 * that contains them carries the accessible label.
 */
export function Icon({ name, size = 24, color = 'text', style, testID }: IconProps) {
  const { colors } = useTheme();
  return (
    <Ionicons
      name={name}
      size={size}
      color={colors[color]}
      style={style}
      testID={testID}
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}
