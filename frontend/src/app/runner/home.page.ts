import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonContent, IonIcon, IonSpinner } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { chevronForward, locationOutline } from 'ionicons/icons';
import { ProfileStore } from '../account/application/profile.store';
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

addIcons({ chevronForward, locationOutline });

/**
 * Runner home: the greeting with the city, a hero card whose big «Empezar a correr» goes to the
 * «Correr» tab, a strip with the routes of the city and the safest one for the current time slot,
 * and the recommended routes. A failed profile load has its own retry; the routes section tells
 * loading, errors, a missing city and an empty city apart by itself.
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
            <h1 id="greeting-title">Hola, {{ data.firstName }}</h1>
            @if (city.cityName(); as place) {
              <p class="place">
                <ion-icon name="location-outline" aria-hidden="true" />
                Tu ciudad: {{ place }}
              </p>
            }
          </section>

          <section class="hero" aria-labelledby="hero-title">
            <p class="kicker">¿Listo para salir?</p>
            <h2 id="hero-title">Mide tu tiempo, distancia y ritmo en vivo</h2>
            <a class="cta" routerLink="/app/correr">
              Empezar a correr <ion-icon name="chevron-forward" aria-hidden="true" />
            </a>
          </section>

          @if (routeCount() !== null) {
            <section class="stats" aria-label="Tu ciudad hoy">
              <div class="stat">
                <span class="figure">{{ routeCount() }}</span>
                <span class="label">{{
                  routeCount() === 1 ? 'ruta disponible' : 'rutas disponibles'
                }}</span>
              </div>
              @if (safest(); as best) {
                <div class="stat">
                  <span class="name">{{ best.name }}</span>
                  <span class="label">{{ best.level }} ahora</span>
                </div>
              }
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

    // The hero: a dark card with a neon glow and the big «Empezar a correr» pill.
    .hero {
      display: grid;
      gap: var(--rc-space-sm);
      margin-top: var(--rc-space-xl);
      padding: var(--rc-space-xl) var(--rc-space-lg);
      border: 1px solid var(--rc-border);
      border-radius: var(--rc-radius-lg);
      background:
        radial-gradient(
          circle at 100% 0%,
          color-mix(in srgb, var(--rc-primary) 22%, transparent),
          transparent 60%
        ),
        var(--rc-surface-elevated);
    }

    .kicker {
      margin: 0;
      color: var(--rc-primary-text);
      font-size: var(--rc-font-size-label);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .hero h2 {
      margin: 0 0 var(--rc-space-md);
      font-size: var(--rc-font-size-title);
      font-weight: 600;
      line-height: 1.2;
    }

    // Dark text on the neon fill (5.6:1).
    .cta {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--rc-space-sm);
      min-height: 3.5rem;
      padding: 0 var(--rc-space-xl);
      border-radius: var(--rc-radius-pill);
      background: var(--rc-primary);
      color: var(--rc-on-primary);
      font-size: var(--rc-font-size-subtitle);
      font-weight: 700;
      text-decoration: none;
      box-shadow: 0 0 24px color-mix(in srgb, var(--rc-primary) 35%, transparent);
    }

    .cta:focus-visible {
      outline: 3px solid var(--rc-primary-text);
      outline-offset: 3px;
    }

    .stats {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1.6fr);
      gap: var(--rc-space-sm);
      margin-top: var(--rc-space-sm);
    }

    .stat {
      display: grid;
      align-content: space-between;
      gap: var(--rc-space-xs);
      min-width: 0;
      padding: var(--rc-space-lg);
      border-radius: var(--rc-radius-lg);
      background: var(--rc-surface-elevated);
    }

    .figure {
      font-family: var(--rc-font-family-display);
      font-size: 3rem;
      font-weight: 500;
      line-height: 1;
      color: var(--rc-primary-text);
    }

    .name {
      overflow: hidden;
      font-size: var(--rc-font-size-subtitle);
      font-weight: 600;
      line-height: 1.25;
      text-overflow: ellipsis;
    }

    .label {
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

  protected readonly profile = this.store.profile;
  /** How many routes the runner's city has, once they are loaded. */
  protected readonly routeCount = computed(() =>
    this.cityRoutes.state().kind === 'ready' ? this.cityRoutes.routes().length : null,
  );
  /** The best-rated route for the current or next time slot, when one is rated. */
  protected readonly safest = computed(() => {
    const routes = this.cityRoutes.routes();
    const slotKey = resolveSlotKey(listTimeSlots(routes), null, new Date());
    const best = sortRoutesForSlot(routes, slotKey)[0];
    const safety = best ? routeSafetyForSlot(best, slotKey) : null;
    return best && safety
      ? { name: best.name, level: SAFETY_LEVEL_LABELS[safety.level].full }
      : null;
  });

  constructor() {
    this.reload();
  }

  protected reload(): void {
    void this.store.load();
  }
}
