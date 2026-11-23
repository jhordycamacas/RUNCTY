import { Component, computed, input } from '@angular/core';
import { IonIcon } from '@ionic/angular';

const NUMBER = new Intl.NumberFormat('es-EC', { maximumFractionDigits: 1 });

/**
 * A headline figure on a rounded tile with a very soft slate-teal tint, so the number is what stands
 * out and not the background: an icon chip and a label, a large thin number and a short hint.
 */
@Component({
  selector: 'app-kpi-tile',
  imports: [IonIcon],
  template: `
    <article class="tile">
      <span class="icon"><ion-icon [name]="icon()" aria-hidden="true" /></span>
      <p class="label">{{ label() }}</p>
      <p class="value">{{ shown() }}</p>
      @if (hint(); as text) {
        <p class="hint">{{ text }}</p>
      }
    </article>
  `,
  styles: `
    :host {
      display: block;
    }

    .tile {
      display: grid;
      grid-template-columns: auto 1fr;
      align-items: center;
      gap: var(--rc-space-xs) var(--rc-space-sm);
      height: 100%;
      padding: var(--rc-space-lg);
      border-radius: var(--rc-radius-md);
      background: var(--rc-tile-tint);
      color: var(--rc-text);
    }

    .icon {
      display: grid;
      place-items: center;
      width: 2rem;
      height: 2rem;
      border-radius: var(--rc-radius-pill);
      background: color-mix(in srgb, var(--rc-chart-accent) 22%, transparent);
      color: var(--rc-text);
      font-size: 1.05rem;
    }

    p {
      margin: 0;
    }

    .label {
      font-size: var(--rc-font-size-label);
      font-weight: 500;
      color: var(--rc-text-muted);
    }

    .value,
    .hint {
      grid-column: 1 / -1;
    }

    // A large, thin figure, as in the reference dashboards.
    .value {
      margin-top: var(--rc-space-md);
      font-size: 2.75rem;
      font-weight: var(--rc-font-weight-figure);
      line-height: 1;
      letter-spacing: -0.03em;
      font-variant-numeric: tabular-nums;
    }

    .hint {
      font-size: var(--rc-font-size-label);
      color: var(--rc-text-muted);
    }
  `,
})
export class KpiTile {
  readonly label = input.required<string>();
  readonly icon = input.required<string>();
  readonly value = input<string | number>('');
  readonly hint = input<string>('');

  /** Numbers are written the Spanish way (`1.200`, `41,3`). */
  protected readonly shown = computed(() => {
    const value = this.value();
    return typeof value === 'number' ? NUMBER.format(value) : value;
  });
}
