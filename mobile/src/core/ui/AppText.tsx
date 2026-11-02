import { StyleSheet, Text, type TextProps } from 'react-native';

import { useTheme, type FontSizeToken, type ThemeColors } from '@/core/theme';

type TextColor = keyof Pick<
  ThemeColors,
  'text' | 'textMuted' | 'primaryText' | 'onPrimary' | 'danger' | 'success'
>;

export interface AppTextProps extends TextProps {
  variant?: FontSizeToken;
  color?: TextColor;
  weight?: 'regular' | 'medium' | 'bold';
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
  const resolvedWeight = weight ?? (isHeading ? 'bold' : 'regular');

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
          fontWeight: theme.typography.weights[resolvedWeight],
          textAlign: align,
        },
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
