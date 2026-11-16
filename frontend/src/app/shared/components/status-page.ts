import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonContent, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { lockClosedOutline, mapOutline, shieldOutline } from 'ionicons/icons';

addIcons({ lockClosedOutline, mapOutline, shieldOutline });

/** Full-page message with one way out: 403, 404 and empty states share it. */
@Component({
  selector: 'app-status-page',
  imports: [IonButton, IonContent, IonIcon, RouterLink],
  template: `
    <ion-content>
      <main class="status">
        <ion-icon [name]="icon()" aria-hidden="true" />
        <h1>{{ title() }}</h1>
        <p>{{ message() }}</p>
        <ion-button [routerLink]="actionLink()">{{ actionLabel() }}</ion-button>
      </main>
    </ion-content>
  `,
  styles: `
    /* A wrapper inside the routed page: let ion-content fill the ion-page flex column. */
    :host {
      display: contents;
    }

    .status {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100%;
      padding: var(--rc-space-xl);
      text-align: center;
      gap: var(--rc-space-md);
    }

    ion-icon {
      font-size: 3.5rem;
      color: var(--rc-primary-text);
    }

    h1 {
      margin: 0;
      font-size: var(--rc-font-size-title);
    }

    p {
      margin: 0;
      max-width: 32rem;
      color: var(--rc-text-muted);
    }
  `,
})
export class StatusPage {
  readonly icon = input.required<'lock-closed-outline' | 'map-outline' | 'shield-outline'>();
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly actionLabel = input('Ir al inicio');
  readonly actionLink = input('/');
}
