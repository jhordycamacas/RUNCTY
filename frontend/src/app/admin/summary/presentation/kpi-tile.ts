import { Component, input } from '@angular/core';
import { IonIcon } from '@ionic/angular';

export type AccentTone = 'fuchsia' | 'blue' | 'orange' | 'teal' | 'ink';

/**
 * A headline figure on a white card with a colored top bar: a small-caps label, a large number and a short hint. With
 * `soon` it announces a metric that does not exist yet and shows no number at all.
 */
@Component({
  selector: 'app-kpi-tile',
  imports: [IonIcon],
  template: `
    <article class="tile" [class]="'tone-' + tone()" [class.soon]="soon()">
      <span class="icon"><ion-icon [name]="icon()" aria-hidden="true" /></span>
      <p class="label">{{ label() }}</p>
      @if (soon()) {
        <p class="badge">Próximamente</p>
      } @else {
        <p class="value">{{ value() }}</p>
      }
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
      gap: var(--rc-space-xs) var(--rc-space-md);
      height: 100%;
      padding: var(--rc-space-lg) var(--rc-space-lg) var(--rc-space-xl);
      border: 1px solid var(--rc-border);
      border-top: 4px solid var(--tone);
      border-radius: var(--rc-radius-md);
      background: var(--rc-surface-elevated);
      box-shadow: var(--rc-shadow-sm);
      color: var(--rc-text);
    }

    .tone-fuchsia {
      --tone: var(--rc-primary);
    }
    .tone-blue {
      --tone: var(--rc-accent-blue);
    }
    .tone-orange {
      --tone: var(--rc-accent-orange);
    }
    .tone-teal {
      --tone: var(--rc-accent-teal);
    }
    .tone-ink {
      --tone: var(--rc-accent-ink);
    }

    .icon {
      display: grid;
      place-items: center;
      width: 2.25rem;
      height: 2.25rem;
      border-radius: var(--rc-radius-sm);
      background: var(--tone);
      color: var(--rc-on-accent);
      font-size: 1.25rem;
    }

    .tone-fuchsia .icon {
      color: var(--rc-on-primary);
    }

    p {
      margin: 0;
    }

    .label {
      font-size: var(--rc-font-size-caption);
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--rc-text-muted);
    }

    .value,
    .badge,
    .hint {
      grid-column: 1 / -1;
    }

    .value {
      margin-top: var(--rc-space-sm);
      font-size: 2.5rem;
      font-weight: 800;
      line-height: 1;
      letter-spacing: -0.03em;
      font-variant-numeric: tabular-nums;
    }

    .badge {
      justify-self: start;
      margin-top: var(--rc-space-sm);
      padding: var(--rc-space-xs) var(--rc-space-md);
      border-radius: var(--rc-radius-sm);
      background: var(--rc-surface);
      color: var(--rc-text);
      font-size: var(--rc-font-size-caption);
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .hint {
      font-size: var(--rc-font-size-label);
      color: var(--rc-text-muted);
    }

    .soon {
      border-style: dashed;
      border-top-style: dashed;
      background: transparent;
      box-shadow: none;
    }
  `,
})
export class KpiTile {
  readonly label = input.required<string>();
  readonly icon = input.required<string>();
  readonly value = input<string | number>('');
  readonly hint = input<string>('');
  readonly tone = input<AccentTone>('fuchsia');
  readonly soon = input(false);
}
