import { StyleSheet, View, type ViewProps } from 'react-native';

import { useTheme, type ElevationToken } from '@/core/theme';

type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends ViewProps {
  /** Inner spacing; `none` lets full-width rows (ListItem) reach the edges. */
  padding?: CardPadding;
  elevation?: ElevationToken;
}

const PADDING = { none: 0, sm: 'md', md: 'lg', lg: 'xl' } as const;

/** Elevated surface with soft shadow, hairline border and rounded corners. */
export function Card({ padding = 'md', elevation = 'sm', style, ...rest }: CardProps) {
  const theme = useTheme();
  const { colors, radii, spacing } = theme;
  const step = PADDING[padding];

  return (
    <View
      style={[
        styles.base,
        theme.elevation[elevation],
        {
          backgroundColor: colors.surfaceElevated,
          borderColor: colors.border,
          borderRadius: radii.lg,
          padding: step === 0 ? 0 : spacing[step],
        },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: StyleSheet.hairlineWidth,
  },
});
