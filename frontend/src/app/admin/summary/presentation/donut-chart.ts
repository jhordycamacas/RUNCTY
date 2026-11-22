import { Component, computed, input } from '@angular/core';
import { ChartColor, colorVar, sharePercentages } from './chart-math';

export interface DonutSlice {
  label: string;
  value: number;
  color: ChartColor;
}

/** Radius whose circumference is 100, so a slice's dash length is its percentage. */
const RADIUS = 15.9155;
/** Visual gap between slices, in percent of the ring. */
const GAP = 0.8;

const round = (value: number): number => Math.round(value * 100) / 100;

/**
 * A donut with the total in the center and a legend that names every slice with its number and
 * share, so color is never the only signal. A hidden table repeats the data for screen readers.
 */
@Component({
  selector: 'app-donut-chart',
  template: `
    <div class="donut">
      <div class="ring">
        <svg viewBox="0 0 42 42" role="img" [attr.aria-label]="description()">
          <circle class="base" cx="21" cy="21" [attr.r]="radius" fill="none" stroke-width="5" />
          @for (arc of arcs(); track arc.label) {
            <circle
              class="arc"
              cx="21"
              cy="21"
              [attr.r]="radius"
              fill="none"
              stroke-width="5"
              [attr.stroke]="arc.stroke"
              [attr.stroke-dasharray]="arc.dash"
              [attr.stroke-dashoffset]="arc.offset"
            >
              <title>{{ arc.label }}: {{ arc.value }} ({{ arc.percent }}%)</title>
            </circle>
          }
        </svg>
        <p class="center" aria-hidden="true">
          @if (total() > 0) {
            <strong>{{ total() }}</strong>
            <span>{{ centerLabel() }}</span>
          } @else {
            <span>Sin datos</span>
          }
        </p>
      </div>
      <ul class="legend" aria-hidden="true">
        @for (part of parts(); track part.label) {
          <li [title]="part.label">
            <span class="dot" [style.background]="part.stroke"></span>
            <span class="name">{{ part.label }}</span>
            <span class="value">{{ part.value }}</span>
            <span class="share">{{ part.percent }}%</span>
          </li>
        }
      </ul>
    </div>
    <div class="sr-only">
      <table>
        <caption>
          {{ subject() }}
        </caption>
        <thead>
          <tr>
            <th scope="col">Categoría</th>
            <th scope="col">Cantidad</th>
            <th scope="col">Porcentaje</th>
          </tr>
        </thead>
        <tbody>
          @for (part of parts(); track part.label) {
            <tr>
              <td>{{ part.label }}</td>
              <td>{{ part.value }}</td>
              <td>{{ part.percent }}%</td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .donut {
      display: grid;
      justify-items: center;
      gap: var(--rc-space-lg);
    }

    .ring {
      position: relative;
      width: min(100%, 10rem);
    }

    svg {
      display: block;
      width: 100%;
    }

    .base {
      stroke: var(--rc-progress-track);
    }

    .arc {
      animation: draw 0.7s ease-out;
    }

    @keyframes draw {
      from {
        stroke-dasharray: 0 100;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .arc {
        animation: none;
      }
    }

    .center {
      position: absolute;
      inset: 0;
      display: grid;
      place-content: center;
      margin: 0;
      text-align: center;
    }

    .center strong {
      font-size: 1.75rem;
      font-weight: 800;
      line-height: 1;
      letter-spacing: -0.03em;
    }

    .center span {
      font-size: var(--rc-font-size-caption);
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--rc-text-muted);
    }

    .legend {
      display: grid;
      gap: var(--rc-space-sm);
      width: 100%;
      margin: 0;
      padding: 0;
      list-style: none;
      font-size: var(--rc-font-size-label);
    }

    li {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto 3rem;
      align-items: center;
      gap: var(--rc-space-sm);
    }

    .dot {
      width: 0.75rem;
      height: 0.75rem;
      border-radius: 3px;
    }

    .name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-weight: 600;
    }

    .value {
      font-weight: 800;
      font-variant-numeric: tabular-nums;
    }

    .share {
      text-align: end;
      color: var(--rc-text-muted);
      font-variant-numeric: tabular-nums;
    }
  `,
})
export class DonutChart {
  readonly slices = input.required<readonly DonutSlice[]>();
  /** What the chart measures, for the accessible description. */
  readonly subject = input.required<string>();
  readonly centerLabel = input('Total');

  protected readonly radius = RADIUS;
  protected readonly total = computed(() =>
    this.slices().reduce((sum, slice) => sum + slice.value, 0),
  );

  protected readonly parts = computed(() => {
    const percents = sharePercentages(this.slices().map((slice) => slice.value));
    return this.slices().map((slice, index) => ({
      ...slice,
      percent: percents[index],
      stroke: colorVar(slice.color),
    }));
  });

  /** The visible slices as dashes on a ring of circumference 100, starting at twelve o'clock. */
  protected readonly arcs = computed(() => {
    const total = this.total();
    const visible = this.parts().filter((part) => part.value > 0);
    let start = 0;
    return visible.map((part) => {
      const length = (part.value / total) * 100;
      const gap = visible.length > 1 ? GAP : 0;
      const arc = {
        ...part,
        dash: `${round(length - gap)} ${round(100 - length + gap)}`,
        offset: round(25 - start),
      };
      start += length;
      return arc;
    });
  });

  protected readonly description = computed(
    () =>
      `${this.subject()}: ` + this.parts().map((part) => `${part.label} ${part.value}`).join(', '),
  );
}
