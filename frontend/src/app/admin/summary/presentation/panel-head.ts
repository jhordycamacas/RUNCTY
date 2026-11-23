import { Component, input } from '@angular/core';
import { IonIcon } from '@ionic/angular';

/** The header of a summary panel: a small icon chip, the title and a one-line explanation. */
@Component({
  selector: 'app-panel-head',
  imports: [IonIcon],
  template: `
    <header class="head">
      <span class="chip"><ion-icon [name]="icon()" aria-hidden="true" /></span>
      <div>
        <h2 [id]="titleId()">{{ title() }}</h2>
        <p class="note">{{ note() }}</p>
      </div>
    </header>
  `,
  styles: `
    :host {
      display: block;
    }

    .head {
      display: flex;
      align-items: flex-start;
      gap: var(--rc-space-md);
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
  `,
})
export class PanelHead {
  readonly icon = input.required<string>();
  readonly title = input.required<string>();
  readonly note = input.required<string>();
  /** The id of the heading, for the `aria-labelledby` of the panel. */
  readonly titleId = input.required<string>();
}
