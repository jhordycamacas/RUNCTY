import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonButtons, IonHeader, IonIcon, IonTitle, IonToolbar } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { notificationsOutline } from 'ionicons/icons';
import { BrandLogo } from './brand-logo';

addIcons({ notificationsOutline });

/**
 * Header of a runner tab: a clean bar on the page color (see `_areas.scss`) with the club logo, a
 * large left-aligned title and, on the right, the bell that opens the notifications. The logo is
 * decorative; the title names the screen.
 */
@Component({
  selector: 'app-tab-header',
  imports: [BrandLogo, RouterLink,IonButton, IonButtons, IonHeader, IonIcon, IonTitle, IonToolbar],
  template: `
    <ion-header>
      <ion-toolbar>
        <app-brand-logo slot="start" size="2.25rem" />
        <ion-title>{{ title() }}</ion-title>
        <ion-buttons slot="end">
          <ion-button class="bell" routerLink="/app/notificaciones" aria-label="Notificaciones">
            <ion-icon slot="icon-only" name="notifications-outline" aria-hidden="true" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
  `,
  styles: `
    ion-title {
      padding-inline: var(--rc-space-md);
      text-align: start;
    }

    .bell {
      --color: var(--rc-text);
      min-width: var(--rc-min-touch-target);
      font-size: 1.25rem;
    }
  `,
})
export class TabHeader {
  readonly title = input.required<string>();
}
