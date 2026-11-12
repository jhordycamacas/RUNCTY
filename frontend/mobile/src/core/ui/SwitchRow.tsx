import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { MIN_TOUCH_TARGET, useTheme } from '@/core/theme';

import { AppText } from './AppText';

export interface SwitchRowProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  hint?: string;
  disabled?: boolean;
}

/** Labeled on/off setting. The whole row is one accessible switch. */
export function SwitchRow({ label, value, onChange, hint, disabled = false }: SwitchRowProps) {
  const { colors, spacing } = useTheme();

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={() => onChange(!value)}
      style={[styles.row, { marginBottom: spacing.sm, opacity: disabled ? 0.6 : 1 }]}
    >
      <View style={[styles.text, { marginRight: spacing.md }]}>
        <AppText>{label}</AppText>
        {hint ? (
          <AppText variant="label" color="textMuted">
            {hint}
          </AppText>
        ) : null}
      </View>
      {/* Visual only: the row handles the press and exposes the state. */}
      <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden style={styles.passive}>
        <Switch
          value={value}
          disabled={disabled}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.background}
          ios_backgroundColor={colors.border}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: MIN_TOUCH_TARGET,
  },
  text: {
    flex: 1,
  },
  passive: {
    pointerEvents: 'none',
  },
});
