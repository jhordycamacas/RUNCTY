import { Component, input } from '@angular/core';
import { SEVERITY_LABELS } from '../domain/labels';
import { SafetyFactor } from '../domain/route';

/** Risk factors that explain a safety level, each with its severity. */
@Component({
  selector: 'app-factor-list',
  template: `
    <ul>
      @for (factor of factors(); track $index) {
        <li>
          <span class="severity" [class]="factor.severity">
            Severidad {{ severity(factor).toLowerCase() }}
          </span>
          <div class="text">
            <strong>{{ factor.type }}</strong>
            @if (factor.description) {
              <span class="muted">{{ factor.description }}</span>
            }
            @if (segmentName(factor); as name) {
              <span class="caption">Tramo: {{ name }}</span>
            }
          </div>
        </li>
      }
    </ul>
  `,
  styles: `
    ul {
      margin: 0;
      padding: 0;
      list-style: none;
    }

    li {
      display: flex;
      align-items: flex-start;
      gap: var(--rc-space-sm);
      margin-top: var(--rc-space-sm);
    }

    .severity {
      flex: none;
      padding: 2px var(--rc-space-sm);
      border: 1px solid var(--rc-border);
      border-radius: var(--rc-radius-sm);
      font-size: var(--rc-font-size-caption);
      font-weight: 600;
      white-space: nowrap;
    }

    .high {
      border-color: var(--rc-danger);
      background: var(--rc-danger-tint);
    }

    .medium {
      border-color: var(--rc-warning);
      background: var(--rc-warning-tint);
    }

    .text {
      display: flex;
      flex-direction: column;
    }

    .muted,
    .caption {
      color: var(--rc-text-muted);
    }

    .muted {
      font-size: var(--rc-font-size-label);
    }

    .caption {
      font-size: var(--rc-font-size-caption);
    }
  `,
})
export class FactorList {
  readonly factors = input.required<readonly (SafetyFactor & { segmentName?: string })[]>();

  protected severity(factor: SafetyFactor): string {
    return SEVERITY_LABELS[factor.severity];
  }

  protected segmentName(factor: SafetyFactor & { segmentName?: string }): string {
    return factor.segmentName ?? '';
  }
}
