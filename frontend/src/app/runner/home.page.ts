import { Component, computed, inject } from '@angular/core';
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
import { CitiesStore } from '../cities/application/cities.store';
import { Notice } from '../shared/ui/notice';

addIcons({ chevronForward, fitnessOutline, optionsOutline, personOutline });

const LINKS = [
  { icon: 'person-outline', title: 'Datos personales', link: '/app/cuenta/datos' },
  { icon: 'fitness-outline', title: 'Perfil deportivo', link: '/app/cuenta/deportivo' },
  { icon: 'options-outline', title: 'Preferencias', link: '/app/cuenta/preferencias' },
];

/**
 * Runner home. Each situation has its own state, so none is mistaken for an empty list: loading,
 * a failed load (with retry), an account whose city is not set (or no longer exists) and the
 * normal view. The routes of the city arrive with the routes screens.
 */
@Component({
  selector: 'app-runner-home-page',
  imports: [
    RouterLink,
    EmailVerificationBanner,
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
        @if (cityName(); as place) {
          <p class="muted">Tu ciudad: {{ place }}</p>
          <section class="card" aria-labelledby="routes-title">
            <h2 id="routes-title">Rutas seguras</h2>
            <p>Pronto verás aquí las rutas seguras de {{ place }}.</p>
          </section>
        } @else if (cities.error(); as failure) {
          <app-notice [message]="failure" />
          <ion-button fill="outline" (click)="reload()">Reintentar</ion-button>
        } @else if (cities.cities() === null) {
          <p class="state" role="status"><ion-spinner name="crescent" /> Cargando tu ciudad…</p>
        } @else {
          <section class="card" aria-labelledby="no-city-title">
            <h2 id="no-city-title">Elige tu ciudad</h2>
            <p>
              No encontramos tu ciudad en el catálogo. Elígela para ver las rutas seguras cerca de
              ti.
            </p>
            <ion-button routerLink="/app/cuenta/datos">Elegir ciudad</ion-button>
          </section>
        }
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

    .card {
      padding: var(--rc-space-lg);
      border: 1px solid var(--rc-border);
      border-radius: var(--rc-radius-md);
      background: var(--rc-surface);
    }

    .card h2 {
      margin-top: 0;
    }

    .card p {
      margin: 0 0 var(--rc-space-md);
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
  protected readonly cities = inject(CitiesStore);

  protected readonly links = LINKS;
  protected readonly profile = this.store.profile;
  /** The name of the user's city; `null` while the catalogue loads or when the city is not in it. */
  protected readonly cityName = computed(() => {
    const id = this.profile()?.cityId;
    return id ? (this.cities.byId().get(id)?.name ?? null) : null;
  });

  constructor() {
    this.reload();
  }

  protected reload(): void {
    void this.store.load();
    void this.cities.load();
  }
}
