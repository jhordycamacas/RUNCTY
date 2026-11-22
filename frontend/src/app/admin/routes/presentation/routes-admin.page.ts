import { Component, computed, effect, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonMenuButton,
  IonSpinner,
  IonTitle,
  IonToolbar,
  ViewWillEnter,
} from '@ionic/angular';
import { formatDistance } from '../../../preferences/domain/units';
import { DIFFICULTY_LABELS } from '../../../routes/domain/labels';
import { Route } from '../../../routes/domain/route';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog';
import { Notice } from '../../../shared/ui/notice';
import { SelectField } from '../../../shared/ui/select-field';
import { ToastService } from '../../../shared/ui/toast.service';
import { AdminRoutesStore } from '../application/admin-routes.store';
import { routeSlotLevels } from '../domain/slot-safety';
import { SlotSafetyList } from './slot-safety-list';

/** RF-05-2 and RF-05-4: the routes of a city, inactive ones included, and their deletion. */
@Component({
  selector: 'app-routes-admin-page',
  imports: [
    RouterLink,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonInput,
    IonMenuButton,
    IonSpinner,
    IonTitle,
    IonToolbar,
    Notice,
    ReactiveFormsModule,
    SelectField,
    SlotSafetyList,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button />
        </ion-buttons>
        <ion-title>Rutas</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div class="filters">
        <app-select-field label="Ciudad o zona" [options]="placeOptions()" [formControl]="city" />
        <ion-input
          label="Buscar ruta"
          labelPlacement="floating"
          fill="outline"
          type="search"
          placeholder="Nombre o descripción"
          [clearInput]="true"
          [value]="store.query()"
          (ionInput)="store.query.set($event.detail.value ?? '')"
        />
        <ion-button routerLink="/admin/rutas/nueva">Nueva ruta</ion-button>
      </div>

      @if (store.placesError(); as failure) {
        <div class="state">
          <app-notice [message]="'No pudimos cargar las ciudades. ' + failure" />
          <ion-button fill="outline" (click)="store.loadPlaces()">Reintentar</ion-button>
        </div>
      }

      @if (store.routes() === null) {
        @if (store.error(); as failure) {
          <div class="state">
            <app-notice [message]="failure" />
            <ion-button fill="outline" (click)="store.load()">Reintentar</ion-button>
          </div>
        } @else {
          <p class="state muted" role="status"><ion-spinner name="crescent" /> Cargando rutas…</p>
        }
      } @else {
        @if (store.error(); as failure) {
          <div class="state">
            <app-notice [message]="failure" />
            <ion-button fill="outline" (click)="store.load()">Reintentar</ion-button>
          </div>
        }
        @if (store.routes()?.length === 0) {
          <p class="state muted" role="status">Aún no hay rutas en esta ciudad o zona.</p>
        } @else {
          <ul class="routes">
            @for (route of store.visibleRoutes(); track route.id) {
              <li class="route">
                <div class="summary">
                  <h2>
                    <a class="route-name" [routerLink]="['/admin/rutas', route.id]">{{
                      route.name
                    }}</a>
                  </h2>
                  <p class="meta">
                    <span>{{ distance(route) }}</span>
                    <span>{{ difficulty(route) }}</span>
                    <span class="segments">{{ segments(route) }}</span>
                    <span class="status" [class.inactive]="!route.active">{{
                      route.active ? 'Activa' : 'Inactiva'
                    }}</span>
                    @if (store.cityId() === null) {
                      <span>{{ store.placeName(route.cityId) }}</span>
                    }
                  </p>
                  <app-slot-safety-list [levels]="levels(route)" />
                </div>
                <div class="actions">
                  <ion-button
                    fill="outline"
                    [routerLink]="['/admin/rutas', route.id]"
                    [queryParams]="{ seccion: 'tramos' }"
                    [attr.aria-label]="'Tramos de ' + route.name"
                    >Tramos</ion-button
                  >
                  <ion-button
                    fill="outline"
                    [routerLink]="['/admin/rutas', route.id, 'editar']"
                    [attr.aria-label]="'Editar ' + route.name"
                    >Editar</ion-button
                  >
                  <ion-button
                    fill="clear"
                    color="danger"
                    [attr.aria-label]="'Eliminar ' + route.name"
                    (click)="remove(route)"
                    >Eliminar</ion-button
                  >
                </div>
              </li>
            } @empty {
              <li class="state muted" role="status">Ninguna ruta coincide con la búsqueda.</li>
            }
          </ul>
        }
      }
    </ion-content>
  `,
  styles: `
    .filters {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr));
      align-items: center;
      gap: var(--rc-space-md);
      margin-bottom: var(--rc-space-lg);
    }

    .state {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--rc-space-sm);
      margin: 0 0 var(--rc-space-lg);
    }

    .muted {
      color: var(--rc-text-muted);
    }

    .routes {
      display: flex;
      flex-direction: column;
      gap: var(--rc-space-md);
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .route {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--rc-space-md);
    }

    .summary {
      display: flex;
      flex: 1 1 18rem;
      flex-direction: column;
      gap: var(--rc-space-sm);
      min-width: 0;
    }

    h2 {
      margin: 0;
      font-size: var(--rc-font-size-body);
      overflow-wrap: anywhere;
    }

    .route-name {
      display: inline-flex;
      align-items: center;
      min-height: var(--rc-min-touch-target);
      color: var(--rc-text);
      font-size: var(--rc-font-size-subtitle);
      font-weight: 500;
      text-decoration-color: var(--rc-primary-text);
      text-underline-offset: 4px;
    }

    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: var(--rc-space-xs) var(--rc-space-md);
      margin: 0;
      color: var(--rc-text-muted);
      font-size: var(--rc-font-size-label);
    }

    .status {
      font-weight: 600;
      color: var(--rc-success);
    }

    .status.inactive {
      color: var(--rc-text-muted);
    }

    .segments {
      padding: 0 var(--rc-space-sm);
      border-radius: var(--rc-radius-pill);
      background: var(--rc-surface);
      color: var(--rc-text);
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      gap: var(--rc-space-sm);
    }
  `,
})
export class RoutesAdminPage implements ViewWillEnter {
  protected readonly store = inject(AdminRoutesStore);
  private readonly dialog = inject(ConfirmDialog);
  private readonly toast = inject(ToastService);

  protected readonly placeOptions = computed(() => [
    { value: '', label: 'Todas las ciudades' },
    ...(this.store.places() ?? []).map((place) => ({ value: place.id, label: place.name })),
  ]);
  protected readonly city = new FormControl(this.store.cityId() ?? '', { nonNullable: true });

  constructor() {
    this.city.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((value) => void this.store.selectCity(value || null));
    // Saving a route of another city switches the list to it: the picker follows.
    effect(() => this.city.setValue(this.store.cityId() ?? '', { emitEvent: false }));
  }

  /** Every time the list shows again (after a form or a detail), it asks the API again. */
  ionViewWillEnter(): void {
    void this.store.loadPlaces();
    void this.store.load();
  }

  protected distance(route: Route): string {
    return formatDistance(route.distanceKm, 'metric');
  }

  protected difficulty(route: Route): string {
    return route.difficulty ? DIFFICULTY_LABELS[route.difficulty] : 'Sin dificultad';
  }

  /** "1 tramo", "4 tramos". */
  protected segments(route: Route): string {
    return `${route.segmentCount} ${route.segmentCount === 1 ? 'tramo' : 'tramos'}`;
  }

  protected levels(route: Route) {
    return routeSlotLevels(route);
  }

  protected async remove(route: Route): Promise<void> {
    const deleted = await this.dialog.confirmAction({
      header: 'Eliminar ruta',
      message: `Se eliminará "${route.name}" con sus tramos, franjas horarias y factores de riesgo. Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      destructive: true,
      run: () => this.store.deleteRoute(route.id),
    });
    if (deleted) await this.toast.success('Ruta eliminada.');
  }
}
