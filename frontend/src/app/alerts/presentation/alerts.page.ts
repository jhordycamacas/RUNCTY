import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonContent, IonIcon, IonSpinner } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { shieldCheckmarkOutline } from 'ionicons/icons';
import { RunnerCity } from '../../routes/application/runner-city';
import { Notice } from '../../shared/ui/notice';
import { SubpageHeader } from '../../shared/ui/subpage-header';
import { RiskZoneAlertsStore } from '../application/risk-zone-alerts.store';
import { RiskZoneAlertItem } from './risk-zone-alert-item';

addIcons({ shieldCheckmarkOutline });

/**
 * «Notificaciones» page (opened from the bell of each tab): the risk-zone alerts in force in the
 * runner's city (RF-07-12 to RF-07-15), shown as notifications. The notifications of EP-18 will
 * join this list later.
 */
@Component({
  selector: 'app-alerts-page',
  imports: [
    RouterLink,
    IonButton,
    IonContent,
    IonIcon,
    IonSpinner,
    Notice,
    RiskZoneAlertItem,
    SubpageHeader,
  ],
  template: `
    <app-subpage-header title="Notificaciones" backTo="/app/inicio" />
    <ion-content>
      <div class="page">
        <p class="intro">
          Te avisamos de las zonas de riesgo vigentes en tu ciudad, como robos reportados o calles
          sin iluminación, para que elijas mejor dónde y cuándo correr.
        </p>

        @switch (state().kind) {
          @case ('loading') {
            <p class="state" role="status"><ion-spinner name="crescent" /> Cargando notificaciones…</p>
          }
          @case ('error') {
            <app-notice [message]="errorMessage()" />
            <ion-button fill="outline" (click)="store.reload()">Reintentar</ion-button>
          }
          @case ('no-city') {
            <section class="empty">
              <h2>Elige tu ciudad</h2>
              <p>Así podremos mostrarte las notificaciones de la zona donde corres.</p>
              <ion-button routerLink="/app/cuenta/datos">Elegir ciudad</ion-button>
            </section>
          }
          @default {
            @if (alerts().length === 0) {
              <section class="empty" role="status">
                <span class="badge" aria-hidden="true"
                  ><ion-icon name="shield-checkmark-outline"
                /></span>
                <h2>No tienes notificaciones</h2>
                @if (city.cityName(); as name) {
                  <p>Cuando se reporte una zona de riesgo en {{ name }}, la verás aquí.</p>
                }
              </section>
            } @else {
              <h2 class="count">
                {{ alerts().length }}
                {{ alerts().length === 1 ? 'notificación' : 'notificaciones' }}
              </h2>
              <ul>
                @for (alert of alerts(); track alert.id) {
                  <li><app-risk-zone-alert-item [alert]="alert" /></li>
                }
              </ul>
            }
          }
        }
      </div>
    </ion-content>
  `,
  styles: `
    .page {
      display: grid;
      gap: var(--rc-space-lg);
      padding: var(--rc-space-sm) var(--rc-space-lg) var(--rc-space-xxl);
    }

    .intro {
      margin: 0;
      color: var(--rc-text-muted);
    }

    .state {
      display: flex;
      align-items: center;
      gap: var(--rc-space-sm);
      color: var(--rc-text-muted);
    }

    .empty {
      display: grid;
      justify-items: center;
      gap: var(--rc-space-sm);
      padding: var(--rc-space-xxl) var(--rc-space-lg);
      border-radius: var(--rc-radius-lg);
      background: var(--rc-surface-elevated);
      text-align: center;
    }

    .badge {
      display: grid;
      place-items: center;
      width: 3.5rem;
      height: 3.5rem;
      margin-bottom: var(--rc-space-sm);
      border-radius: var(--rc-radius-pill);
      background: var(--rc-primary-tint);
      color: var(--rc-text-muted);
      font-size: 1.75rem;
    }

    h2 {
      margin: 0;
      font-size: var(--rc-font-size-subtitle);
      font-weight: 600;
    }

    .empty p {
      margin: 0;
      color: var(--rc-text-muted);
    }

    ul {
      display: grid;
      gap: var(--rc-space-md);
      margin: 0;
      padding: 0;
      list-style: none;
    }
  `,
})
export class AlertsPage {
  protected readonly store = inject(RiskZoneAlertsStore);
  protected readonly city = inject(RunnerCity);

  protected readonly state = this.store.state;
  protected readonly alerts = computed(() => {
    const state = this.state();
    return state.kind === 'ready' ? state.alerts : [];
  });
  protected readonly errorMessage = computed(() => {
    const state = this.state();
    return state.kind === 'error' ? state.message : null;
  });

  constructor() {
    void this.store.load();
  }
}
