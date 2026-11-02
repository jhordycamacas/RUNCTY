import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/core/theme';

import { AppText } from './AppText';
import { Button } from './Button';
import { Icon, type IconName } from './Icon';

export interface EmptyStateProps {
  icon: IconName;
  title: string;
  description?: string;
  action?: { label: string; onPress: () => void };
}

/** Friendly placeholder for lists or sections that have nothing to show yet. */
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  const { colors, spacing } = useTheme();

  return (
    <View style={[styles.center, { paddingVertical: spacing.xxl, paddingHorizontal: spacing.lg }]}>
      <View style={[styles.badge, { backgroundColor: colors.primaryTint, marginBottom: spacing.lg }]}>
        <Icon name={icon} size={32} color="primaryText" />
      </View>
      <AppText variant="subtitle" weight="bold" align="center" accessibilityRole="header">
        {title}
      </AppText>
      {description ? (
        <AppText color="textMuted" align="center" style={{ marginTop: spacing.sm }}>
          {description}
        </AppText>
      ) : null}
      {action ? (
        <View style={{ marginTop: spacing.xl }}>
          <Button label={action.label} variant="secondary" fullWidth={false} onPress={action.onPress} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
  },
  badge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
