import { StyleSheet, View, type ViewProps } from 'react-native';

import { useTheme, type ThemeColors } from '@/core/theme';

import { AppText, type TextColor } from './AppText';
import { Icon, type IconName } from './Icon';

export type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

export interface BadgeProps extends Omit<ViewProps, 'children'> {
  label: string;
  tone?: BadgeTone;
  icon?: IconName;
}

/** Text and background pairs; all are covered by the contrast tests. */
const BADGE_TONES: Record<BadgeTone, { text: TextColor; background: keyof ThemeColors }> = {
  neutral: { text: 'textMuted', background: 'surface' },
  primary: { text: 'primaryText', background: 'primaryTint' },
  success: { text: 'success', background: 'successTint' },
  warning: { text: 'warning', background: 'warningTint' },
  danger: { text: 'danger', background: 'dangerTint' },
};

/** Small pill with a short status text. */
export function Badge({ label, tone = 'neutral', icon, style, ...rest }: BadgeProps) {
  const { colors, radii, spacing } = useTheme();
  const { text, background } = BADGE_TONES[tone];

  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: colors[background],
          borderRadius: radii.pill,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs,
        },
        style,
      ]}
      {...rest}
    >
      {icon ? <Icon name={icon} size={14} color={text} style={{ marginRight: spacing.xs }} /> : null}
      <AppText variant="caption" weight="semibold" color={text}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
});
