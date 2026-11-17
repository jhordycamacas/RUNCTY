import { Component, input } from '@angular/core';
import { IonIcon } from '@ionic/angular';

export type PastelTone = 'pink' | 'peach' | 'sky' | 'lavender' | 'mint';

/**
 * A headline figure on a pastel card: a small-caps label, a large number and a short hint. With
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
      border-radius: var(--rc-radius-lg);
      color: var(--rc-on-pastel);
      background: var(--tone);
    }

    .tone-pink {
      --tone: var(--rc-pastel-pink);
    }
    .tone-peach {
      --tone: var(--rc-pastel-peach);
    }
    .tone-sky {
      --tone: var(--rc-pastel-sky);
    }
    .tone-lavender {
      --tone: var(--rc-pastel-lavender);
    }
    .tone-mint {
      --tone: var(--rc-pastel-mint);
    }

    .icon {
      display: grid;
      place-items: center;
      width: 2.5rem;
      height: 2.5rem;
      border-radius: var(--rc-radius-pill);
      background: var(--rc-surface-elevated);
      color: var(--rc-primary-text);
      font-size: 1.25rem;
    }

    p {
      margin: 0;
    }

    .label {
      font-size: var(--rc-font-size-caption);
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .value,
    .badge,
    .hint {
      grid-column: 1 / -1;
    }

    .value {
      margin-top: var(--rc-space-sm);
      font-size: 2.25rem;
      font-weight: 800;
      line-height: 1.05;
      letter-spacing: -0.02em;
    }

    .badge {
      justify-self: start;
      margin-top: var(--rc-space-sm);
      padding: var(--rc-space-xs) var(--rc-space-md);
      border-radius: var(--rc-radius-pill);
      background: var(--rc-surface-elevated);
      color: var(--rc-text);
      font-size: var(--rc-font-size-label);
      font-weight: 700;
    }

    .hint {
      font-size: var(--rc-font-size-label);
      opacity: 0.85;
    }

    .soon {
      border: 1.5px dashed var(--rc-control-border);
    }
  `,
})
export class KpiTile {
  readonly label = input.required<string>();
  readonly icon = input.required<string>();
  readonly value = input<string | number>('');
  readonly hint = input<string>('');
  readonly tone = input<PastelTone>('pink');
  readonly soon = input(false);
}
