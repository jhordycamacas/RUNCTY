import { StyleSheet, Text, type TextProps } from 'react-native';

import {
  useTheme,
  useTypeface,
  type FontSizeToken,
  type FontWeightToken,
  type ThemeColors,
} from '@/core/theme';

export type TextColor = keyof Pick<
  ThemeColors,
  | 'text'
  | 'textMuted'
  | 'primaryText'
  | 'onPrimary'
  | 'danger'
  | 'success'
  | 'warning'
  | 'safetyHigh'
  | 'safetyMedium'
  | 'safetyLow'
>;

export interface AppTextProps extends TextProps {
  variant?: FontSizeToken;
  color?: TextColor;
  weight?: FontWeightToken;
  align?: 'left' | 'center' | 'right';
}

/** Theme-aware text that honors the user font scale and system font scaling. */
export function AppText({
  variant = 'body',
  color = 'text',
  weight,
  align,
  style,
  accessibilityRole,
  ...rest
}: AppTextProps) {
  const theme = useTheme();
  const size = theme.typography.sizes[variant] * theme.fontScale;
  const isHeading = variant === 'title' || variant === 'display';
  const typeface = useTypeface(weight ?? (isHeading ? 'bold' : 'regular'));

  return (
    <Text
      allowFontScaling
      accessibilityRole={accessibilityRole ?? (isHeading ? 'header' : undefined)}
      style={[
        styles.base,
        {
          color: theme.colors[color],
          fontSize: size,
          lineHeight: Math.round(size * 1.35),
          textAlign: align,
          letterSpacing: isHeading ? -0.3 : 0,
        },
        typeface,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    flexShrink: 1,
  },
});
