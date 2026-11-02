import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { MIN_TOUCH_TARGET, useTheme } from '@/core/theme';

import { AppText } from './AppText';

export interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
  /** Optional richer content shown instead of the plain label text. */
  children?: ReactNode;
}

export function Checkbox({ label, checked, onChange, error, children }: CheckboxProps) {
  const { colors, radii, spacing } = useTheme();

  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={label}
        accessibilityState={{ checked }}
        accessibilityHint={error}
        onPress={() => onChange(!checked)}
        style={styles.row}
      >
        <View
          style={[
            styles.box,
            {
              borderRadius: radii.sm,
              borderColor: error ? colors.danger : colors.primaryText,
              backgroundColor: checked ? colors.primary : 'transparent',
              marginRight: spacing.md,
            },
          ]}
        >
          {checked ? (
            <AppText weight="bold" color="onPrimary">
              ✓
            </AppText>
          ) : null}
        </View>
        <View style={styles.label}>{children ?? <AppText>{label}</AppText>}</View>
      </Pressable>
      {error ? (
        <AppText variant="label" color="danger" accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: MIN_TOUCH_TARGET,
  },
  box: {
    width: 24,
    height: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
  },
});
