import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { MIN_TOUCH_TARGET, useTheme } from '@/core/theme';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

export interface ListItemProps {
  title: string;
  subtitle?: string;
  icon?: IconName;
  /** Replaces the default chevron (shown only on pressable rows). */
  trailing?: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  /** `danger` for destructive entries such as deleting the account. */
  tone?: 'default' | 'danger';
  /** Draws a divider above the row (for rows grouped inside a Card). */
  divider?: boolean;
}

/** Menu/settings row: leading icon, title, optional subtitle and trailing chevron. */
export function ListItem({
  title,
  subtitle,
  icon,
  trailing,
  onPress,
  disabled = false,
  tone = 'default',
  divider = false,
}: ListItemProps) {
  const { colors, radii, spacing } = useTheme();
  const isDanger = tone === 'danger';

  const content = (
    <>
      {icon ? (
        <View
          style={[
            styles.iconWrap,
            {
              backgroundColor: isDanger ? colors.dangerTint : colors.primaryTint,
              borderRadius: radii.md,
              marginRight: spacing.md,
            },
          ]}
        >
          <Icon name={icon} size={20} color={isDanger ? 'danger' : 'primaryText'} />
        </View>
      ) : null}
      <View style={styles.text}>
        <AppText weight="medium" color={isDanger ? 'danger' : 'text'}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="label" color="textMuted">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {trailing ?? (onPress ? <Icon name="chevron-forward" size={20} color="textMuted" /> : null)}
    </>
  );

  const rowStyle = [
    styles.row,
    {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderTopWidth: divider ? StyleSheet.hairlineWidth : 0,
      borderTopColor: colors.border,
    },
  ];

  if (!onPress) return <View style={rowStyle}>{content}</View>;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={subtitle}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        rowStyle,
        { backgroundColor: pressed ? colors.surface : 'transparent', opacity: disabled ? 0.5 : 1 },
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: MIN_TOUCH_TARGET + 8,
  },
  iconWrap: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    marginRight: 8,
  },
});
