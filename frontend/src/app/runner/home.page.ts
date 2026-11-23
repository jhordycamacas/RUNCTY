import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonContent, IonIcon, IonSpinner } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { locationOutline, play, shieldCheckmarkOutline, warningOutline } from 'ionicons/icons';
import { ProfileStore } from '../account/application/profile.store';
import { RiskZoneAlertsStore } from '../alerts/application/risk-zone-alerts.store';
import { ALERT_SEVERITY_LABELS } from '../alerts/domain/labels';
import { RiskZoneAlert } from '../alerts/domain/risk-zone-alert';
import { EmailVerificationBanner } from '../auth/presentation/email-verification-banner';
import { CityRoutes } from '../routes/application/city-routes';
import { RunnerCity } from '../routes/application/runner-city';
import {
  listTimeSlots,
  resolveSlotKey,
  routeSafetyForSlot,
  sortRoutesForSlot,
} from '../routes/domain/catalog';
import { SAFETY_LEVEL_LABELS } from '../routes/domain/labels';
import { RecommendedRoutes } from '../routes/presentation/recommended-routes';
import { Notice } from '../shared/ui/notice';
import { TabHeader } from '../shared/ui/tab-header';

addIcons({ locationOutline, play, shieldCheckmarkOutline, warningOutline });

/** How many zone alerts the «Novedades» strip shows. */
const NEWS_ALERTS = 2;

/**
 * Runner home: the greeting with the city and a modest «Correr» shortcut, a «Novedades» strip
 * (the latest risk-zone alerts and the safest route for the current time slot, all from data the
 * app already has) and the recommended routes. A failed profile load has its own retry; the routes
 * section tells loading, errors, a missing city and an empty city apart by itself.
 */
