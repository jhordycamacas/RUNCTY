import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { IonIcon } from '@ionic/angular';
import { SIGNUP_RANGES, bucketLabel, bucketTitle } from '../domain/labels';
import { SignupRange, Signups } from '../domain/summary';
import { niceAxisTop } from './chart-math';

const NUMBER = new Intl.NumberFormat('es-EC');

const HEIGHT = 240;
const MARGIN = { top: 14, right: 8, bottom: 30, left: 34 };
const DEFAULT_WIDTH = 640;
const MAX_BAR_WIDTH = 40;
const LABEL_CHAR_PX = 6.4;
const LABEL_GAP_PX = 12;
const TOOLTIP = { halfWidth: 84, height: 76, gap: 8 };
const SKELETON_HEIGHTS = [38, 52, 44, 64, 58, 72, 50, 80, 66, 90, 76, 96];

/** A rounded-top column from the baseline: `x`, `y` is its top-left corner. */
function columnPath(x: number, y: number, width: number, height: number): string {
  const r = Math.min(5, width / 2, height);
  return (
    `M${x} ${y + height}V${y + r}Q${x} ${y} ${x + r} ${y}H${x + width - r}` +
    `Q${x + width} ${y} ${x + width} ${y + r}V${y + height}Z`
  );
}

const plural = (count: number, one: string, many: string): string => (count === 1 ? one : many);

/**
 * The hero chart of the summary: new accounts per period as vertical bars, with a range switch
 * (30 days, 12 weeks, 12 months), a receding grid with three ticks and a tooltip that shows the
 * period, the new accounts and the accumulated total. Drawn as inline SVG at its real pixel
 * width, so text keeps its size and labels thin out on a narrow screen.
 */
