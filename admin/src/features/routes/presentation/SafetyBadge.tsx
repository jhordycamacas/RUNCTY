import { Badge } from '@/core/ui/feedback';

import { levelLabel, type SafetyLevel, type Severity } from '../domain/route';

const LEVEL_TONE: Record<SafetyLevel, 'success' | 'warning' | 'brand'> = {
  high: 'success',
  medium: 'warning',
  low: 'brand',
};

export const SEVERITY_TONE: Record<Severity, 'neutral' | 'warning' | 'brand'> = {
  low: 'neutral',
  medium: 'warning',
  high: 'brand',
};

/** Level per time slot: "Alto/Medio/Bajo" (never "segura/insegura"). */
export function SafetyBadge({ level, window }: { level: SafetyLevel; window?: string }) {
  return (
    <Badge tone={LEVEL_TONE[level]}>
      {window ? <span className="mr-1 font-normal tabular-nums">{window}</span> : null}
      Nivel {levelLabel(level)}
    </Badge>
  );
}

export const formatMeters = (meters: number): string =>
  meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(2).replace('.', ',')} km`;

export const formatKm = (km: number): string => `${km.toFixed(1).replace('.', ',')} km`;
