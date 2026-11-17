import { Component, computed, input } from '@angular/core';

type SegmentTone = 'success' | 'warning' | 'danger' | 'muted';

export interface Segment {
  label: string;
  value: number;
  tone: SegmentTone;
}

/**
 * One bar split into parts, with a legend that names every part and gives its number and share:
 * the color is never the only signal.
 */
@Component({
  selector: 'app-stacked-bar',
  template: `
    <div class="bar" role="img" [attr.aria-label]="description()">
      @for (part of parts(); track part.label) {
        @if (part.value > 0) {
          <span class="part" [class]="part.tone" [style.flex-grow]="part.value"></span>
        }
      } @empty {
        <span class="part muted" style="flex-grow: 1"></span>
      }
    </div>
    <ul class="legend">
      @for (part of parts(); track part.label) {
        <li>
          <span class="dot" [class]="part.tone" aria-hidden="true"></span>
          <span class="name">{{ part.label }}</span>
          <span class="value">{{ part.value }}</span>
          <span class="share">{{ part.share }}%</span>
        </li>
      }
    </ul>
  `,
  styles: `
    .bar {
      display: flex;
      gap: 2px;
      height: 1rem;
      overflow: hidden;
      border-radius: var(--rc-radius-pill);
      background: var(--rc-progress-track);
    }

    .part {
      min-width: 6px;
    }

    .success {
      background: var(--rc-success);
    }
    .warning {
      background: var(--rc-warning);
    }
    .danger {
      background: var(--rc-danger);
    }
    .muted {
      background: var(--rc-control-border);
    }

    .legend {
      display: grid;
      gap: var(--rc-space-sm);
      margin: var(--rc-space-lg) 0 0;
      padding: 0;
      list-style: none;
      font-size: var(--rc-font-size-label);
    }

    li {
      display: grid;
      grid-template-columns: auto 1fr auto 3rem;
      align-items: center;
      gap: var(--rc-space-sm);
    }

    .dot {
      width: 0.75rem;
      height: 0.75rem;
      border-radius: var(--rc-radius-pill);
    }

    .name {
      font-weight: 600;
    }

    .value {
      font-weight: 800;
    }

    .share {
      text-align: end;
      color: var(--rc-text-muted);
    }
  `,
})
export class StackedBar {
  readonly segments = input.required<readonly Segment[]>();
  /** What the bar measures, for the accessible description. */
  readonly subject = input.required<string>();

  protected readonly parts = computed(() => {
    const total = this.segments().reduce((sum, part) => sum + part.value, 0);
    return this.segments().map((part) => ({
      ...part,
      share: total === 0 ? 0 : Math.round((part.value / total) * 100),
    }));
  });

  protected readonly description = computed(
    () =>
      `${this.subject()}: ` + this.parts().map((part) => `${part.label} ${part.value}`).join(', '),
  );
}
