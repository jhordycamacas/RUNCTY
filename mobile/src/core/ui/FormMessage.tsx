import { View } from 'react-native';

import { useTheme } from '@/core/theme';

import { AppText } from './AppText';

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
      style={{
        borderRadius: radii.md,
        borderWidth: 1.5,
        borderColor: isError ? colors.danger : colors.success,
        padding: spacing.md,
        marginBottom: spacing.lg,
      }}
    >
      <AppText color={isError ? 'danger' : 'success'}>{message}</AppText>
    </View>
  );
}
