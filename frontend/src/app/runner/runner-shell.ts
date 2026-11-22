import { Component } from '@angular/core';
import { IonIcon, IonLabel, IonTabBar, IonTabButton, IonTabs } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  homeOutline,
  peopleOutline,
  personCircleOutline,
  play,
  trailSignOutline,
} from 'ionicons/icons';

addIcons({ homeOutline, peopleOutline, personCircleOutline, play, trailSignOutline });

/**
 * Runner area layout: mobile-first, navigation in a bottom tab bar of five tabs with «Correr» as
 * the neon circle in the middle. The alerts open from the bell of each tab header. The panic alert
 * (EP-15) is triggered with a hardware button, so there is no on-screen emergency button here.
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
        <ion-tab-button tab="correr" class="run">
          <span class="run-circle" aria-hidden="true"><ion-icon name="play" /></span>
          <ion-label>Correr</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="clubes">
          <ion-icon name="people-outline" aria-hidden="true" />
          <ion-label>Clubes</ion-label>
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
      font-size: var(--rc-font-size-caption);
    }

    // «Correr» stands out: a neon circle (dark icon on it, 5.6:1) inside the bar, which is tall
    // enough for it (see _areas.scss). Lifting it with a negative margin would get it clipped by
    // the tab button's native element (overflow: hidden in its shadow DOM), so the glow is a
    // thin ring that stays inside the button too.
    .run-circle {
      display: grid;
      place-items: center;
      width: 3rem;
      height: 3rem;
      border-radius: var(--rc-radius-pill);
      background: var(--rc-primary);
      color: var(--rc-on-primary);
      font-size: 1.375rem;
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--rc-primary) 30%, transparent);
    }

    .run ion-label {
      margin-top: 2px;
    }
  `,
})
export class RunnerShell {}