@Component({
  selector: 'app-acquisition-chart',
  imports: [IonIcon],
  template: `
    <section class="card" aria-labelledby="acquisition-title">
      <header class="head">
        <div class="titles">
          <span class="chip"><ion-icon name="trending-up-outline" aria-hidden="true" /></span>
          <div>
            <h2 id="acquisition-title">Adquisición de nuevos usuarios</h2>
            <p class="note">
              Cuántas cuentas nuevas se crean en cada período. Pasa el cursor sobre una columna, o
              tócala, para ver cuántos usuarios hay en total.
            </p>
          </div>
        </div>
        <div class="ranges" role="group" aria-label="Rango de tiempo">
          @for (option of ranges; track option.id) {
            <button
              type="button"
              [attr.aria-pressed]="range() === option.id"
              (click)="choose(option.id)"
            >
              {{ option.label }}
            </button>
          }
        </div>
      </header>

      <div class="wrap" #wrap>
        @if (signups() === null) {
          <div class="skeleton" role="status" aria-busy="true">
            <span class="sr-only">Cargando la gráfica…</span>
            <div class="skeleton-bars" aria-hidden="true">
              @for (height of skeletonHeights; track $index) {
                <span [style.height.%]="height"></span>
              }
            </div>
          </div>
        } @else if (isEmpty()) {
          <p class="empty" role="status">
            Todavía no hay usuarios registrados. Cuando alguien cree su cuenta, aquí verás cómo
            crece la comunidad.
          </p>
        } @else {
          <p class="totals">{{ totals() }}</p>
          <div class="plot">
            <svg
              [attr.viewBox]="'0 0 ' + width() + ' ' + height"
              [attr.height]="height"
              role="group"
              [attr.aria-label]="description()"
              (keydown.escape)="activeIndex.set(null)"
            >
              @for (tick of ticks(); track tick.value) {
                <line
                  class="grid"
                  [class.base]="tick.value === 0"
                  [attr.x1]="margin.left"
                  [attr.x2]="width() - margin.right"
                  [attr.y1]="tick.y"
                  [attr.y2]="tick.y"
                />
                <text class="tick" [attr.x]="margin.left - 8" [attr.y]="tick.y + 4">
                  {{ tick.text }}
                </text>
              }
              @for (column of columns(); track column.start) {
                <g
                  class="column"
                  [class.active]="activeIndex() === column.index"
                  tabindex="0"
                  role="img"
                  [attr.aria-label]="column.aria"
                  (mouseenter)="activeIndex.set(column.index)"
                  (mouseleave)="release(column.index)"
                  (focus)="activeIndex.set(column.index)"
                  (blur)="release(column.index)"
                  (click)="activeIndex.set(column.index)"
                >
                  <rect
                    class="band"
                    [attr.x]="column.slotX"
                    [attr.y]="margin.top"
                    [attr.width]="slot()"
                    [attr.height]="plotHeight"
                  />
                  @if (column.count > 0) {
                    <path class="bar" [attr.d]="column.path" />
                  }
                  <rect
                    class="hit"
                    [attr.x]="column.slotX"
                    [attr.y]="margin.top"
                    [attr.width]="slot()"
                    [attr.height]="plotHeight"
                  />
                </g>
              }
              @for (label of labels(); track label.index) {
                <text class="x-label" [attr.x]="label.x" [attr.y]="height - 9">
                  {{ label.text }}
                </text>
              }
            </svg>
            @if (tooltip(); as tip) {
              <div
                class="tooltip"
                aria-hidden="true"
                [style.left.px]="tip.left"
                [style.top.px]="tip.top"
              >
                <strong>{{ tip.title }}</strong>
                <span class="line"><i class="dot"></i>{{ tip.created }}</span>
                <span class="line muted">{{ tip.accumulated }}</span>
              </div>
            }
          </div>
          <div class="sr-only">
            <table>
              <caption>
                Nuevos usuarios y total acumulado por período
              </caption>
              <thead>
                <tr>
                  <th scope="col">Período</th>
                  <th scope="col">Nuevos</th>
                  <th scope="col">Acumulados</th>
                </tr>
              </thead>
              <tbody>
                @for (column of columns(); track column.start) {
                  <tr>
                    <td>{{ column.title }}</td>
                    <td>{{ column.countText }}</td>
                    <td>{{ column.accumulatedText }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </section>
  `,
  styles: `
    :host {
      display: block;
    }

    .card {
      display: grid;
      gap: var(--rc-space-lg);
      min-width: 0;
      padding: var(--rc-space-xl);
      border: 1px solid var(--rc-border);
      border-radius: var(--rc-radius-lg);
      background: var(--rc-surface-elevated);
    }

    .head {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--rc-space-md) var(--rc-space-lg);
    }

    .titles {
      display: flex;
      align-items: flex-start;
      gap: var(--rc-space-md);
      min-width: 0;
    }

    .chip {
      display: grid;
      flex: none;
      place-items: center;
      width: 2rem;
      height: 2rem;
      border-radius: var(--rc-radius-pill);
      background: var(--rc-tile-tint);
      color: var(--rc-text);
    }

    h2 {
      margin: 0;
      font-size: var(--rc-font-size-subtitle);
      font-weight: 500;
    }

    .note {
      margin: 0;
      color: var(--rc-text-muted);
    }

    .ranges {
      display: flex;
      gap: var(--rc-space-xs);
      padding: var(--rc-space-xs);
      border: 1px solid var(--rc-border);
      border-radius: var(--rc-radius-pill);
    }

    .ranges button {
      min-height: 2.25rem;
      padding: 0 var(--rc-space-md);
      border: 0;
      border-radius: var(--rc-radius-pill);
      background: transparent;
      color: var(--rc-text-muted);
      font: inherit;
      font-size: var(--rc-font-size-label);
      cursor: pointer;
    }

    .ranges button[aria-pressed='true'] {
      background: color-mix(in srgb, var(--rc-chart-accent) 16%, var(--rc-surface-elevated));
      color: var(--rc-text);
      font-weight: 600;
    }

    .ranges button:focus-visible {
      outline: 2px solid var(--rc-primary-text);
      outline-offset: 1px;
    }

    .totals {
      margin: 0 0 var(--rc-space-sm);
      font-size: var(--rc-font-size-label);
      color: var(--rc-text-muted);
      font-variant-numeric: tabular-nums;
    }

    .wrap {
      min-width: 0;
    }

    .plot {
      position: relative;
    }

    svg {
      display: block;
      width: 100%;
      overflow: visible;
    }

    .grid {
      stroke: var(--rc-border);
      stroke-dasharray: 3 4;
    }

    .grid.base {
      stroke: var(--rc-control-border);
      stroke-dasharray: none;
    }

    .tick,
    .x-label {
      fill: var(--rc-text-muted);
      font-size: var(--rc-font-size-caption);
      font-variant-numeric: tabular-nums;
    }

    .tick {
      text-anchor: end;
    }

    .x-label {
      text-anchor: middle;
    }

    .column {
      cursor: pointer;
      outline: none;
    }

    .bar {
      fill: var(--rc-primary);
      transform-box: fill-box;
      transform-origin: bottom;
      animation: grow 0.5s ease-out;
    }

    .band {
      fill: var(--rc-primary);
      opacity: 0;
    }

    .column.active .band {
      opacity: 0.09;
    }

    .column:focus-visible .band {
      stroke: var(--rc-primary-text);
      stroke-width: 2;
    }

    .hit {
      fill: transparent;
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

    .tooltip {
      position: absolute;
      display: grid;
      gap: 2px;
      min-width: 9rem;
      padding: var(--rc-space-sm) var(--rc-space-md);
      border: 1px solid var(--rc-border);
      border-radius: var(--rc-radius-sm);
      background: var(--rc-surface-elevated);
      box-shadow: var(--rc-shadow-md);
      color: var(--rc-text);
      font-size: var(--rc-font-size-label);
      pointer-events: none;
      transform: translate(-50%, -100%);
      white-space: nowrap;
      z-index: 2;
    }

    .tooltip .line {
      display: flex;
      align-items: center;
      gap: var(--rc-space-sm);
      font-variant-numeric: tabular-nums;
    }

    .tooltip .muted {
      color: var(--rc-text-muted);
    }

    .dot {
      width: 0.6rem;
      height: 0.6rem;
      border-radius: 50%;
      background: var(--rc-primary);
    }

    .empty {
      margin: 0;
      padding: var(--rc-space-xl) 0;
      color: var(--rc-text-muted);
    }

    .skeleton {
      display: grid;
      height: 15rem;
      align-items: end;
    }

    .skeleton-bars {
      display: flex;
      align-items: flex-end;
      gap: var(--rc-space-sm);
      height: 100%;
    }

    .skeleton-bars span {
      flex: 1;
      border-radius: 6px 6px 0 0;
      background: var(--rc-border);
      animation: pulse 1.4s ease-in-out infinite;
    }

    @keyframes pulse {
      50% {
        opacity: 0.5;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .skeleton-bars span {
        animation: none;
      }
    }

    @media (max-width: 40rem) {
      .card {
        padding: var(--rc-space-lg);
      }

      .ranges {
        width: 100%;
      }

      .ranges button {
        flex: 1;
        padding: 0 var(--rc-space-sm);
      }
    }
  `,
})
export class AcquisitionChart {
  /** New accounts per range, or `null` while the summary loads (a skeleton is drawn). */
  readonly signups = input.required<Signups | null>();

