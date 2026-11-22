import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  RefresherCustomEvent,
} from '@ionic/angular';
import { ChoiceChips, ChipOption } from '../../shared/ui/choice-chips';
import { Notice } from '../../shared/ui/notice';
import { TabHeader } from '../../shared/ui/tab-header';
import { CityRoutes } from '../application/city-routes';
import {
  DEFAULT_FILTERS,
  DISTANCE_BUCKET_LABELS,
  DifficultyFilter,
  DistanceBucket,
  RouteFilters,
  filterRoutes,
  listTimeSlots,
  resolveSlotKey,
  sortRoutesForSlot,
} from '../domain/catalog';
import { DIFFICULTY_LABELS } from '../domain/labels';
import { DIFFICULTIES } from '../domain/route';
import { RouteCard } from './route-card';

const DISTANCE_OPTIONS: ChipOption[] = (
  Object.keys(DISTANCE_BUCKET_LABELS) as DistanceBucket[]
).map((value) => ({ value, label: DISTANCE_BUCKET_LABELS[value] }));

const DIFFICULTY_OPTIONS: ChipOption[] = [
  { value: 'all', label: 'Todas' },
  ...DIFFICULTIES.map((value) => ({ value, label: DIFFICULTY_LABELS[value] })),
];

/** Rutas tab: the active routes of the runner's city with their safety level per time slot. */
@Component({
  selector: 'app-routes-list-page',
  imports: [
    RouterLink,
    ChoiceChips,
    Notice,
    RouteCard,
    IonButton,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonSpinner,
    TabHeader,
  ],
  template: `
    <app-tab-header title="Rutas" />
    <ion-content class="ion-padding">
      <ion-refresher slot="fixed" (ionRefresh)="refresh($event)">
        <ion-refresher-content />
      </ion-refresher>

      <p class="subtitle">{{ data.cityName() ?? 'Recorridos de tu ciudad' }}</p>

      @switch (data.state().kind) {
        @case ('loading') {
          <p class="state" role="status"><ion-spinner name="crescent" /> Cargando rutas…</p>
        }
        @case ('error') {
          <section class="card" aria-labelledby="error-title">
            <h2 id="error-title">No pudimos cargar las rutas</h2>
            <app-notice [message]="errorMessage()" />
            <ion-button fill="outline" (click)="retry()">Reintentar</ion-button>
          </section>
        }
        @case ('no-city') {
          <section class="card" aria-labelledby="no-city-title">
            <h2 id="no-city-title">Elige tu ciudad</h2>
            <p>
              Completa tu perfil con tu ciudad para ver sus rutas y su nivel de seguridad por
              horario.
            </p>
            <ion-button routerLink="/app/cuenta/datos">Completar perfil</ion-button>
          </section>
        }
        @case ('empty') {
          <section class="card" aria-labelledby="empty-title">
            <h2 id="empty-title">Aún no hay rutas en {{ data.cityName() ?? 'tu ciudad' }}</h2>
            <p>Pronto verás aquí las rutas de tu ciudad con su nivel de seguridad por horario.</p>
          </section>
        }
        @default {
          <app-choice-chips
            label="Franja horaria"
            [options]="slotOptions()"
            [value]="slotKey()"
            (selected)="chosenSlot.set($event)"
          />
          <app-choice-chips
            label="Distancia"
            [options]="distanceOptions"
            [value]="filters().distance"
            (selected)="setDistance($event)"
          />
          <app-choice-chips
            label="Dificultad"
            [options]="difficultyOptions"
            [value]="filters().difficulty"
            (selected)="setDifficulty($event)"
          />

          @for (route of visible(); track route.id) {
            <app-route-card [route]="route" [slotKey]="slotKey()" />
          } @empty {
            <section class="card" aria-labelledby="no-match-title">
              <h2 id="no-match-title">Ninguna ruta coincide con los filtros</h2>
              <p>Prueba con otra distancia o dificultad.</p>
              <ion-button fill="outline" (click)="clearFilters()">Quitar filtros</ion-button>
            </section>
          }
        }
      }
    </ion-content>
  `,
  styles: `
    .subtitle {
      margin: 0 0 var(--rc-space-lg);
      color: var(--rc-text-muted);
    }

    .card {
      padding: var(--rc-space-xl);
      border-radius: var(--rc-radius-lg);
      background: var(--rc-surface-elevated);
    }

    .card h2 {
      margin: 0 0 var(--rc-space-sm);
      font-size: var(--rc-font-size-subtitle);
      font-weight: 500;
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
  `,
})
export class RoutesListPage {
  protected readonly data = inject(CityRoutes);

  protected readonly distanceOptions = DISTANCE_OPTIONS;
  protected readonly difficultyOptions = DIFFICULTY_OPTIONS;
  protected readonly chosenSlot = signal<string | null>(null);
  protected readonly filters = signal<RouteFilters>(DEFAULT_FILTERS);

  private readonly now = new Date();
  private readonly slots = computed(() => listTimeSlots(this.data.routes()));
  protected readonly slotOptions = computed<ChipOption[]>(() =>
    this.slots().map((slot) => ({ value: slot.key, label: slot.label })),
  );
  /** The window the runner picked, else the one of the current or next training slot. */
  protected readonly slotKey = computed(() =>
    resolveSlotKey(this.slots(), this.chosenSlot(), this.now),
  );
  protected readonly visible = computed(() =>
    sortRoutesForSlot(filterRoutes(this.data.routes(), this.filters()), this.slotKey()),
  );
  protected readonly errorMessage = computed(() => {
    const state = this.data.state();
    return state.kind === 'error' ? state.message : null;
  });

  constructor() {
    void this.data.load();
  }

  protected setDistance(value: string): void {
    this.filters.update((f) => ({ ...f, distance: value as DistanceBucket }));
  }

  protected setDifficulty(value: string): void {
    this.filters.update((f) => ({ ...f, difficulty: value as DifficultyFilter }));
  }

  protected clearFilters(): void {
    this.filters.set(DEFAULT_FILTERS);
  }

  protected retry(): void {
    void this.data.reload();
  }

  protected async refresh(event: RefresherCustomEvent): Promise<void> {
    await this.data.reload();
    await event.detail.complete();
  }
}
