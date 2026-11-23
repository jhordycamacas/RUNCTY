import { Component, computed, input } from '@angular/core';
import { ChartColor, colorVar } from './chart-math';

export interface BarSeries {
  name: string;
  color: ChartColor;
}

export interface BarGroup {
  label: string;
  /** One value per series, in the order of `series`. */
  values: readonly number[];
}

const NUMBER = new Intl.NumberFormat('es-EC', { maximumFractionDigits: 1 });

/**
 * Horizontal bars grouped by category (for example routes and users of each city). Every bar
 * shows its number and the legend names each series, so color is never the only signal; the
 * rows stack at any width. The text description and a hidden table repeat the data.
 */
@Component({
  selector: 'app-grouped-bars',
  template: `
    @if (groups().length === 0) {
      <p class="none">Sin datos todavía.</p>
    } @else {
      <ul class="legend" aria-hidden="true">
        @for (item of series(); track item.name) {
          <li><span class="dot" [style.background]="colorOf(item)"></span>{{ item.name }}</li>
        }
      </ul>
      <div class="rows" role="img" [attr.aria-label]="description()">
        @for (group of rows(); track group.label) {
          <div class="group" aria-hidden="true">
            <p class="name" [attr.title]="group.label">{{ group.label }}</p>
            @for (item of group.items; track item.series) {
              <div class="item" [title]="item.title">
                <span class="track"
                  ><span
                    class="bar"
                    [style.width.%]="item.percent"
                    [style.background]="item.color"
                  ></span
                ></span>
                <span class="number">{{ item.text }}</span>
              </div>
            }
          </div>
        }
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
              @for (item of series(); track item.name) {
                <th scope="col">{{ item.name }}</th>
              }
            </tr>
          </thead>
          <tbody>
            @for (group of rows(); track group.label) {
              <tr>
                <td>{{ group.label }}</td>
                @for (item of group.items; track item.series) {
                  <td>{{ item.text }}</td>
                }
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
  styles: `
    :host {
      display: grid;
      gap: var(--rc-space-lg);
    }

    .none {
      margin: 0;
      color: var(--rc-text-muted);
    }

    .legend {
      display: flex;
      flex-wrap: wrap;
      gap: var(--rc-space-md) var(--rc-space-lg);
      margin: 0;
      padding: 0;
      list-style: none;
      font-size: var(--rc-font-size-label);
    }

    .legend li {
      display: flex;
      align-items: center;
      gap: var(--rc-space-sm);
    }

    .dot {
      width: 0.75rem;
      height: 0.75rem;
      border-radius: var(--rc-radius-pill);
    }

    .rows {
      display: grid;
      gap: var(--rc-space-lg);
    }

    .group {
      display: grid;
      gap: var(--rc-space-xs);
      min-width: 0;
    }

    .name {
      overflow: hidden;
      margin: 0;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-weight: 600;
    }

    .item {
      display: grid;
      grid-template-columns: 1fr 3.5rem;
      align-items: center;
      gap: var(--rc-space-sm);
    }

    .track {
      display: block;
      height: 0.75rem;
      border-radius: var(--rc-radius-pill);
      background: var(--rc-progress-track);
      overflow: hidden;
    }

    .bar {
      display: block;
      height: 100%;
      border-radius: var(--rc-radius-pill);
      transform-origin: left;
      animation: grow 0.6s ease-out;
    }

    @keyframes grow {
      from {
        transform: scaleX(0);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .bar {
        animation: none;
      }
    }

    .number {
      font-weight: 800;
      font-variant-numeric: tabular-nums;
      text-align: end;
    }
  `,
})
export class GroupedBars {
  readonly groups = input.required<readonly BarGroup[]>();
  /** One entry per bar of a group; the legend and the colors come from here. */
  readonly series = input.required<readonly BarSeries[]>();
  /** What the chart measures, for the accessible description. */
  readonly subject = input.required<string>();

  protected readonly colorOf = (item: BarSeries): string => colorVar(item.color);

  private readonly max = computed(() =>
    Math.max(1, ...this.groups().flatMap((group) => group.values)),
  );

  protected readonly rows = computed(() =>
    this.groups().map((group) => ({
      label: group.label,
      items: this.series().map((item, index) => {
        const value = group.values[index] ?? 0;
        return {
          series: item.name,
          text: NUMBER.format(value),
          title: `${group.label}, ${item.name}: ${NUMBER.format(value)}`,
          percent: (value / this.max()) * 100,
          color: this.colorOf(item),
        };
      }),
    })),
  );

  protected readonly description = computed(
    () =>
      `${this.subject()}. ` +
      this.rows()
        .map(
          (group) =>
            `${group.label}: ${group.items.map((i) => `${i.series} ${i.text}`).join(', ')}`,
        )
        .join('. '),
  );
}