  protected readonly ranges = SIGNUP_RANGES;
  protected readonly skeletonHeights = SKELETON_HEIGHTS;
  protected readonly height = HEIGHT;
  protected readonly margin = MARGIN;
  protected readonly plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

  protected readonly range = signal<SignupRange>('weekly');
  protected readonly width = signal(DEFAULT_WIDTH);
  protected readonly activeIndex = signal<number | null>(null);

  private readonly wrap = viewChild<ElementRef<HTMLElement>>('wrap');

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const element = this.wrap()?.nativeElement;
      if (!element || typeof ResizeObserver === 'undefined') return;
      const observer = new ResizeObserver(([entry]) => {
        const next = Math.floor(entry.contentRect.width);
        if (next > 0) this.width.set(next);
      });
      observer.observe(element);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  private readonly buckets = computed(() => this.signups()?.[this.range()] ?? []);
  private readonly before = computed(() => this.signups()?.before[this.range()] ?? 0);

  protected readonly isEmpty = computed(() => {
    const data = this.signups();
    if (data === null) return false;
    return SIGNUP_RANGES.every(({ id }) => {
      const created = data[id].reduce((sum, bucket) => sum + bucket.count, 0);
      return data.before[id] + created === 0;
    });
  });

  private readonly created = computed(() =>
    this.buckets().reduce((sum, bucket) => sum + bucket.count, 0),
  );

