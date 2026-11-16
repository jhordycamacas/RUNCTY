import { Component, computed, inject } from '@angular/core';
import { SAFETY_DISCLAIMER, SEVERITY_LABELS, factorTypeLabel } from '../../../routes/domain/labels';
import { SafetyBadge } from '../../../routes/presentation/safety-badge';
import { RouteDetailStore } from '../application/route-detail.store';
import { safetySummary } from '../domain/slot-safety';

/**
 * RF-07-9 to RF-07-11: per time slot, the route level and score, the segment that sets it and
 * the factors that explain it, exactly as the API returned them. The store reloads the detail
 * after every change, so the summary follows the recalculated index without a manual reload.
 */
@Component({
  selector: 'app-safety-summary-section',
  imports: [SafetyBadge],
  template: `
    <section aria-labelledby="safety-title">
      <h2 id="safety-title">Resumen de seguridad</h2>
      <p class="muted">{{ disclaimer }}</p>
      @if (entries().length === 0) {
        <p class="muted">Agrega franjas horarias para ver el índice de seguridad.</p>
      } @else {
        <ul class="entries">
          @for (entry of entries(); track entry.key) {
            <li class="entry">
              <div class="heading">
                <h3>{{ entry.label }}</h3>
                <app-safety-badge [level]="entry.level" />
                <span class="score">Puntaje {{ entry.score }} de 100</span>
              </div>
              @if (entry.worstSegment; as worst) {
                <p class="worst">Tramo más expuesto: {{ worst }}</p>
              }
              @if (entry.factors.length === 0) {
                <p class="muted">Sin factores de riesgo en esta franja.</p>
              } @else {
                <ul class="factors" [attr.aria-label]="'Factores de ' + entry.label">
                  @for (factor of entry.factors; track $index) {
                    <li>
                      <strong>{{ typeLabel(factor.type) }}</strong>
                      · Severidad {{ severityLabels[factor.severity] }} · {{ factor.segmentName }}:
                      {{ factor.description }}
                    </li>
                  }
                </ul>
              }
            </li>
          }
        </ul>
      }
    </section>
  `,
  styles: `
    :host {
      display: block;
    }

    h2 {
      margin: 0 0 var(--rc-space-xs);
      font-size: var(--rc-font-size-subtitle);
    }

    h3 {
      margin: 0;
      font-size: var(--rc-font-size-body);
      font-variant-numeric: tabular-nums;
    }

    .entries {
      display: flex;
      flex-direction: column;
      gap: var(--rc-space-sm);
      margin: var(--rc-space-md) 0 0;
      padding: 0;
      list-style: none;
    }

    .entry {
      display: flex;
      flex-direction: column;
      gap: var(--rc-space-xs);
      padding: var(--rc-space-md) var(--rc-space-lg);
      border: 1px solid var(--rc-border);
      border-radius: var(--rc-radius-lg);
      background: var(--rc-surface-elevated);
    }

    .heading {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--rc-space-xs) var(--rc-space-md);
    }

    .score,
    .worst,
    .factors,
    .muted {
      margin: 0;
      font-size: var(--rc-font-size-label);
    }

    .score,
    .muted {
      color: var(--rc-text-muted);
    }

    .factors {
      padding-left: var(--rc-space-lg);
      overflow-wrap: anywhere;
    }
  `,
})
export class SafetySummarySection {
  private readonly store = inject(RouteDetailStore);

  protected readonly disclaimer = SAFETY_DISCLAIMER;
  protected readonly severityLabels = SEVERITY_LABELS;
  protected readonly typeLabel = factorTypeLabel;
  protected readonly entries = computed(() => {
    const detail = this.store.detail();
    return detail ? safetySummary(detail) : [];
  });
}
