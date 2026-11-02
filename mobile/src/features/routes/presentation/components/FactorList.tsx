import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/core/theme';
import { AppText, Badge, type BadgeTone } from '@/core/ui';

import { SEVERITY_LABELS, factorTypeLabel } from '../../domain/labels';
import type { SafetyFactor, Severity } from '../../domain/route';

const SEVERITY_TONES: Record<Severity, BadgeTone> = { high: 'danger', medium: 'warning', low: 'neutral' };

interface FactorListProps {
  factors: readonly (SafetyFactor & { segmentName?: string })[];
}

/** Risk factors that explain a safety level, with their severity. */
export function FactorList({ factors }: FactorListProps) {
  const { spacing } = useTheme();

  return (
    <View>
      {factors.map((factor, index) => {
        const type = factorTypeLabel(factor.type);
        const severity = `Severidad ${SEVERITY_LABELS[factor.severity].toLowerCase()}`;
        const where = factor.segmentName ? `Tramo: ${factor.segmentName}` : null;
        return (
          <View
            key={`${factor.type}-${index}`}
            accessible
            accessibilityLabel={[type, severity, factor.description, where].filter(Boolean).join('. ')}
            style={[styles.row, { marginTop: spacing.sm }]}
          >
            <Badge
              label={SEVERITY_LABELS[factor.severity]}
              tone={SEVERITY_TONES[factor.severity]}
              style={{ marginRight: spacing.sm }}
            />
            <View style={styles.text}>
              <AppText weight="semibold">{type}</AppText>
              {factor.description ? (
                <AppText variant="label" color="textMuted">
                  {factor.description}
                </AppText>
              ) : null}
              {where ? (
                <AppText variant="caption" color="textMuted">
                  {where}
                </AppText>
              ) : null}
            </View>
          </View>
        );
      })}
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
