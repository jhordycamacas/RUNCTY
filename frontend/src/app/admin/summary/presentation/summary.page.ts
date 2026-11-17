import { Component, computed, inject } from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonMenuButton,
  IonTitle,
  IonToolbar,
  ViewWillEnter,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  barbellOutline,
  businessOutline,
  calendarOutline,
  peopleOutline,
  personAddOutline,
  trailSignOutline,
  warningOutline,
} from 'ionicons/icons';
import { Notice } from '../../../shared/ui/notice';
import { SummaryStore } from '../application/summary.store';
import {
  appearanceLabel,
  difficultyLabel,
  greeting,
  roleLabel,
  severityLabel,
  surfaceLabel,
} from '../domain/labels';
import { RoutesByCity } from '../domain/summary';
import { BarItem, BarList } from './bar-list';
import { KpiTile } from './kpi-tile';
import { ProgressBar } from './progress-bar';
import { Segment, StackedBar } from './stacked-bar';
import { WeeklyBars } from './weekly-bars';

addIcons({
  alertCircleOutline,
  barbellOutline,
  businessOutline,
  calendarOutline,
  peopleOutline,
  personAddOutline,
  trailSignOutline,
  warningOutline,
});

const DATE_FORMAT = new Intl.DateTimeFormat('es', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const TIME_FORMAT = new Intl.DateTimeFormat('es', { hour: '2-digit', minute: '2-digit' });

const items = (counts: Record<string, number>, label: (key: string) => string): BarItem[] =>
  Object.entries(counts).map(([key, value]) => ({ label: label(key), value }));

/** The landing of the admin: real analytics of the mobile app. */
@Component({
  selector: 'app-summary-page',
  imports: [
    BarList,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonMenuButton,
    IonTitle,
    IonToolbar,
    KpiTile,
    Notice,
    ProgressBar,
    StackedBar,
    WeeklyBars,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button />
        </ion-buttons>
        <ion-title>Resumen</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="page">
        <header class="hero">
          <div>
            <p class="eyebrow">{{ today() }}</p>
            <h1>{{ greeting() }}</h1>
            <p class="lead">Así va la app móvil de Gacelas Running Team.</p>
          </div>
          <div class="refresh">
            @if (updated(); as time) {
              <span class="updated">Actualizado a las {{ time }}</span>
            }
            <ion-button
              fill="outline"
              size="small"
              [disabled]="store.loading()"
              (click)="store.load()"
              >Actualizar</ion-button
            >
          </div>
        </header>

        @if (store.error(); as failure) {
          <div class="state">
            <app-notice [message]="failure" />
            <ion-button fill="outline" (click)="store.load()">Reintentar</ion-button>
          </div>
        }

        @if (store.summary(); as summary) {
          @if (summary.truncated) {
            <app-notice
              tone="info"
              message="Hay más registros de los que se leen de una vez: las cifras son un mínimo."
            />
          }
          @if (store.isEmpty()) {
            <p class="state muted" role="status">
              Tu rol no tiene secciones con datos para mostrar en el resumen.
            </p>
          }

          <section class="kpis" aria-label="Cifras principales">
            @if (summary.users; as users) {
              <app-kpi-tile
                tone="pink"
                icon="people-outline"
                label="Usuarios"
                [value]="users.total"
                [hint]="users.sportProfiles.completed + ' con perfil deportivo'"
              />
              <app-kpi-tile
                tone="sky"
                icon="person-add-outline"
                label="Altas en 7 días"
                [value]="users.registeredLast7Days"
                [hint]="users.registeredLast30Days + ' en 30 días'"
              />
            }
            @if (summary.routes; as routes) {
              <app-kpi-tile
                tone="peach"
                icon="trail-sign-outline"
                label="Rutas activas"
                [value]="routes.active"
                [hint]="'de ' + routes.total + ' rutas · ' + routes.totalKm + ' km'"
              />
              <app-kpi-tile
                tone="lavender"
                icon="alert-circle-outline"
                label="Rutas con nivel Bajo"
                [value]="routes.safetyLevels.low"
                hint="en al menos una franja horaria"
              />
            }
            @if (summary.cities; as cities) {
              <app-kpi-tile
                tone="mint"
                icon="business-outline"
                label="Ciudades"
                [value]="cities.cities"
                [hint]="cities.zones + ' zonas de operación'"
              />
            }
          </section>

          @if (summary.users || summary.routes) {
            <div class="row wide">
              @if (summary.users; as users) {
                <section class="card" aria-labelledby="weekly-title">
                  <h2 id="weekly-title">Altas por semana</h2>
                  <p class="note">Últimas 8 semanas, de lunes a domingo.</p>
                  <app-weekly-bars [weeks]="users.registrationsByWeek" />
                </section>
              }
              @if (summary.routes; as routes) {
                <section class="card" aria-labelledby="safety-title">
                  <h2 id="safety-title">Nivel de seguridad de las rutas</h2>
                  <p class="note">Cada ruta cuenta una vez, con el peor nivel de sus franjas.</p>
                  <app-stacked-bar
                    subject="Rutas por nivel de seguridad"
                    [segments]="safetySegments(routes.safetyLevels)"
                  />
                </section>
              }
            </div>
          }

          @if (summary.routes; as routes) {
            <h2 class="group">Rutas</h2>
            <div class="row columns four">
              <section class="column tone-peach" aria-labelledby="difficulty-title">
                <header>
                  <h3 id="difficulty-title">Por dificultad</h3>
                  <span class="count">{{ routes.total }}</span>
                </header>
                <div class="inner">
                  <app-bar-list
                    label="Rutas por dificultad"
                    [items]="difficulty(routes.byDifficulty)"
                  />
                </div>
              </section>
              <section class="column tone-sky" aria-labelledby="surface-title">
                <header>
                  <h3 id="surface-title">Por superficie</h3>
                  <span class="count">{{ routes.total }}</span>
                </header>
                <div class="inner">
                  <app-bar-list label="Rutas por superficie" [items]="surface(routes.bySurface)" />
                </div>
              </section>
              <section class="column tone-lavender" aria-labelledby="city-title">
                <header>
                  <h3 id="city-title">Por ciudad</h3>
                  <span class="count">{{ routes.byCity.length }}</span>
                </header>
                <div class="inner">
                  <app-bar-list label="Rutas por ciudad" [items]="cityItems(routes.byCity)" />
                </div>
              </section>
              <section class="column tone-mint" aria-labelledby="factors-title">
                <header>
                  <h3 id="factors-title">Factores de riesgo</h3>
                  <span class="count">{{ routes.riskFactors.total }}</span>
                </header>
                <div class="inner">
                  <app-bar-list
                    label="Factores de riesgo por severidad"
                    [items]="severities(routes.riskFactors.bySeverity)"
                  />
                  <p class="note">En {{ routes.timeSlots }} franjas horarias.</p>
                </div>
              </section>
            </div>
          }

          @if (summary.users; as users) {
            <h2 class="group">Cuentas</h2>
            <div class="row columns">
              <section class="column tone-pink" aria-labelledby="profile-title">
                <header>
                  <h3 id="profile-title">Perfil deportivo</h3>
                  <span class="count">{{ users.sportProfiles.percentage }}%</span>
                </header>
                <div class="inner">
                  <app-progress-bar
                    label="Perfiles completados"
                    [percent]="users.sportProfiles.percentage"
                    [detail]="users.sportProfiles.completed + ' de ' + users.total + ' usuarios'"
                  />
                </div>
              </section>
              <section class="column tone-sky" aria-labelledby="role-title">
                <header>
                  <h3 id="role-title">Usuarios por rol</h3>
                  <span class="count">{{ users.total }}</span>
                </header>
                <div class="inner">
                  <app-bar-list label="Usuarios por rol" [items]="roles(users.byRole)" />
                </div>
              </section>
              <section class="column tone-lavender" aria-labelledby="appearance-title">
                <header>
                  <h3 id="appearance-title">Apariencia elegida</h3>
                  <span class="count">{{ users.preferences.saved }}</span>
                </header>
                <div class="inner">
                  <app-bar-list
                    label="Apariencia elegida"
                    [items]="appearance(users.preferences.appearance)"
                  />
                  <p class="note">
                    Notificaciones activas: {{ users.preferences.notificationsEnabled }} de
                    {{ users.preferences.saved }}.
                  </p>
                </div>
              </section>
            </div>
          }

          <section class="soon" aria-labelledby="soon-title">
            <h2 id="soon-title">Próximamente</h2>
            <p class="note">Estas métricas llegan con las funciones de la app que las generan.</p>
            <div class="kpis">
              <app-kpi-tile
                tone="pink"
                icon="barbell-outline"
                label="Entrenamientos registrados"
                [soon]="true"
              />
              <app-kpi-tile tone="peach" icon="warning-outline" label="Alertas SOS" [soon]="true" />
              <app-kpi-tile tone="sky" icon="calendar-outline" label="Eventos" [soon]="true" />
            </div>
          </section>
        } @else if (!store.error()) {
          <div class="skeleton" role="status" aria-busy="true">
            <span class="sr-only">Cargando el resumen…</span>
            @for (block of skeletonBlocks; track block) {
              <div class="block" aria-hidden="true"></div>
            }
          </div>
        }
      </div>
    </ion-content>
  `,
  styles: `
    ion-content {
      --background: transparent;
    }

    .page {
      display: grid;
      gap: var(--rc-space-xl);
      max-width: 80rem;
      margin: 0 auto;
      padding: var(--rc-space-xl);
    }

    .hero {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      justify-content: space-between;
      gap: var(--rc-space-lg);
    }

    .hero h1 {
      margin: var(--rc-space-xs) 0;
      font-size: clamp(1.75rem, 4vw, 2.5rem);
      font-weight: 800;
      letter-spacing: -0.02em;
    }

    .eyebrow {
      margin: 0;
      font-size: var(--rc-font-size-caption);
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--rc-primary-text);
    }

    .lead,
    .note {
      margin: 0;
      color: var(--rc-text-muted);
    }

    .refresh {
      display: flex;
      align-items: center;
      gap: var(--rc-space-md);
    }

    .updated {
      font-size: var(--rc-font-size-label);
      color: var(--rc-text-muted);
    }

    .state {
      display: grid;
      justify-items: start;
      gap: var(--rc-space-md);
    }

    .muted {
      color: var(--rc-text-muted);
    }

    .kpis {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 9rem), 1fr));
      gap: var(--rc-space-md);
    }

    .row {
      display: grid;
      align-items: start;
      gap: var(--rc-space-lg);
    }

    @media (min-width: 64rem) {
      .row.wide {
        grid-template-columns: 3fr 2fr;
      }

      .row.columns {
        grid-template-columns: repeat(3, 1fr);
      }

      .row.columns.four {
        grid-template-columns: repeat(4, 1fr);
      }
    }

    @media (min-width: 40rem) and (max-width: 63.99rem) {
      .row.columns {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .card {
      display: grid;
      align-content: start;
      gap: var(--rc-space-md);
      padding: var(--rc-space-xl);
      border-radius: var(--rc-radius-lg);
      background: var(--rc-surface-elevated);
      box-shadow: var(--rc-shadow-sm);
    }

    h2 {
      margin: 0;
      font-size: var(--rc-font-size-subtitle);
      font-weight: 800;
    }

    h3 {
      margin: 0;
      font-size: var(--rc-font-size-body);
      font-weight: 800;
    }

    .group {
      margin: var(--rc-space-sm) 0 calc(var(--rc-space-sm) * -1);
      font-size: var(--rc-font-size-caption);
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--rc-text-muted);
    }

    .inner .note {
      margin-top: var(--rc-space-lg);
    }

    .column {
      display: grid;
      align-content: start;
      gap: var(--rc-space-md);
      padding: var(--rc-space-lg);
      border-radius: var(--rc-radius-lg);
      color: var(--rc-on-pastel);
      background: var(--tone);
    }

    .tone-pink {
      --tone: var(--rc-pastel-pink);
    }
    .tone-mint {
      --tone: var(--rc-pastel-mint);
    }
    .tone-peach {
      --tone: var(--rc-pastel-peach);
    }
    .tone-sky {
      --tone: var(--rc-pastel-sky);
    }
    .tone-lavender {
      --tone: var(--rc-pastel-lavender);
    }

    .column header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 var(--rc-space-xs);
    }

    .count {
      min-width: 1.75rem;
      padding: 0 var(--rc-space-sm);
      border-radius: var(--rc-radius-pill);
      background: var(--rc-surface-elevated);
      color: var(--rc-text);
      text-align: center;
      font-size: var(--rc-font-size-label);
      font-weight: 800;
    }

    .inner {
      padding: var(--rc-space-lg);
      border-radius: var(--rc-radius-md);
      background: var(--rc-surface-elevated);
      color: var(--rc-text);
      box-shadow: var(--rc-shadow-sm);
    }

    .soon {
      display: grid;
      gap: var(--rc-space-md);
    }

    .skeleton {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 13.5rem), 1fr));
      gap: var(--rc-space-lg);
    }

    .block {
      height: 8rem;
      border-radius: var(--rc-radius-lg);
      background: var(--rc-surface);
      animation: pulse 1.4s ease-in-out infinite;
    }

    @media (prefers-reduced-motion: reduce) {
      .block {
        animation: none;
      }
    }

    @keyframes pulse {
      50% {
        opacity: 0.5;
      }
    }
  `,
})
export class SummaryPage implements ViewWillEnter {
  protected readonly store = inject(SummaryStore);

  protected readonly skeletonBlocks = [1, 2, 3, 4, 5, 6];
  protected readonly today = computed(() => DATE_FORMAT.format(new Date()));
  protected readonly greeting = computed(() => greeting(new Date().getHours()));
  protected readonly updated = computed(() => {
    const generated = this.store.summary()?.generatedAt;
    return generated ? TIME_FORMAT.format(new Date(generated)) : '';
  });

  ionViewWillEnter(): void {
    void this.store.load();
  }

  protected roles = (counts: Record<string, number>) => items(counts, roleLabel);
  protected appearance = (counts: Record<string, number>) => items(counts, appearanceLabel);
  protected difficulty = (counts: Record<string, number>) => items(counts, difficultyLabel);
  protected surface = (counts: Record<string, number>) => items(counts, surfaceLabel);
  protected severities = (counts: Record<string, number>) => items(counts, severityLabel);

  protected cityItems(cities: readonly RoutesByCity[]): BarItem[] {
    return cities.map((city) => ({ label: city.cityName, value: city.count }));
  }

  protected safetySegments(levels: {
    high: number;
    medium: number;
    low: number;
    unrated: number;
  }): Segment[] {
    return [
      { label: 'Nivel Alto', value: levels.high, tone: 'success' },
      { label: 'Nivel Medio', value: levels.medium, tone: 'warning' },
      { label: 'Nivel Bajo', value: levels.low, tone: 'danger' },
      { label: 'Sin índice', value: levels.unrated, tone: 'muted' },
    ];
  }
}
