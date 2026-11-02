import { StyleSheet, View, type ViewProps } from 'react-native';

import { useTheme } from '@/core/theme';

export function Card({ style, ...rest }: ViewProps) {
  const { colors, radii, spacing } = useTheme();
  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radii.lg,
          padding: spacing.lg,
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
