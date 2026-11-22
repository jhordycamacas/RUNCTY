import { Component, computed, inject } from '@angular/core';
import {
  IonButton,
  IonContent,
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
  weekLabel,
} from '../domain/labels';
import { RouteDistance, RoutesByCity, WeekCount } from '../domain/summary';
import { Bar, BarChart } from './bar-chart';
import { BarItem, BarList } from './bar-list';
import { CATEGORICAL, ChartColor } from './chart-math';
import { DonutChart, DonutSlice } from './donut-chart';
import { KpiTile } from './kpi-tile';
import { ProgressBar } from './progress-bar';
import { AdminHeader } from '../../admin-header';

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
    AdminHeader,
    BarChart,
    BarList,
    DonutChart,
    IonButton,
    IonContent,
    KpiTile,
    Notice,
    ProgressBar,
  ],
  template: `
    <app-admin-header [title]="greeting()" />
    <ion-content>
      <div class="page">
        <header class="hero">
          <div>
            <p class="eyebrow">{{ today() }}</p>
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
                tone="fuchsia"
                icon="people-outline"
                label="Usuarios"
                [value]="users.total"
                [hint]="users.sportProfiles.completed + ' con perfil deportivo'"
              />
              <app-kpi-tile
                tone="neutral"
                icon="person-add-outline"
                label="Altas en 7 días"
                [value]="users.registeredLast7Days"
                [hint]="users.registeredLast30Days + ' en 30 días'"
              />
            }
            @if (summary.routes; as routes) {
              <app-kpi-tile
                tone="neutral"
                icon="trail-sign-outline"
                label="Rutas activas"
                [value]="routes.active"
                [hint]="'de ' + routes.total + ' rutas · ' + routes.totalKm + ' km'"
              />
              <app-kpi-tile
                tone="neutral"
                icon="alert-circle-outline"
                label="Rutas con nivel Bajo"
                [value]="routes.safetyLevels.low"
                hint="en al menos una franja horaria"
              />
            }
            @if (summary.cities; as cities) {
              <app-kpi-tile
                tone="neutral"
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
                  <app-bar-chart
                    subject="Altas por semana"
                    [bars]="weeks(users.registrationsByWeek)"
                    [highlightLast]="true"
                  />
                </section>
              }
              @if (summary.routes; as routes) {
                <section class="card" aria-labelledby="safety-title">
                  <h2 id="safety-title">Nivel de seguridad de las rutas</h2>
                  <p class="note">Cada ruta cuenta una vez, con el peor nivel de sus franjas.</p>
                  <app-donut-chart
                    subject="Rutas por nivel de seguridad"
                    centerLabel="Rutas"
                    [slices]="safetySlices(routes.safetyLevels)"
                  />
                </section>
              }
            </div>
          }

          @if (summary.routes; as routes) {
            <h2 class="group">Rutas</h2>
            <div class="charts">
              <section class="column" aria-labelledby="difficulty-title">
                <h3 id="difficulty-title">Por dificultad</h3>
                <app-donut-chart
                  subject="Rutas por dificultad"
                  centerLabel="Rutas"
                  [slices]="slices(routes.byDifficulty, difficultyLabel)"
                />
              </section>
              <section class="column" aria-labelledby="surface-title">
                <h3 id="surface-title">Por superficie</h3>
                <app-donut-chart
                  subject="Rutas por superficie"
                  centerLabel="Rutas"
                  [slices]="slices(routes.bySurface, surfaceLabel)"
                />
              </section>
              <section class="column" aria-labelledby="factors-title">
                <h3 id="factors-title">Factores de riesgo</h3>
                <app-donut-chart
                  subject="Factores de riesgo por severidad"
                  centerLabel="Factores"
                  [slices]="slices(routes.riskFactors.bySeverity, severityLabel)"
                />
                <p class="note">En {{ routes.timeSlots }} franjas horarias.</p>
              </section>
              <section class="column" aria-labelledby="city-title">
                <h3 id="city-title">Rutas por ciudad</h3>
                <app-bar-chart subject="Rutas por ciudad" [bars]="cityBars(routes.byCity)" />
              </section>
              <section class="column wide-chart" aria-labelledby="distance-title">
                <h3 id="distance-title">Rutas más largas</h3>
                <app-bar-chart
                  subject="Distancia por ruta"
                  unit="km"
                  colorName="fuchsia"
                  [bars]="distanceBars(routes.distances)"
                />
              </section>
            </div>
          }

          @if (summary.users; as users) {
            <h2 class="group">Cuentas</h2>
            <div class="charts">
              <section class="column" aria-labelledby="profile-title">
                <h3 id="profile-title">Perfil deportivo</h3>
                <app-progress-bar
                  label="Perfiles completados"
                  [percent]="users.sportProfiles.percentage"
                  [detail]="users.sportProfiles.completed + ' de ' + users.total + ' usuarios'"
                />
              </section>
              <section class="column" aria-labelledby="role-title">
                <h3 id="role-title">Usuarios por rol</h3>
                <app-donut-chart
                  subject="Usuarios por rol"
                  centerLabel="Usuarios"
                  [slices]="slices(users.byRole, roleLabel)"
                />
              </section>
              <section class="column" aria-labelledby="appearance-title">
                <h3 id="appearance-title">Apariencia elegida</h3>
                <app-bar-list
                  label="Apariencia elegida"
                  [items]="appearance(users.preferences.appearance)"
                />
                <p class="note">
                  Notificaciones activas: {{ users.preferences.notificationsEnabled }} de
                  {{ users.preferences.saved }}.
                </p>
              </section>
            </div>
          }

          <section class="soon" aria-labelledby="soon-title">
            <h2 id="soon-title">Próximamente</h2>
            <p class="note">Estas métricas llegan con las funciones de la app que las generan.</p>
            <div class="kpis">
              <app-kpi-tile
                tone="fuchsia"
                icon="barbell-outline"
                label="Entrenamientos registrados"
                [soon]="true"
              />
              <app-kpi-tile tone="neutral" icon="warning-outline" label="Alertas SOS" [soon]="true" />
              <app-kpi-tile tone="neutral" icon="calendar-outline" label="Eventos" [soon]="true" />
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

    // Full width inside the frame, one gutter on every side and between every block, so the
    // edges line up with the page title above.
    .page {
      display: grid;
      gap: var(--rc-admin-gutter);
      padding: var(--rc-admin-gutter);
    }

    .hero {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      justify-content: space-between;
      gap: var(--rc-space-lg);
    }

    .eyebrow {
      margin: 0;
      font-size: var(--rc-font-size-label);
      font-weight: 500;
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
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 10rem), 1fr));
      gap: var(--rc-admin-gutter);
    }

    .row {
      display: grid;
      align-items: stretch;
      gap: var(--rc-admin-gutter);
    }

    // On desktop every block sits on one 10-column grid: five KPI tiles of two columns, then
    // panels of 6 + 4 and 3 + 3 + 4 columns, so all the edges line up as in the reference.
    @media (min-width: 64rem) {
      .kpis,
      .row.wide,
      .charts {
        grid-template-columns: repeat(10, minmax(0, 1fr));
      }

      .kpis > * {
        grid-column: span 2;
      }

      .row.wide > :first-child {
        grid-column: span 6;
      }

      .row.wide > :last-child,
      .charts > :nth-child(3n),
      .charts > :nth-child(4) {
        grid-column: span 4;
      }

      .row.wide > :only-child {
        grid-column: 1 / -1;
      }

      .charts > * {
        grid-column: span 3;
      }

      .charts > .wide-chart {
        grid-column: span 6;
      }
    }

    // White rounded panels on the warm gray frame, without heavy borders.
    .card {
      display: grid;
      align-content: start;
      gap: var(--rc-space-md);
      padding: var(--rc-space-xl);
      border-radius: var(--rc-radius-lg);
      background: var(--rc-surface-elevated);
    }

    h2 {
      margin: 0;
      font-size: var(--rc-font-size-subtitle);
      font-weight: 500;
    }

    h3 {
      margin: 0;
      font-size: var(--rc-font-size-body);
      font-weight: 600;
    }

    .charts {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr));
      align-items: stretch;
      gap: var(--rc-admin-gutter);
    }

    @media (max-width: 40rem) {
      .kpis > :last-child:nth-child(odd) {
        grid-column: 1 / -1;
      }
    }

    .group {
      margin: var(--rc-space-sm) 0 calc(var(--rc-space-sm) * -1);
      font-size: var(--rc-font-size-subtitle);
      font-weight: 500;
    }

    .column {
      display: grid;
      align-content: start;
      gap: var(--rc-space-lg);
      padding: var(--rc-space-lg);
      border-radius: var(--rc-radius-lg);
      background: var(--rc-surface-elevated);
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
      border-radius: var(--rc-radius-md);
      background: var(--rc-surface-elevated);
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

  protected readonly difficultyLabel = difficultyLabel;
  protected readonly surfaceLabel = surfaceLabel;
  protected readonly severityLabel = severityLabel;
  protected readonly roleLabel = roleLabel;

  protected appearance = (counts: Record<string, number>) => items(counts, appearanceLabel);

  /** One slice per key, in the categorical color order. */
  protected slices(counts: Record<string, number>, label: (key: string) => string): DonutSlice[] {
    return Object.entries(counts).map(([key, value], index) => ({
      label: label(key),
      value,
      color: CATEGORICAL[index % CATEGORICAL.length],
    }));
  }

  protected weeks(weeks: readonly WeekCount[]): Bar[] {
    return weeks.map((week) => ({ label: weekLabel(week.weekStart), value: week.count }));
  }

  protected cityBars(cities: readonly RoutesByCity[]): Bar[] {
    return cities.slice(0, 8).map((city) => ({ label: city.cityName, value: city.count }));
  }

  protected distanceBars(routes: readonly RouteDistance[]): Bar[] {
    return routes.slice(0, 6).map((route) => ({ label: route.name, value: route.distanceKm }));
  }

  protected safetySlices(levels: {
    high: number;
    medium: number;
    low: number;
    unrated: number;
  }): DonutSlice[] {
    const slice = (label: string, value: number, color: ChartColor): DonutSlice => ({
      label,
      value,
      color,
    });
    return [
      slice('Nivel Alto', levels.high, 'success'),
      slice('Nivel Medio', levels.medium, 'warning'),
      slice('Nivel Bajo', levels.low, 'danger'),
      slice('Sin índice', levels.unrated, 'silver'),
    ];
  }
}
