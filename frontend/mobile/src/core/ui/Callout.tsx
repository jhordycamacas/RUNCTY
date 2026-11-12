import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme, type ThemeColors } from '@/core/theme';

import { AppText, type TextColor } from './AppText';
import { Icon, type IconName } from './Icon';

type CalloutTone = 'info' | 'success' | 'warning' | 'danger';

const TONES: Record<CalloutTone, { color: TextColor; background: keyof ThemeColors; icon: IconName }> = {
  info: { color: 'primaryText', background: 'primaryTint', icon: 'information-circle' },
  success: { color: 'success', background: 'successTint', icon: 'checkmark-circle' },
  warning: { color: 'warning', background: 'warningTint', icon: 'warning' },
  danger: { color: 'danger', background: 'dangerTint', icon: 'alert-circle' },
};

export interface CalloutProps {
  tone?: CalloutTone;
  title: string;
  message?: string;
  icon?: IconName;
  /** Extra content under the message (e.g. an action). */
  children?: ReactNode;
}

/** Highlighted notice with icon, title and message. Danger callouts are announced as alerts. */
export function Callout({ tone = 'info', title, message, icon, children }: CalloutProps) {
  const { colors, radii, spacing } = useTheme();
  const config = TONES[tone];

  return (
    <View
      // One focus stop so the title and message are read together.
      accessible
      accessibilityRole={tone === 'danger' ? 'alert' : undefined}
      style={[
        styles.row,
        {
          backgroundColor: colors[config.background],
          borderRadius: radii.lg,
          padding: spacing.lg,
          marginBottom: spacing.lg,
        },
      ]}
    >
      <Icon name={icon ?? config.icon} size={22} color={config.color} style={{ marginRight: spacing.md }} />
      <View style={styles.body}>
        <AppText weight="semibold" color={config.color}>
          {title}
        </AppText>
        {message ? <AppText style={{ marginTop: spacing.xs }}>{message}</AppText> : null}
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  body: {
    flex: 1,
  },
});
