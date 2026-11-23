import { Component, computed, effect, input, output, signal, untracked } from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonModal,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { ChoiceChips, ChipOption } from '../../shared/ui/choice-chips';
import {
  DEFAULT_FILTERS,
  DISTANCE_BUCKET_LABELS,
  DistanceBucket,
  RouteFilters,
  filterRoutes,
  listDifficulties,
  listSurfaces,
  searchRoutes,
} from '../domain/catalog';
import { Route } from '../domain/route';

const ALL: ChipOption = { value: 'all', label: 'Todas' };
const DISTANCE_OPTIONS: ChipOption[] = (
  Object.keys(DISTANCE_BUCKET_LABELS) as DistanceBucket[]
).map((value) => ({ value, label: DISTANCE_BUCKET_LABELS[value] }));

/** What the runner applied in the sheet. */
export interface AppliedFilters {
  slotKey: string | null;
  filters: RouteFilters;
}

/**
 * Bottom sheet with the route filters: time slot, distance, difficulty and surface (the last two
 * built from the loaded routes). Changes are a draft until «Ver N rutas», which shows how many
 * routes would be listed; «Limpiar» resets the draft and closing discards it.
 */
@Component({
  selector: 'app-routes-filter-sheet',
  imports: [
    ChoiceChips,
    IonButton,
    IonButtons,
    IonContent,
    IonFooter,
    IonHeader,
    IonModal,
    IonTitle,
    IonToolbar,
  ],
  template: `
    <ion-modal
      [isOpen]="open()"
      [breakpoints]="[0, 0.7, 1]"
      [initialBreakpoint]="0.7"
      (didDismiss)="closed.emit()"
    >
      <ng-template>
        <ion-header>
          <ion-toolbar>
            <ion-title>Filtros</ion-title>
            <ion-buttons slot="end">
              <ion-button (click)="closed.emit()">Cerrar</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <app-choice-chips
            label="Franja horaria"
            [wrap]="true"
            [options]="slotOptions()"
            [value]="draftSlot()"
            (selected)="draftSlot.set($event)"
          />
          <app-choice-chips
            label="Distancia"
            [wrap]="true"
            [options]="distanceOptions"
            [value]="draft().distance"
            (selected)="change('distance', $event)"
          />
          @if (difficultyOptions().length > 1) {
            <app-choice-chips
              label="Dificultad"
              [wrap]="true"
              [options]="difficultyOptions()"
              [value]="draft().difficulty"
              (selected)="change('difficulty', $event)"
            />
          }
          @if (surfaceOptions().length > 1) {
            <app-choice-chips
              label="Superficie"
              [wrap]="true"
              [options]="surfaceOptions()"
              [value]="draft().surface"
              (selected)="change('surface', $event)"
            />
          }
        </ion-content>
        <ion-footer>
          <ion-toolbar>
            <div class="actions">
              <ion-button fill="clear" (click)="clear()">Limpiar</ion-button>
              <ion-button class="apply" [disabled]="matches() === 0" (click)="apply()">{{
                applyLabel()
              }}</ion-button>
            </div>
          </ion-toolbar>
        </ion-footer>
      </ng-template>
    </ion-modal>
  `,
  styles: `
    .actions {
      display: flex;
      align-items: center;
      gap: var(--rc-space-md);
      padding: var(--rc-space-sm) var(--rc-space-lg);
    }

    ion-button {
      --border-radius: var(--rc-radius-pill);
      min-height: var(--rc-min-touch-target);
    }

    .apply {
      flex: 1;
    }
  `,
})
export class RoutesFilterSheet {
  readonly open = input.required<boolean>();
  /** Every route of the city: the groups and the live count are built from them. */
  readonly routes = input.required<readonly Route[]>();
  /** The search text in effect: the count only includes the routes it finds. */
  readonly query = input('');
  readonly slotOptions = input.required<readonly ChipOption[]>();
  /** The time slot in effect, and the one the app picks by itself (what «Limpiar» goes back to). */
  readonly slotKey = input.required<string | null>();
  readonly defaultSlotKey = input.required<string | null>();
  readonly filters = input.required<RouteFilters>();

  readonly applied = output<AppliedFilters>();
  readonly closed = output<void>();

  protected readonly distanceOptions = DISTANCE_OPTIONS;
  protected readonly draftSlot = signal<string | null>(null);
  protected readonly draft = signal<RouteFilters>(DEFAULT_FILTERS);

  protected readonly difficultyOptions = computed<ChipOption[]>(() => [
    ALL,
    ...listDifficulties(this.routes()).map((value) => ({ value, label: value })),
  ]);
  protected readonly surfaceOptions = computed<ChipOption[]>(() => [
    ALL,
    ...listSurfaces(this.routes()).map((value) => ({ value, label: value })),
  ]);
  /** How many routes the draft filters would list. */
  protected readonly matches = computed(
    () => filterRoutes(searchRoutes(this.routes(), this.query()), this.draft()).length,
  );
  protected readonly applyLabel = computed(() => {
    const count = this.matches();
    if (count === 0) return 'Sin rutas con estos filtros';
    return `Ver ${count} ${count === 1 ? 'ruta' : 'rutas'}`;
  });

  constructor() {
    // Each time the sheet opens, the draft starts from what is in effect.
    effect(() => {
      if (!this.open()) return;
      untracked(() => {
        this.draftSlot.set(this.slotKey());
        this.draft.set(this.filters());
      });
    });
  }

  protected change(key: keyof RouteFilters, value: string): void {
    this.draft.update((current) => ({ ...current, [key]: value }));
  }

  protected clear(): void {
    this.draftSlot.set(this.defaultSlotKey());
    this.draft.set(DEFAULT_FILTERS);
  }

  protected apply(): void {
    this.applied.emit({ slotKey: this.draftSlot(), filters: this.draft() });
    this.closed.emit();
  }
}
