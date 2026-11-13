import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { chevronForward, fitnessOutline, optionsOutline, personOutline } from 'ionicons/icons';
import { ProfileStore } from '../account/application/profile.store';
import { EmailVerificationBanner } from '../auth/presentation/email-verification-banner';
import { RunnerCity } from '../routes/application/runner-city';
import { RecommendedRoutes } from '../routes/presentation/recommended-routes';
import { Notice } from '../shared/ui/notice';

addIcons({ chevronForward, fitnessOutline, optionsOutline, personOutline });

const LINKS = [
  { icon: 'person-outline', title: 'Datos personales', link: '/app/cuenta/datos' },
  { icon: 'fitness-outline', title: 'Perfil deportivo', link: '/app/cuenta/deportivo' },
  { icon: 'options-outline', title: 'Preferencias', link: '/app/cuenta/preferencias' },
];

/**
 * Runner home: the greeting and the recommended routes of the runner's city. A failed profile load
 * has its own retry; the routes section tells loading, errors, a missing city and an empty city
 * apart by itself.
 */
@Component({
  selector: 'app-runner-home-page',
  imports: [
    RouterLink,
    EmailVerificationBanner,
    RecommendedRoutes,
    IonButton,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonSpinner,
    IonTitle,
    IonToolbar,
    Notice,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Inicio</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <app-email-verification-banner />

      @if (profile(); as data) {
        <h1>Hola, {{ data.firstName }}</h1>
        @if (city.cityName(); as place) {
          <p class="muted">Tu ciudad: {{ place }}</p>
        }
        <app-recommended-routes />
      } @else if (store.loading()) {
        <p class="state" role="status"><ion-spinner name="crescent" /> Cargando tu inicio…</p>
      } @else if (store.error(); as failure) {
        <app-notice [message]="failure" />
        <ion-button fill="outline" (click)="reload()">Reintentar</ion-button>
      }

      <h2>Accesos rápidos</h2>
      <ion-list inset="true" lines="full">
        @for (item of links; track item.link) {
          <ion-item button detail="false" [routerLink]="item.link">
            <ion-icon [name]="item.icon" slot="start" aria-hidden="true" />
            <ion-label>{{ item.title }}</ion-label>
            <ion-icon name="chevron-forward" slot="end" aria-hidden="true" />
          </ion-item>
        }
      </ion-list>
    </ion-content>
  `,
  styles: `
    h1 {
      margin: var(--rc-space-lg) 0 var(--rc-space-xs);
      font-size: var(--rc-font-size-title);
    }

    h2 {
      margin: var(--rc-space-xl) 0 var(--rc-space-sm);
      font-size: var(--rc-font-size-subtitle);
    }

    .muted {
      margin: 0 0 var(--rc-space-lg);
      color: var(--rc-text-muted);
    }

    .state {
      display: flex;
      align-items: center;
      gap: var(--rc-space-sm);
      color: var(--rc-text-muted);
    }

    ion-list {
      margin-inline: 0;
    }
  `,
})
export class RunnerHomePage {
  protected readonly store = inject(ProfileStore);
  protected readonly city = inject(RunnerCity);

  protected readonly links = LINKS;
  protected readonly profile = this.store.profile;

  constructor() {
    this.reload();
  }

  protected reload(): void {
    void this.store.load();
  }
}
