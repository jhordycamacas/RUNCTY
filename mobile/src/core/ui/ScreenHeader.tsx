import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/core/theme';

import { AppText } from './AppText';

export interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  /** Optional node before the title (e.g. the brand mark). */
  left?: ReactNode;
  /** Optional action on the right (e.g. an IconButton). */
  right?: ReactNode;
}

/** Large-title header for tab screens that hide the navigator header. */
export function ScreenHeader({ title, subtitle, left, right }: ScreenHeaderProps) {
  const { spacing } = useTheme();

  return (
    <View style={[styles.row, { marginBottom: spacing.xl }]}>
      {left ? <View style={{ marginRight: spacing.md }}>{left}</View> : null}
      <View style={styles.text}>
        <AppText variant="title">{title}</AppText>
        {subtitle ? (
          <AppText color="textMuted" style={{ marginTop: spacing.xxs }}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {right ? <View style={{ marginLeft: spacing.md }}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    flex: 1,
  },
});
