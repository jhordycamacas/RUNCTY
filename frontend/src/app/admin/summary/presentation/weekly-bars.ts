import { Component, computed, input } from '@angular/core';
import { WeekCount } from '../domain/summary';

const WEEK_FORMAT = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', timeZone: 'UTC' });

/** `2026-11-16` as "16 nov" (the date is a plain calendar day: no timezone shift). */
export function weekLabel(weekStart: string): string {
  return WEEK_FORMAT.format(new Date(`${weekStart}T00:00:00Z`)).replace('.', '');
}

/**
 * Weekly columns with their number above each one and the week under it. A visually hidden table
 * repeats the figures for screen readers.
 */
@Component({
  selector: 'app-weekly-bars',
  template: `
    <div class="chart" aria-hidden="true">
      @for (week of columns(); track week.weekStart) {
        <div class="column" [class.current]="week.current">
          <span class="number">{{ week.count }}</span>
          <span class="stem"><span class="fill" [style.height.%]="week.percent"></span></span>
          <span class="week">{{ week.label }}</span>
        </div>
      }
    </div>
    <table class="sr-only">
      <caption>
        {{ caption }}
      </caption>
      <thead>
        <tr>
          <th scope="col">Semana que empieza el</th>
          <th scope="col">Altas</th>
        </tr>
      </thead>
      <tbody>
        @for (week of columns(); track week.weekStart) {
          <tr>
            <td>{{ week.label }}</td>
            <td>{{ week.count }}</td>
          </tr>
        }
      </tbody>
    </table>
  `,
  styles: `
    .chart {
      display: grid;
      grid-auto-flow: column;
      grid-auto-columns: 1fr;
      gap: var(--rc-space-sm);
      align-items: end;
      height: 11rem;
    }

    .column {
      display: grid;
      grid-template-rows: auto 1fr auto;
      justify-items: center;
      gap: var(--rc-space-xs);
      height: 100%;
      min-width: 0;
    }

    .number {
      font-size: var(--rc-font-size-label);
      font-weight: 800;
    }

    .stem {
      display: flex;
      align-items: flex-end;
      width: min(100%, 2.25rem);
      height: 100%;
      border-radius: var(--rc-radius-sm);
      background: var(--rc-progress-track);
      overflow: hidden;
    }

    .fill {
      display: block;
      width: 100%;
      min-height: 0;
      border-radius: var(--rc-radius-sm) var(--rc-radius-sm) 0 0;
      background: var(--rc-primary-text);
      opacity: 0.45;
    }

    .current .fill {
      opacity: 1;
    }

    .week {
      font-size: var(--rc-font-size-caption);
      color: var(--rc-text-muted);
      white-space: nowrap;
    }

    .current .week {
      color: var(--rc-text);
      font-weight: 800;
    }
  `,
})
export class WeeklyBars {
  readonly weeks = input.required<readonly WeekCount[]>();

  protected readonly columns = computed(() => {
    const max = Math.max(0, ...this.weeks().map((week) => week.count));
    const last = this.weeks().length - 1;
    return this.weeks().map((week, index) => ({
      ...week,
      label: weekLabel(week.weekStart),
      percent: max === 0 ? 0 : Math.max(week.count > 0 ? 6 : 0, (week.count / max) * 100),
      current: index === last,
    }));
  });

  protected readonly caption =
    'Altas por semana, de la más antigua a la actual (la última es la semana en curso).';
}
