import { Component, computed, inject } from '@angular/core';
import { IonButton, IonContent, IonSpinner } from '@ionic/angular';
import { ProfileStore } from '../account/application/profile.store';
import { EmailVerificationBanner } from '../auth/presentation/email-verification-banner';
import { CityRoutes } from '../routes/application/city-routes';
import { RunnerCity } from '../routes/application/runner-city';
import { RecommendedRoutes } from '../routes/presentation/recommended-routes';
import { Notice } from '../shared/ui/notice';
import { TabHeader } from '../shared/ui/tab-header';

/**
 * Runner home: on the light top, the greeting card with the number of routes of the runner's city;
 * below, a dark band with the recommended routes as featured cards. A failed
 * profile load has its own retry; the routes section tells loading, errors, a missing city and an
 * empty city apart by itself.
 */
@Component({
  selector: 'app-runner-home-page',
  imports: [
    EmailVerificationBanner,
    RecommendedRoutes,
    IonButton,
    IonContent,
    IonSpinner,
    Notice,
    TabHeader,
  ],
  template: `
    <app-tab-header title="Inicio" />
    <ion-content>
      <div class="top">
        <app-email-verification-banner />

        @if (profile(); as data) {
          <section class="card greeting" aria-labelledby="greeting-title">
            <h1 id="greeting-title">Hola, {{ data.firstName }}</h1>
            @if (city.cityName(); as place) {
              <p class="muted">Tu ciudad: {{ place }}</p>
            }
            @if (routeCount() !== null) {
              <p class="figure">
                <span class="number">{{ routeCount() }}</span>
                <span class="muted">{{ routeCount() === 1 ? 'ruta activa' : 'rutas activas' }}</span>
              </p>
            }
          </section>
        } @else if (store.loading()) {
          <p class="state" role="status"><ion-spinner name="crescent" /> Cargando tu inicio…</p>
        } @else if (store.error(); as failure) {
          <app-notice [message]="failure" />
          <ion-button fill="outline" (click)="reload()">Reintentar</ion-button>
        }
      </div>

      @if (profile()) {
        <div class="rc-inverse band">
          <app-recommended-routes [featured]="true" />
        </div>
      }
    </ion-content>
  `,
  styles: `
    .top {
      padding: var(--rc-space-lg) var(--rc-space-lg) var(--rc-space-xl);
    }

    .card {
      padding: var(--rc-space-xl);
      border-radius: var(--rc-radius-lg);
      background: var(--rc-surface-elevated);
      box-shadow: var(--rc-shadow-sm);
    }

    h1 {
      margin: 0 0 var(--rc-space-xs);
      font-size: var(--rc-font-size-title);
      font-weight: 500;
    }

    .muted {
      margin: 0;
      color: var(--rc-text-muted);
    }

    // A large, thin figure, as in the reference.
    .figure {
      display: flex;
      align-items: baseline;
      gap: var(--rc-space-sm);
      margin: var(--rc-space-lg) 0 0;
    }

    .number {
      font-size: 3.5rem;
      font-weight: var(--rc-font-weight-figure);
      line-height: 1;
      letter-spacing: -0.03em;
      font-variant-numeric: tabular-nums;
    }

    .state {
      display: flex;
      align-items: center;
      gap: var(--rc-space-sm);
      color: var(--rc-text-muted);
    }

    // The dark lower section, rounded on top like a sheet, filling the rest of the screen.
    .band {
      min-height: 50%;
      padding: var(--rc-space-sm) var(--rc-space-lg) var(--rc-space-xxl);
      border-radius: var(--rc-radius-lg) var(--rc-radius-lg) 0 0;
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

  constructor() {
    this.reload();
  }

  protected reload(): void {
    void this.store.load();
  }
}
