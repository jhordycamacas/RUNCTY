import { Component } from '@angular/core';
import { IonIcon, IonLabel, IonTabBar, IonTabButton, IonTabs } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { homeOutline, personCircleOutline, trailSignOutline } from 'ionicons/icons';

addIcons({ homeOutline, personCircleOutline, trailSignOutline });

/**
 * Runner area layout: mobile-first, navigation in a bottom tab bar. The panic alert (EP-15) is
 * triggered with a hardware button, so there is no on-screen emergency button here.
 */
@Component({
  selector: 'app-runner-shell',
  imports: [IonIcon, IonLabel, IonTabBar, IonTabButton, IonTabs],
  host: { class: 'area-runner' },
  template: `
    <ion-tabs>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="inicio">
          <ion-icon name="home-outline" aria-hidden="true" />
          <ion-label>Inicio</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="rutas">
          <ion-icon name="trail-sign-outline" aria-hidden="true" />
          <ion-label>Rutas</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="cuenta">
          <ion-icon name="person-circle-outline" aria-hidden="true" />
          <ion-label>Cuenta</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  `,
  styles: `
    :host {
      display: contents;
    }

    ion-tab-button {
      min-height: var(--rc-min-touch-target);
    }
  `,
})
export class RunnerShell {}