@Component({
  selector: 'app-runner-home-page',
  imports: [
    EmailVerificationBanner,
    RecommendedRoutes,
    RouterLink,
    IonButton,
    IonContent,
    IonIcon,
    IonSpinner,
    Notice,
    TabHeader,
  ],
  template: `
    <app-tab-header title="Inicio" />
    <ion-content>
      <div class="page">
        <app-email-verification-banner />

        @if (profile(); as data) {
          <section class="hello" aria-labelledby="greeting-title">
            <div>
              <h1 id="greeting-title">Hola, {{ data.firstName }}</h1>
              @if (city.cityName(); as place) {
                <p class="place">
                  <ion-icon name="location-outline" aria-hidden="true" />
                  Tu ciudad: {{ place }}
                </p>
              }
            </div>
            <a class="run-shortcut" routerLink="/app/correr">
              <ion-icon name="play" aria-hidden="true" /> Correr
            </a>
          </section>

          @if (latestAlerts().length > 0 || safest()) {
            <section class="news" aria-labelledby="news-title">
              <h2 id="news-title">Novedades</h2>
              <div class="news-strip">
                @for (alert of latestAlerts(); track alert.id) {
                  <a class="news-card alert" routerLink="/app/notificaciones">
                    <ion-icon name="warning-outline" aria-hidden="true" />
                    <span class="kicker">Zona de riesgo</span>
                    <span class="headline">{{ alert.type }}</span>
                    <span class="note">{{ severityLabel(alert) }}</span>
                  </a>
                }
                @if (safest(); as best) {
                  <a class="news-card route" [routerLink]="['/app/rutas', best.id]">
                    <ion-icon name="shield-checkmark-outline" aria-hidden="true" />
                    <span class="kicker">Más segura ahora</span>
                    <span class="headline">{{ best.name }}</span>
                    <span class="note">{{ best.level }}</span>
                  </a>
                }
              </div>
            </section>
          }
        } @else if (store.loading()) {
          <p class="state" role="status"><ion-spinner name="crescent" /> Cargando tu inicio…</p>
        } @else if (store.error(); as failure) {
          <app-notice [message]="failure" />
          <ion-button fill="outline" (click)="reload()">Reintentar</ion-button>
        }

        @if (profile()) {
          <app-recommended-routes [featured]="true" />
        }
      </div>
    </ion-content>
  `,
  styles: `
    .page {
      padding: var(--rc-space-sm) var(--rc-space-lg) var(--rc-space-xxl);
    }

    .hello {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--rc-space-md);
    }

    .hello h1 {
      margin: 0;
      font-size: var(--rc-font-size-display);
      font-weight: 600;
      letter-spacing: -0.02em;
    }

    .place {
      display: flex;
      align-items: center;
      gap: var(--rc-space-xs);
      margin: var(--rc-space-xs) 0 0;
      color: var(--rc-text-muted);
    }

    // Small filled pill in the brand violet with white text (6:1).
    .run-shortcut {
      display: inline-flex;
      flex: none;
      align-items: center;
      gap: var(--rc-space-xs);
      min-height: var(--rc-min-touch-target);
      padding: 0 var(--rc-space-lg);
      border-radius: var(--rc-radius-pill);
      background: var(--rc-primary);
      color: var(--rc-on-primary);
      font-size: var(--rc-font-size-label);
      font-weight: 700;
      text-decoration: none;
    }

    .run-shortcut:focus-visible,
    .news-card:focus-visible {
      outline: 3px solid var(--rc-primary-text);
      outline-offset: 3px;
    }

    .news {
      margin-top: var(--rc-space-lg);
    }

    .news h2 {
      margin: 0 0 var(--rc-space-sm);
      font-size: var(--rc-font-size-subtitle);
      font-weight: 600;
    }

    // A horizontal strip of compact cards that snap into place.
    .news-strip {
      display: flex;
      gap: var(--rc-space-sm);
      margin-inline: calc(var(--rc-space-lg) * -1);
      padding: 0 var(--rc-space-lg) var(--rc-space-xs);
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      scrollbar-width: none;
    }

    .news-card {
      display: grid;
      flex: 0 0 min(15rem, 72%);
      align-content: start;
      gap: var(--rc-space-xs);
      padding: var(--rc-space-md) var(--rc-space-lg);
      border: 1px solid var(--rc-border);
      border-radius: var(--rc-radius-lg);
      color: var(--rc-text);
      text-decoration: none;
      scroll-snap-align: start;
    }

    // Cool and warm accents, not only the brand color: amber for risk alerts, teal for the safest
    // route.
    .news-card.alert {
      background: var(--rc-warning-tint);
    }

    .news-card.route {
      background: var(--rc-tile-tint);
    }

    .news-card ion-icon {
      font-size: 1.375rem;
    }

    .news-card.alert ion-icon {
      color: var(--rc-warning);
    }

    .news-card.route ion-icon {
      color: var(--rc-chart-accent);
    }

    .kicker {
      color: var(--rc-text-muted);
      font-size: var(--rc-font-size-caption);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .headline {
      overflow: hidden;
      font-size: var(--rc-font-size-subtitle);
      font-weight: 600;
      line-height: 1.25;
      text-overflow: ellipsis;
    }

    .note {
      color: var(--rc-text-muted);
      font-size: var(--rc-font-size-label);
    }

    .state {
      display: flex;
      align-items: center;
      gap: var(--rc-space-sm);
      color: var(--rc-text-muted);
    }
  `,
})
export class RunnerHomePage {
  protected readonly store = inject(ProfileStore);
  protected readonly city = inject(RunnerCity);
  private readonly cityRoutes = inject(CityRoutes);
  private readonly alertsStore = inject(RiskZoneAlertsStore);

  protected readonly profile = this.store.profile;
  /** The first zone alerts in force, for the «Novedades» strip. */
  protected readonly latestAlerts = computed(() => {
    const state = this.alertsStore.state();
    return state.kind === 'ready' ? state.alerts.slice(0, NEWS_ALERTS) : [];
  });
  /** The best-rated route for the current or next time slot, when one is rated. */
  protected readonly safest = computed(() => {
    const routes = this.cityRoutes.routes();
    const slotKey = resolveSlotKey(listTimeSlots(routes), null, new Date());
    const best = sortRoutesForSlot(routes, slotKey)[0];
    const safety = best ? routeSafetyForSlot(best, slotKey) : null;
    return best && safety
      ? { id: best.id, name: best.name, level: SAFETY_LEVEL_LABELS[safety.level].full }
      : null;
  });

  constructor() {
    this.reload();
  }

  protected severityLabel(alert: RiskZoneAlert): string {
    return ALERT_SEVERITY_LABELS[alert.severity];
  }

  protected reload(): void {
    void this.store.load();
  }
}
