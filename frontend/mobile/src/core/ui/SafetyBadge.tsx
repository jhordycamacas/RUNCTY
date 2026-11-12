import { StyleSheet, View, type ViewProps } from 'react-native';

import { useTheme, type ThemeColors } from '@/core/theme';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

export type SafetyLevel = 'high' | 'medium' | 'low';

interface SafetyLevelStyle {
  label: string;
  short: string;
  icon: IconName;
  color: 'safetyHigh' | 'safetyMedium' | 'safetyLow';
  background: keyof ThemeColors;
}

/**
 * Wording is deliberate: the index describes a relative level, so the app
 * never calls a route "segura" or "insegura".
 */
export const SAFETY_LEVELS: Record<SafetyLevel, SafetyLevelStyle> = {
  high: {
    label: 'Seguridad alta',
    short: 'Alto',
    icon: 'shield-checkmark',
    color: 'safetyHigh',
    background: 'successTint',
  },
  medium: {
    label: 'Seguridad media',
    short: 'Medio',
    icon: 'shield-half',
    color: 'safetyMedium',
    background: 'warningTint',
  },
  low: {
    label: 'Seguridad baja',
    short: 'Bajo',
    icon: 'alert-circle',
    color: 'safetyLow',
    background: 'dangerTint',
  },
};

export interface SafetyBadgeProps extends Omit<ViewProps, 'children'> {
  level: SafetyLevel;
  /** Short text ("Alto"/"Medio"/"Bajo") for dense lists; the label stays complete. */
  compact?: boolean;
}

/** Safety index level with icon, text and color, so color is never the only cue. */
export function SafetyBadge({ level, compact = false, style, ...rest }: SafetyBadgeProps) {
  const { colors, radii, spacing } = useTheme();
  const config = SAFETY_LEVELS[level];

  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={config.label}
      style={[
        styles.pill,
        {
          backgroundColor: colors[config.background],
          borderRadius: radii.pill,
          paddingHorizontal: compact ? spacing.sm : spacing.md,
          paddingVertical: spacing.xs,
        },
        style,
      ]}
      {...rest}
    >
      <Icon
        name={config.icon}
        size={compact ? 14 : 16}
        color={config.color}
        style={{ marginRight: spacing.xs }}
      />
      <AppText variant={compact ? 'caption' : 'label'} weight="semibold" color={config.color}>
        {compact ? config.short : config.label}
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
