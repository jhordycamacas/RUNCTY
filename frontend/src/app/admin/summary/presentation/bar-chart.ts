import { Component, computed, input } from '@angular/core';
import { ChartColor, colorVar, niceMax } from './chart-math';

export interface Bar {
  label: string;
  value: number;
}

const NUMBER = new Intl.NumberFormat('es', { maximumFractionDigits: 1 });

/**
 * Vertical bars on a baseline with two gridlines, the value over each bar and the category
 * under it (truncated, with the full name in a title). A hidden table repeats the data.
 */
@Component({
  selector: 'app-bar-chart',
  template: `
    @if (bars().length === 0) {
      <p class="none">Sin datos todavía.</p>
    } @else {
      <div class="plot" role="img" [attr.aria-label]="description()">
        <div class="area">
          <span class="line top"
            ><i class="tick top">{{ axisMax() }}</i></span
          >
          <span class="line mid"></span>
          <span class="line base"><i class="tick">0</i></span>
          <div class="columns" [style.grid-template-columns]="columns()">
            @for (bar of rows(); track bar.label) {
              <div class="bar-col" [title]="bar.title">
                <span class="value">{{ bar.text }}</span>
                <span
                  class="bar"
                  [style.height.%]="bar.percent"
                  [style.background]="color()"
                ></span>
              </div>
            }
          </div>
        </div>
        <div class="categories" [style.grid-template-columns]="columns()">
          @for (bar of rows(); track bar.label) {
            <span class="category" [attr.title]="bar.label">{{ bar.label }}</span>
          }
        </div>
      </div>
      <div class="sr-only">
        <table>
          <caption>
            {{
              subject()
            }}
          </caption>
          <thead>
            <tr>
              <th scope="col">Categoría</th>
              <th scope="col">Valor</th>
            </tr>
          </thead>
          <tbody>
            @for (bar of rows(); track bar.label) {
              <tr>
                <td>{{ bar.label }}</td>
                <td>{{ bar.title }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .none {
      margin: 0;
      color: var(--rc-text-muted);
    }

    .plot {
      padding-inline-start: 2rem;
    }

    .area {
      position: relative;
      height: 10rem;
      margin-top: 1.5rem;
    }

    .line {
      position: absolute;
      inset-inline: 0;
      border-top: 1px dashed var(--rc-border);
    }

    .line.top {
      top: 0;
    }

    .line.mid {
      top: 50%;
    }

    .line.base {
      bottom: 0;
      border-top: 1px solid var(--rc-control-border);
    }

    .tick {
      position: absolute;
      inset-inline-end: calc(100% + 0.4rem);
      top: 0;
      transform: translateY(-50%);
      font-size: var(--rc-font-size-caption);
      font-style: normal;
      color: var(--rc-text-muted);
    }

    .columns {
      position: absolute;
      inset: 0;
      display: grid;
      gap: var(--rc-space-sm);
    }

    .bar-col {
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      align-items: center;
      min-width: 0;
      height: 100%;
    }

    .value {
      font-size: var(--rc-font-size-label);
      font-weight: 800;
      font-variant-numeric: tabular-nums;
    }

    .bar {
      display: block;
      width: min(100%, 2.5rem);
      min-height: 2px;
      border-radius: 6px 6px 0 0;
      transform-origin: bottom;
      animation: grow 0.6s ease-out;
    }

    @keyframes grow {
      from {
        transform: scaleY(0);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .bar {
        animation: none;
      }
    }

    .categories {
      display: grid;
      gap: var(--rc-space-sm);
      margin-top: var(--rc-space-sm);
    }

    .category {
      overflow: hidden;
      text-align: center;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: var(--rc-font-size-caption);
      color: var(--rc-text-muted);
    }
  `,
})
export class BarChart {
  readonly bars = input.required<readonly Bar[]>();
  /** What the chart measures, for the accessible description. */
  readonly subject = input.required<string>();
  /** Unit written in the tooltip and the table, such as `km`. */
  readonly unit = input('');
  readonly colorName = input<ChartColor>('fuchsia');

  protected readonly color = computed(() => colorVar(this.colorName()));
  protected readonly columns = computed(() => `repeat(${this.bars().length}, minmax(0, 1fr))`);
  private readonly max = computed(() => niceMax(Math.max(0, ...this.bars().map((b) => b.value))));
  protected readonly axisMax = computed(() => NUMBER.format(this.max()));

  protected readonly rows = computed(() => {
    const unit = this.unit() ? ` ${this.unit()}` : '';
    return this.bars().map((bar) => ({
      ...bar,
      text: NUMBER.format(bar.value),
      title: `${bar.label}: ${NUMBER.format(bar.value)}${unit}`,
      percent: (bar.value / this.max()) * 100,
    }));
  });

  protected readonly description = computed(
    () =>
      `${this.subject()}: ` +
      this.bars()
        .map((bar) => `${bar.label} ${NUMBER.format(bar.value)}`)
        .join(', '),
  );
}
