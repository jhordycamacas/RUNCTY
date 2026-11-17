import { NgTemplateOutlet } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonMenuButton,
  IonSpinner,
  IonTitle,
  IonToolbar,
  ViewWillEnter,
} from '@ionic/angular';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog';
import { Notice } from '../../../shared/ui/notice';
import { ToastService } from '../../../shared/ui/toast.service';
import { AdminCitiesStore } from '../application/admin-cities.store';
import { CITY_TYPE_LABELS, COVERAGE_LABELS, ManagedCity } from '../domain/managed-city';

/** RF-04-2 and RF-04-4: the cities with their zones and coverage, and the deletion of a place. */
@Component({
  selector: 'app-cities-admin-page',
  imports: [
    NgTemplateOutlet,
    RouterLink,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonMenuButton,
    IonSpinner,
    IonTitle,
    IonToolbar,
    Notice,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button />
        </ion-buttons>
        <ion-title>Ciudades y zonas</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div class="toolbar">
        <ion-button routerLink="/admin/ciudades/nueva">Nueva ciudad o zona</ion-button>
      </div>

      @if (store.error(); as failure) {
        <div class="state">
          <app-notice [message]="failure" />
          <ion-button fill="outline" (click)="store.load()">Reintentar</ion-button>
        </div>
      }

      @if (store.groups(); as groups) {
        @if (groups.length === 0) {
          <p class="state muted" role="status">Aún no hay ciudades ni zonas.</p>
        } @else {
          <ul class="groups">
            @for (group of groups; track group.city.id) {
              <li class="group">
                <ng-container
                  [ngTemplateOutlet]="place"
                  [ngTemplateOutletContext]="{ $implicit: group.city }"
                />
                @if (group.zones.length > 0) {
                  <ul class="zones" [attr.aria-label]="'Zonas de ' + group.city.name">
                    @for (zone of group.zones; track zone.id) {
                      <li>
                        <ng-container
                          [ngTemplateOutlet]="place"
                          [ngTemplateOutletContext]="{ $implicit: zone }"
                        />
                      </li>
                    }
                  </ul>
                }
              </li>
            }
          </ul>
        }
      } @else if (!store.error()) {
        <p class="state muted" role="status"><ion-spinner name="crescent" /> Cargando ciudades…</p>
      }

      <ng-template #place let-item>
        <div class="place">
          <div class="summary">
            <h2>
              <span class="place-name">{{ item.name }}</span>
              <span class="badge">{{ typeLabel(item) }}</span>
            </h2>
            <p class="meta">
              <span>{{ item.province }}</span>
              <span class="coverage" [class]="item.coverage">{{ coverageLabel(item) }}</span>
            </p>
          </div>
          <div class="actions">
            @if (item.type === 'city') {
              <ion-button
                fill="clear"
                [routerLink]="['/admin/ciudades/nueva']"
                [queryParams]="{ ciudad: item.id }"
                [attr.aria-label]="'Agregar zona a ' + item.name"
                >Agregar zona</ion-button
              >
            }
            <ion-button
              fill="outline"
              [routerLink]="['/admin/ciudades', item.id, 'editar']"
              [attr.aria-label]="'Editar ' + item.name"
              >Editar</ion-button
            >
            <ion-button
              fill="clear"
              color="danger"
              [attr.aria-label]="'Eliminar ' + item.name"
              (click)="remove(item)"
              >Eliminar</ion-button
            >
          </div>
        </div>
      </ng-template>
    </ion-content>
  `,
  styles: `
    .toolbar {
      display: flex;
      justify-content: flex-end;
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

    .groups,
    .zones {
      display: flex;
      flex-direction: column;
      gap: var(--rc-space-md);
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .group {
      padding: var(--rc-space-lg);
      border: 1px solid var(--rc-border);
      border-radius: var(--rc-radius-lg);
      box-shadow: var(--rc-shadow-sm);
      background: var(--rc-surface-elevated);
    }

    .zones {
      margin-top: var(--rc-space-md);
      padding-left: var(--rc-space-lg);
      border-left: 2px solid var(--rc-border);
    }

    .place {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--rc-space-md);
    }

    .summary {
      flex: 1 1 14rem;
      min-width: 0;
    }

    h2 {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--rc-space-sm);
      margin: 0;
      font-size: var(--rc-font-size-subtitle);
      overflow-wrap: anywhere;
    }

    .badge {
      padding: 2px var(--rc-space-sm);
      border: 1px solid var(--rc-border);
      border-radius: var(--rc-radius-sm);
      color: var(--rc-text-muted);
      font-size: var(--rc-font-size-caption);
      font-weight: 600;
    }

    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: var(--rc-space-xs) var(--rc-space-md);
      margin: var(--rc-space-xs) 0 0;
      color: var(--rc-text-muted);
      font-size: var(--rc-font-size-label);
    }

    .coverage {
      font-weight: 600;
    }

    .coverage.active {
      color: var(--rc-success);
    }

    .coverage.suspended {
      color: var(--rc-danger);
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      gap: var(--rc-space-sm);
    }
  `,
})
export class CitiesAdminPage implements ViewWillEnter {
  protected readonly store = inject(AdminCitiesStore);
  private readonly dialog = inject(ConfirmDialog);
  private readonly toast = inject(ToastService);

  /** Every time the list shows again (after a form), it asks the API again. */
  ionViewWillEnter(): void {
    void this.store.load();
  }

  protected typeLabel(item: ManagedCity): string {
    return CITY_TYPE_LABELS[item.type];
  }

  protected coverageLabel(item: ManagedCity): string {
    return COVERAGE_LABELS[item.coverage];
  }

  protected async remove(item: ManagedCity): Promise<void> {
    const isCity = item.type === 'city';
    const deleted = await this.dialog.confirmAction({
      header: isCity ? 'Eliminar ciudad' : 'Eliminar zona',
      message: `Se eliminará "${item.name}". Solo se puede eliminar si no tiene rutas asociadas${isCity ? ' ni zonas' : ''}. Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      destructive: true,
      run: () => this.store.remove(item.id),
    });
    if (deleted) await this.toast.success(isCity ? 'Ciudad eliminada.' : 'Zona eliminada.');
  }
}
