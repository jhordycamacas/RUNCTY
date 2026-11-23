import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  ActionSheetController,
  IonButton,
  IonContent,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  RefresherCustomEvent,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  checkmark,
  closeCircle,
  optionsOutline,
  searchOutline,
  swapVerticalOutline,
} from 'ionicons/icons';
import { Notice } from '../../shared/ui/notice';
import { TabHeader } from '../../shared/ui/tab-header';
import { CityRoutes } from '../application/city-routes';
import {
  DEFAULT_FILTERS,
  DISTANCE_BUCKET_LABELS,
  ROUTE_SORT_LABELS,
  RouteFilters,
  RouteSort,
  countActiveFilters,
  filterRoutes,
  listTimeSlots,
  pickDefaultSlot,
  resolveSlotKey,
  searchRoutes,
  sortRoutes,
} from '../domain/catalog';
import { RouteCard } from './route-card';
import { RouteCardSkeleton } from './route-card-skeleton';
import { AppliedFilters, RoutesFilterSheet } from './routes-filter-sheet';

addIcons({ checkmark, closeCircle, optionsOutline, searchOutline, swapVerticalOutline });

/** How many placeholders show while the routes load. */
const SKELETONS = [0, 1, 2];

/**
 * Rutas tab: the active routes of the runner's city with their safety level per time slot.
 * Above the list only the search, the «Filtros» button (a bottom sheet) and «Ordenar» take room;
 * the filters in effect show as removable chips. The slot chosen in the sheet recolors the cards.
 */
