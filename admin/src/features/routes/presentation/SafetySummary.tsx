import { Badge } from '@/core/ui/feedback';

import { safetyBySlot, type RouteSafety } from '../domain/route';
import { factorTypeLabel, formatWindow, severityLabel, type FranjaHoraria } from '../domain/schedule';
import type { Tramo } from '../domain/segment';
import { SEVERITY_TONE, SafetyBadge } from './SafetyBadge';

interface SafetySummaryProps {
  safety: RouteSafety;
  slots: FranjaHoraria[];
  segments: Tramo[];
}

/** RF-07-10: route level per slot (worst segment) with the factors that explain it. */
export function SafetySummary({ safety, slots, segments }: SafetySummaryProps) {
  const entries = safetyBySlot(safety);
  const slotLabels = new Map(slots.map((s) => [s.id, s.label]));
  const segmentNames = new Map(segments.map((s) => [s.id, s.name]));

  return (
    <section aria-labelledby="safety-title" className="rounded-lg border border-line bg-white p-6">
      <h2 id="safety-title" className="text-lg font-bold text-ink">
        Nivel por franja
      </h2>
      <p className="mb-4 text-sm text-muted">
        Cada tramo parte de 100 puntos por franja; los factores activos restan según su severidad. La ruta toma el nivel de su peor
        tramo: Alto (70 o más), Medio (40 a 69) o Bajo (menos de 40).
      </p>

      {entries.length === 0 ? (
        <p className="text-sm text-muted">Agrega al menos un tramo y una franja para calcular el nivel.</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {entries.map((entry) => {
            const label = slotLabels.get(entry.slotId);
            return (
              <li key={entry.slotId} className="rounded-md border border-line p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold tabular-nums text-ink">
                    {formatWindow(entry.startTime, entry.endTime)}
                    {label ? <span className="ml-2 font-normal text-muted">{label}</span> : null}
                  </p>
                  <SafetyBadge level={entry.level} />
                </div>
                <p className="mt-1 text-sm text-ink">
                  Puntaje <strong className="tabular-nums">{entry.score}</strong> de 100 · Peor tramo:{' '}
                  {segmentNames.get(entry.worstSegmentId) ?? entry.worstSegmentId}
                </p>
                {entry.factors.length === 0 ? (
                  <p className="mt-2 text-xs text-muted">Sin factores de riesgo activos en esta franja.</p>
                ) : (
                  <ul className="mt-2 flex flex-col gap-1 text-sm">
                    {entry.factors.map((factor, i) => (
                      <li key={`${factor.segmentId}-${factor.type}-${i}`}>
                        <Badge tone={SEVERITY_TONE[factor.severity]}>{severityLabel(factor.severity)}</Badge>{' '}
                        <span className="font-medium">{factorTypeLabel(factor.type)}</span>{' '}
                        <span className="text-muted">
                          en {factor.segmentName}: {factor.description}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
