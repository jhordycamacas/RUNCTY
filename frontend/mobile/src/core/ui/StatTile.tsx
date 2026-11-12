import { StyleSheet, View, type ViewProps } from 'react-native';

import { useTheme } from '@/core/theme';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

export interface StatTileProps extends Omit<ViewProps, 'children'> {
  value: string;
  label: string;
  icon?: IconName;
}

/** A single figure with its caption, read as one phrase by screen readers. */
export function StatTile({ value, label, icon, style, ...rest }: StatTileProps) {
  const { colors, radii, spacing } = useTheme();

  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}`}
      style={[
        styles.tile,
        { backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.lg },
        style,
      ]}
      {...rest}
    >
      {icon ? <Icon name={icon} size={20} color="primaryText" style={{ marginBottom: spacing.sm }} /> : null}
      <AppText variant="subtitle" weight="bold">
        {value}
      </AppText>
      <AppText variant="label" color="textMuted">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
  },
});