@Component({
  selector: 'app-routes-list-page',
  imports: [
    RouterLink,
    Notice,
    RouteCard,
    RouteCardSkeleton,
    RoutesFilterSheet,
    IonButton,
    IonContent,
    IonIcon,
    IonRefresher,
    IonRefresherContent,
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
          <div role="status">
            <span class="sr-only">Cargando rutas…</span>
            @for (placeholder of skeletons; track placeholder) {
              <app-route-card-skeleton />
            }
          </div>
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
          <label class="search">
            <ion-icon name="search-outline" aria-hidden="true" />
            <input
              type="search"
              placeholder="Buscar ruta"
              aria-label="Buscar ruta por nombre"
              autocomplete="off"
              [value]="query()"
              (input)="search($event)"
            />
          </label>

          <div class="tools">
            <button type="button" class="tool" (click)="sheetOpen.set(true)">
              <ion-icon name="options-outline" aria-hidden="true" />
              {{ filtersLabel() }}
            </button>
            <button type="button" class="tool" (click)="chooseSort()">
              <ion-icon name="swap-vertical-outline" aria-hidden="true" />
              {{ sortLabel() }}
            </button>
          </div>

          @if (activeFilters().length > 0) {
            <ul class="active" aria-label="Filtros activos">
              @for (active of activeFilters(); track active.key) {
                <li>
                  <button
                    type="button"
                    class="removable"
                    [attr.aria-label]="'Quitar filtro ' + active.label"
                    (click)="removeFilter(active.key)"
                  >
                    {{ active.label }}
                    <ion-icon name="close-circle" aria-hidden="true" />
                  </button>
                </li>
              }
            </ul>
          }

          <p class="count" aria-live="polite">{{ countLabel() }}</p>

          @for (route of visible(); track route.id; let position = $index) {
            <app-route-card [route]="route" [slotKey]="slotKey()" [index]="position" />
          } @empty {
            <section class="card" aria-labelledby="no-match-title">
              <h2 id="no-match-title">Ninguna ruta coincide con los filtros</h2>
              <p>Prueba con otro nombre, otra distancia o dificultad.</p>
              <ion-button fill="outline" (click)="clearFilters()">Quitar filtros</ion-button>
            </section>
          }

          <app-routes-filter-sheet
            [open]="sheetOpen()"
            [routes]="data.routes()"
            [query]="query()"
            [slotOptions]="slotOptions()"
            [slotKey]="slotKey()"
            [defaultSlotKey]="defaultSlotKey()"
            [filters]="filters()"
            (applied)="apply($event)"
            (closed)="sheetOpen.set(false)"
          />
        }
      }
    </ion-content>
  `,
  styles: `
    .subtitle {
      margin: 0 0 var(--rc-space-md);
      color: var(--rc-text-muted);
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
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

    .search {
      display: flex;
      align-items: center;
      gap: var(--rc-space-sm);
      min-height: var(--rc-min-touch-target);
      padding: 0 var(--rc-space-lg);
      border: 1px solid var(--rc-control-border);
      border-radius: var(--rc-radius-pill);
      background: var(--rc-surface-elevated);
      color: var(--rc-text-muted);
    }

    .search:focus-within {
      border-color: var(--rc-primary-text);
    }

    .search input {
      flex: 1;
      min-width: 0;
      min-height: var(--rc-min-touch-target);
      border: 0;
      outline: 0;
      background: transparent;
      color: var(--rc-text);
      font: inherit;
    }

    .tools {
      display: flex;
      gap: var(--rc-space-sm);
      margin: var(--rc-space-sm) 0;
    }

    .tool {
      display: inline-flex;
      flex: 1;
      align-items: center;
      justify-content: center;
      gap: var(--rc-space-sm);
      min-height: var(--rc-min-touch-target);
      padding: 0 var(--rc-space-md);
      border: 1px solid color-mix(in srgb, var(--rc-text) 32%, transparent);
      border-radius: var(--rc-radius-pill);
      background: color-mix(in srgb, var(--rc-text) 10%, var(--rc-surface-elevated));
      color: var(--rc-text);
      font: inherit;
      font-size: var(--rc-font-size-label);
      font-weight: 600;
      white-space: nowrap;
      transition: transform 120ms ease-out;
    }

    .tool ion-icon {
      color: var(--rc-text-muted);
      font-size: 1.125rem;
    }

    .tool:active {
      transform: scale(0.97);
    }

    .tool:focus-visible,
    .removable:focus-visible {
      outline: 3px solid var(--rc-primary-text);
      outline-offset: 2px;
    }

    .active {
      display: flex;
      flex-wrap: wrap;
      gap: var(--rc-space-sm);
      margin: 0 0 var(--rc-space-sm);
      padding: 0;
      list-style: none;
    }

    .removable {
      display: inline-flex;
      align-items: center;
      gap: var(--rc-space-xs);
      min-height: var(--rc-min-touch-target);
      padding: 0 var(--rc-space-md) 0 var(--rc-space-lg);
      border: 1px solid var(--rc-primary-text);
      border-radius: var(--rc-radius-pill);
      background: var(--rc-primary-tint);
      color: var(--rc-primary-text);
      font: inherit;
      font-size: var(--rc-font-size-label);
      font-weight: 600;
    }

    .count {
      margin: var(--rc-space-sm) 0 var(--rc-space-md);
      color: var(--rc-text-muted);
      font-size: var(--rc-font-size-label);
    }

    @media (prefers-reduced-motion: reduce) {
      .tool {
        transition: none;
      }

      .tool:active {
        transform: none;
      }
    }
  `,
})
export class RoutesListPage {
  protected readonly data = inject(CityRoutes);
  private readonly actionSheets = inject(ActionSheetController);

  protected readonly skeletons = SKELETONS;
  protected readonly chosenSlot = signal<string | null>(null);
  protected readonly filters = signal<RouteFilters>(DEFAULT_FILTERS);
  protected readonly query = signal('');
  protected readonly sort = signal<RouteSort>('safety');
  protected readonly sheetOpen = signal(false);

  private readonly now = new Date();
  private readonly slots = computed(() => listTimeSlots(this.data.routes()));
  protected readonly slotOptions = computed(() =>
    this.slots().map((slot) => ({ value: slot.key, label: slot.label })),
  );
  /** The window the app picks by itself: the one in progress or the next one to start. */
  protected readonly defaultSlotKey = computed(
    () => pickDefaultSlot(this.slots(), this.now)?.key ?? null,
  );
  /** The window the runner picked in the sheet, else the default one. */
  protected readonly slotKey = computed(() =>
    resolveSlotKey(this.slots(), this.chosenSlot(), this.now),
  );
  protected readonly visible = computed(() =>
    sortRoutes(
      filterRoutes(searchRoutes(this.data.routes(), this.query()), this.filters()),
      this.sort(),
      this.slotKey(),
    ),
  );

  protected readonly filtersLabel = computed(() => {
    const count = countActiveFilters(this.filters());
    return count > 0 ? `Filtros · ${count}` : 'Filtros';
  });
  protected readonly sortLabel = computed(() =>
    this.sort() === 'safety' ? 'Ordenar' : `Ordenar · ${ROUTE_SORT_LABELS[this.sort()]}`,
  );
  protected readonly activeFilters = computed(() => {
    const { distance, difficulty, surface } = this.filters();
    return [
      distance !== DEFAULT_FILTERS.distance
        ? { key: 'distance' as const, label: DISTANCE_BUCKET_LABELS[distance] }
        : null,
      difficulty !== DEFAULT_FILTERS.difficulty
        ? { key: 'difficulty' as const, label: difficulty }
        : null,
      surface !== DEFAULT_FILTERS.surface ? { key: 'surface' as const, label: surface } : null,
    ].filter((active) => active !== null);
  });
  /** "5 rutas · Loja". */
  protected readonly countLabel = computed(() => {
    const total = this.visible().length;
    const city = this.data.cityName();
    return `${total} ${total === 1 ? 'ruta' : 'rutas'}${city ? ` · ${city}` : ''}`;
  });
  protected readonly errorMessage = computed(() => {
    const state = this.data.state();
    return state.kind === 'error' ? state.message : null;
  });

  constructor() {
    void this.data.load();
  }

  protected search(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  protected apply(applied: AppliedFilters): void {
    this.chosenSlot.set(applied.slotKey);
    this.filters.set(applied.filters);
  }

  protected removeFilter(key: keyof RouteFilters): void {
    this.filters.update((current) => ({ ...current, [key]: DEFAULT_FILTERS[key] }));
  }

  /** Back to every route of the city: no filters and no search text. */
  protected clearFilters(): void {
    this.filters.set(DEFAULT_FILTERS);
    this.query.set('');
  }

  protected async chooseSort(): Promise<void> {
    const sheet = await this.actionSheets.create({
      header: 'Ordenar por',
      buttons: [
        ...(Object.keys(ROUTE_SORT_LABELS) as RouteSort[]).map((sort) => ({
          text: ROUTE_SORT_LABELS[sort],
          icon: sort === this.sort() ? 'checkmark' : undefined,
          handler: () => this.sort.set(sort),
        })),
        { text: 'Cancelar', role: 'cancel' },
      ],
    });
    await sheet.present();
  }

  protected retry(): void {
    void this.data.reload();
  }

  protected async refresh(event: RefresherCustomEvent): Promise<void> {
    await this.data.reload();
    await event.detail.complete();
  }
}
