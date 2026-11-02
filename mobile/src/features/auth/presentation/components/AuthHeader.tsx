import { View } from 'react-native';

import { useTheme } from '@/core/theme';
import { AppText, BrandMark } from '@/core/ui';

export interface AuthHeaderProps {
  /** Short instruction under the brand (e.g. "Inicia sesión para continuar"). */
  message?: string;
  /** Smaller logo for screens that already show a navigator title. */
  compact?: boolean;
}

/** Brand block for the auth screens: logo, app name and tagline. */
export function AuthHeader({ message, compact = false }: AuthHeaderProps) {
  const { spacing } = useTheme();

  return (
    <View style={{ alignItems: 'center', marginTop: compact ? 0 : spacing.xxl, marginBottom: spacing.xl }}>
      <BrandMark size={compact ? 64 : 104} />
      {compact ? null : (
        <AppText variant="display" align="center" style={{ marginTop: spacing.md }}>
          RUNCTY
        </AppText>
      )}
      <AppText
        variant={compact ? 'body' : 'subtitle'}
        weight="semibold"
        color="primaryText"
        align="center"
        style={{ marginTop: compact ? spacing.sm : 0 }}
      >
        Corre más seguro
      </AppText>
      {message ? (
        <AppText color="textMuted" align="center" style={{ marginTop: spacing.sm }}>
          {message}
        </AppText>
      ) : null}
    </View>
  );
}