  protected readonly totals = computed(() => {
    const created = this.created();
    const word = plural(created, 'nuevo', 'nuevos');
    return `${NUMBER.format(created)} ${word} en el rango · ${NUMBER.format(this.before() + created)} en total`;
  });

  protected readonly slot = computed(
    () => (this.width() - MARGIN.left - MARGIN.right) / Math.max(1, this.buckets().length),
  );

  private readonly top = computed(() =>
    niceAxisTop(Math.max(0, ...this.buckets().map((bucket) => bucket.count))),
  );

  protected readonly ticks = computed(() =>
    [0, this.top() / 2, this.top()].map((value) => ({
      value,
      text: NUMBER.format(value),
      y: MARGIN.top + this.plotHeight * (1 - value / this.top()),
    })),
  );

  protected readonly columns = computed(() => {
    const range = this.range();
    const slot = this.slot();
    const top = this.top();
    let accumulated = this.before();
    return this.buckets().map((bucket, index) => {
      accumulated += bucket.count;
      const title = bucketTitle(range, bucket.start);
      const slotX = MARGIN.left + slot * index;
      const barWidth = Math.min(MAX_BAR_WIDTH, Math.max(3, slot * 0.62));
      const barHeight = (bucket.count / top) * this.plotHeight;
      const barTop = MARGIN.top + this.plotHeight - barHeight;
      const countText = `${NUMBER.format(bucket.count)} ${plural(bucket.count, 'nuevo', 'nuevos')}`;
      const accumulatedText = `${NUMBER.format(accumulated)} ${plural(accumulated, 'acumulado', 'acumulados')}`;
      return {
        index,
        start: bucket.start,
        count: bucket.count,
        title,
        countText,
        accumulatedText,
        aria: `${title}: ${countText}, ${accumulatedText}`,
        slotX,
        center: slotX + slot / 2,
        barTop,
        path: columnPath(slotX + (slot - barWidth) / 2, barTop, barWidth, barHeight),
      };
    });
  });

  /** Every k-th label, counting back from the current period, so none overlap. */
  protected readonly labels = computed(() => {
    const range = this.range();
    const items = this.buckets().map((bucket) => bucketLabel(range, bucket.start));
    const longest = Math.max(0, ...items.map((text) => text.length));
    const every = Math.max(1, Math.ceil((longest * LABEL_CHAR_PX + LABEL_GAP_PX) / this.slot()));
    const columns = this.columns();
    return items.flatMap((text, index) =>
      (items.length - 1 - index) % every === 0 ? [{ index, text, x: columns[index].center }] : [],
    );
  });

  protected readonly description = computed(() => {
    const label = SIGNUP_RANGES.find(({ id }) => id === this.range())?.label ?? '';
    return `Adquisición de nuevos usuarios, ${label}: ${this.totals()}.`;
  });

  protected readonly tooltip = computed(() => {
    const column = this.columns()[this.activeIndex() ?? -1];
    if (!column) return null;
    const half = Math.min(TOOLTIP.halfWidth, this.width() / 2);
    return {
      title: column.title,
      created: column.countText,
      accumulated: column.accumulatedText,
      left: Math.min(Math.max(column.center, half), this.width() - half),
      top: Math.max(column.barTop - TOOLTIP.gap, TOOLTIP.height),
    };
  });

  protected choose(range: SignupRange): void {
    this.range.set(range);
    this.activeIndex.set(null);
  }

  /** The pointer or the focus left `index`; another column may already have taken over. */
  protected release(index: number): void {
    this.activeIndex.update((current) => (current === index ? null : current));
  }
}
