import { Component, computed, inject } from '@angular/core';
import { IonButton, IonContent, ViewWillEnter } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { barbellOutline, businessOutline, peopleOutline, trailSignOutline } from 'ionicons/icons';
import { Notice } from '../../../shared/ui/notice';
import { SummaryStore } from '../application/summary.store';
import { greeting, weekLabel } from '../domain/labels';
import { CityComparison, RouteDistance, UsersSummary, WeekCount } from '../domain/summary';
import { AdminHeader } from '../../admin-header';
import { Bar, BarChart } from './bar-chart';
import { BarItem, BarList } from './bar-list';
import { ChartColor } from './chart-math';
import { DonutChart, DonutSlice } from './donut-chart';
import { BarGroup, BarSeries, GroupedBars } from './grouped-bars';
import { KpiTile } from './kpi-tile';

addIcons({ barbellOutline, businessOutline, peopleOutline, trailSignOutline });

const DATE_FORMAT = new Intl.DateTimeFormat('es', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const TIME_FORMAT = new Intl.DateTimeFormat('es', { hour: '2-digit', minute: '2-digit' });
const KM = new Intl.NumberFormat('es-EC', { maximumFractionDigits: 1 });

/** The landing of the admin: real analytics of the mobile app, in plain words. */
@Component({
  selector: 'app-summary-page',
  imports: [
    AdminHeader,
    BarChart,
    BarList,
    DonutChart,
    GroupedBars,
    IonButton,
    IonContent,
    KpiTile,
    Notice,
  ],
  template: `
    <app-admin-header title="Resumen" />
    <ion-content>
      <div class="page">
        <header class="hero">
          <div>
            <p class="eyebrow">{{ greeting() }} · {{ today() }}</p>
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
            @if (summary.routes; as routes) {
              <app-kpi-tile
                icon="trail-sign-outline"
                label="Rutas activas"
                [value]="routes.active"
                [hint]="'de ' + routes.total + ' rutas · ' + km(routes.totalKm) + ' km'"
              />
            }
            @if (summary.users; as users) {
              <app-kpi-tile
                icon="people-outline"
                label="Usuarios registrados"
                [value]="users.total"
                [hint]="newUsers(users.registeredLast30Days)"
              />
            }
            @if (summary.routes; as routes) {
              <app-kpi-tile
                icon="business-outline"
                label="Ciudades con rutas"
                [value]="routes.byCity.length"
                [hint]="registeredCities(summary.cities?.cities)"
              />
            }
            @if (summary.users; as users) {
              <app-kpi-tile
                icon="barbell-outline"
                label="Usuarios con perfil deportivo"
                [value]="users.sportProfiles.completed"
                [hint]="
                  'de ' + users.total + ' usuarios (' + users.sportProfiles.percentage + ' %)'
                "
              />
            }
          </section>

          @if (summary.byCity || summary.users) {
            <div class="row wide">
              @if (summary.byCity; as cities) {
                <section class="card" aria-labelledby="city-title">
                  <h2 id="city-title">Rutas y usuarios por ciudad</h2>
                  <p class="note">
                    Cuántas rutas hay y cuántos usuarios viven en cada ciudad (las 8 con más
                    usuarios).
                  </p>
                  <app-grouped-bars
                    subject="Rutas y usuarios por ciudad"
                    [series]="citySeries"
                    [groups]="cityGroups(cities)"
                  />
                </section>
              }
              @if (summary.users; as users) {
                <section class="card" aria-labelledby="level-title">
                  <h2 id="level-title">Usuarios por nivel deportivo</h2>
                  <p class="note">Cuántos usuarios eligieron cada nivel en su perfil deportivo.</p>
                  <app-bar-list label="Usuarios por nivel deportivo" [items]="levelItems(users)" />
                </section>
              }
            </div>
          }

          @if (summary.users || summary.routes) {
            <div class="row wide">
              @if (summary.routes; as routes) {
                <section class="card" aria-labelledby="safety-title">
                  <h2 id="safety-title">Qué tan seguras son las rutas</h2>
                  <p class="note">
                    Cada ruta cuenta una vez, con el nivel más bajo de sus franjas.
                  </p>
                  <app-donut-chart
                    subject="Rutas por nivel de seguridad"
                    centerLabel="Rutas"
                    [slices]="safetySlices(routes.safetyLevels)"
                  />
                </section>
              }
              @if (summary.users; as users) {
                <section class="card" aria-labelledby="weekly-title">
                  <h2 id="weekly-title">Usuarios nuevos por semana</h2>
                  <p class="note">Cuentas creadas en cada una de las últimas 8 semanas.</p>
                  <app-bar-chart
                    subject="Usuarios nuevos por semana"
                    [bars]="weeks(users.registrationsByWeek)"
                    [highlightLast]="true"
                  />
                </section>
              }
            </div>
          }

          @if (summary.routes; as routes) {
            <details class="details">
              <summary>Más detalles</summary>
              <section class="card" aria-labelledby="distance-title">
                <h2 id="distance-title">Rutas más largas</h2>
                <p class="note">Las 6 rutas con más kilómetros.</p>
                <app-bar-chart
                  subject="Kilómetros de cada ruta"
                  unit="km"
                  colorName="fuchsia"
                  [bars]="distanceBars(routes.distances)"
                />
              </section>
            </details>
          }

          <section class="card later">
            <p class="note">
              Próximamente: cuántos usuarios recorren cada ruta (llega con el registro de
              entrenamientos).
            </p>
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
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr));
      gap: var(--rc-admin-gutter);
    }

    .row {
      display: grid;
      align-items: stretch;
      gap: var(--rc-admin-gutter);
    }

    // On desktop the two panels of a row share a 10-column grid (6 + 4); alone, one fills it.
    @media (min-width: 64rem) {
      .row.wide {
        grid-template-columns: repeat(10, minmax(0, 1fr));
      }

      .row.wide > :first-child {
        grid-column: span 6;
      }

      .row.wide > :last-child {
        grid-column: span 4;
      }

      .row.wide > :only-child {
        grid-column: 1 / -1;
      }
    }

    // Rounded panels on the frame with a very soft fuchsia tint, without heavy borders: the content
    // is what stands out, not the background.
    .card {
      display: grid;
      align-content: start;
      gap: var(--rc-space-md);
      min-width: 0;
      padding: var(--rc-space-xl);
      border-radius: var(--rc-radius-lg);
      background: color-mix(in srgb, var(--rc-primary) 6%, var(--rc-surface-elevated));
    }

    h2 {
      margin: 0;
      font-size: var(--rc-font-size-subtitle);
      font-weight: 500;
    }

    @media (max-width: 40rem) {
      .kpis > :last-child:nth-child(odd) {
        grid-column: 1 / -1;
      }
    }

    .details {
      display: grid;
      gap: var(--rc-space-md);
    }

    .details > summary {
      cursor: pointer;
      width: max-content;
      font-size: var(--rc-font-size-subtitle);
      font-weight: 500;
    }

    .details[open] > summary {
      margin-bottom: var(--rc-space-md);
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

  protected readonly skeletonBlocks = [1, 2, 3, 4];
  protected readonly today = computed(() => DATE_FORMAT.format(new Date()));
  protected readonly greeting = computed(() => greeting(new Date().getHours()));
  protected readonly updated = computed(() => {
    const generated = this.store.summary()?.generatedAt;
    return generated ? TIME_FORMAT.format(new Date(generated)) : '';
  });

  protected readonly citySeries: readonly BarSeries[] = [
    { name: 'Rutas', color: 'fuchsia' },
    { name: 'Usuarios', color: 'ink' },
  ];

  ionViewWillEnter(): void {
    void this.store.load();
  }

  protected readonly km = (value: number): string => KM.format(value);

  protected newUsers(count: number): string {
    return `${count} ${count === 1 ? 'nuevo' : 'nuevos'} en los últimos 30 días`;
  }

  protected registeredCities(count: number | undefined): string {
    if (count === undefined) return '';
    return `de ${count} ${count === 1 ? 'ciudad registrada' : 'ciudades registradas'}`;
  }

  protected cityGroups(cities: readonly CityComparison[]): BarGroup[] {
    return cities.map((city) => ({ label: city.name, values: [city.routes, city.users] }));
  }

  /** Users per level with the catalog labels, then those who have not filled in the profile. */
  protected levelItems(users: UsersSummary): BarItem[] {
    return [
      ...users.bySportLevel.map((entry) => ({
        label: this.store.levelLabel(entry.level),
        value: entry.users,
      })),
      {
        label: 'Sin perfil deportivo',
        value: Math.max(0, users.total - users.sportProfiles.completed),
      },
    ];
  }

  protected weeks(weeks: readonly WeekCount[]): Bar[] {
    return weeks.map((week) => ({ label: weekLabel(week.weekStart), value: week.count }));
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
      slice('Alta', levels.high, 'success'),
      slice('Media', levels.medium, 'warning'),
      slice('Baja', levels.low, 'danger'),
      slice('Sin evaluar', levels.unrated, 'silver'),
    ];
  }
}
