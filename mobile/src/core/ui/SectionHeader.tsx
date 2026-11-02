import { Pressable, StyleSheet, View } from 'react-native';

import { MIN_TOUCH_TARGET, useTheme } from '@/core/theme';

import { AppText } from './AppText';

export interface SectionHeaderProps {
  title: string;
  action?: { label: string; onPress: () => void };
}

/** Title of a content section, with an optional text action on the right. */
export function SectionHeader({ title, action }: SectionHeaderProps) {
  const { spacing } = useTheme();

  return (
    <View style={[styles.row, { marginTop: spacing.lg, marginBottom: spacing.sm }]}>
      <AppText variant="subtitle" weight="bold" accessibilityRole="header" style={styles.title}>
        {title}
      </AppText>
      {action ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={action.label}
          onPress={action.onPress}
          style={[styles.action, { paddingLeft: spacing.md }]}
        >
          <AppText variant="label" weight="semibold" color="primaryText">
            {action.label}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    flex: 1,
  },
  action: {
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
  },
});
