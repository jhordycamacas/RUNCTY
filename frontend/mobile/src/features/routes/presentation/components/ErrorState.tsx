import { View } from 'react-native';

import { useTheme } from '@/core/theme';
import { Button, Callout } from '@/core/ui';

interface ErrorStateProps {
  title: string;
  onRetry: () => void;
}

/**
 * Load error with a retry action. The button sits outside the Callout:
 * the Callout is a single accessibility node, so a nested button would be
 * unreachable for screen readers.
 */
export function ErrorState({ title, onRetry }: ErrorStateProps) {
  const { spacing } = useTheme();
  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Callout tone="danger" title={title} message="Revisa tu conexión e inténtalo de nuevo." />
      <Button label="Reintentar" variant="secondary" icon="refresh" onPress={onRetry} />
    </View>
  );
}
