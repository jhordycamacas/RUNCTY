import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/core/theme';

import { AppText } from './AppText';
import { Icon } from './Icon';

export interface FormMessageProps {
  message?: string | null;
  tone?: 'error' | 'success';
}

/** Form-level feedback announced to screen readers. Renders nothing without a message. */
export function FormMessage({ message, tone = 'error' }: FormMessageProps) {
  const { colors, radii, spacing } = useTheme();
  if (!message) return null;
  const isError = tone === 'error';

  return (
    <View
      accessibilityRole={isError ? 'alert' : undefined}
      accessibilityLiveRegion="polite"
      style={[
        styles.row,
        {
          borderRadius: radii.md,
          backgroundColor: isError ? colors.dangerTint : colors.successTint,
          padding: spacing.md,
          marginBottom: spacing.lg,
        },
      ]}
    >
      <Icon
        name={isError ? 'alert-circle' : 'checkmark-circle'}
        size={20}
        color={isError ? 'danger' : 'success'}
        style={{ marginRight: spacing.sm }}
      />
      <AppText color={isError ? 'danger' : 'success'} weight="medium" style={styles.text}>
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  text: {
    flex: 1,
  },
});
