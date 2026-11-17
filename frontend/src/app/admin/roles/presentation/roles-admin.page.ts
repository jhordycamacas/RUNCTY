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
import { AdminRolesStore } from '../application/admin-roles.store';
import { PERMISSION_LABELS, Role } from '../domain/role';

/** RF-02-2 and RF-02-4: the roles with their permissions, and the deletion of the unused ones. */
@Component({
  selector: 'app-roles-admin-page',
  imports: [
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
        <ion-title>Roles</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div class="toolbar">
        <ion-button routerLink="/admin/roles/nuevo">Nuevo rol</ion-button>
      </div>

      @if (store.error(); as failure) {
        <div class="state">
          <app-notice [message]="failure" />
          <ion-button fill="outline" (click)="store.load()">Reintentar</ion-button>
        </div>
      }

      @if (store.roles(); as roles) {
        @if (roles.length === 0) {
          <p class="state muted" role="status">Aún no hay roles.</p>
        } @else {
          <ul class="roles">
            @for (role of roles; track role.id) {
              <li class="role">
                <div class="summary">
                  <h2>
                    <span class="role-name">{{ role.name }}</span>
                    @if (role.system) {
                      <span class="badge">Del sistema</span>
                    }
                  </h2>
                  <p class="meta">
                    Identificador: <code>{{ role.id }}</code>
                  </p>
                  @if (role.description) {
                    <p class="description">{{ role.description }}</p>
                  }
                  @if (role.permissions.length === 0) {
                    <p class="muted">Sin permisos</p>
                  } @else {
                    <ul class="permissions" [attr.aria-label]="'Permisos de ' + role.name">
                      @for (permission of role.permissions; track permission) {
                        <li>{{ labels[permission] }}</li>
                      }
                    </ul>
                  }
                </div>
                <div class="actions">
                  <ion-button
                    fill="outline"
                    [routerLink]="['/admin/roles', role.id, 'editar']"
                    [attr.aria-label]="'Editar ' + role.name"
                    >Editar</ion-button
                  >
                  @if (!role.system) {
                    <ion-button
                      fill="clear"
                      color="danger"
                      [attr.aria-label]="'Eliminar ' + role.name"
                      (click)="remove(role)"
                      >Eliminar</ion-button
                    >
                  }
                </div>
              </li>
            }
          </ul>
        }
      } @else if (!store.error()) {
        <p class="state muted" role="status"><ion-spinner name="crescent" /> Cargando roles…</p>
      }
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

    .roles {
      display: flex;
      flex-direction: column;
      gap: var(--rc-space-md);
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .role {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: var(--rc-space-md);
      padding: var(--rc-space-lg);
      border: 1px solid var(--rc-border);
      border-radius: var(--rc-radius-lg);
      background: var(--rc-surface-elevated);
      box-shadow: var(--rc-shadow-sm);
    }

    .summary {
      display: flex;
      flex: 1 1 18rem;
      flex-direction: column;
      gap: var(--rc-space-sm);
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

    .meta,
    .description {
      margin: 0;
      color: var(--rc-text-muted);
      font-size: var(--rc-font-size-label);
      overflow-wrap: anywhere;
    }

    .permissions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--rc-space-xs) var(--rc-space-sm);
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .permissions li {
      padding: 2px var(--rc-space-sm);
      border-radius: var(--rc-radius-sm);
      border: 1px solid var(--rc-border);
      background: var(--rc-surface);
      color: var(--rc-text);
      font-size: var(--rc-font-size-label);
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      gap: var(--rc-space-sm);
    }
  `,
})
export class RolesAdminPage implements ViewWillEnter {
  protected readonly store = inject(AdminRolesStore);
  private readonly dialog = inject(ConfirmDialog);
  private readonly toast = inject(ToastService);
  protected readonly labels = PERMISSION_LABELS;

  /** Every time the list shows again (after a form), it asks the API again. */
  ionViewWillEnter(): void {
    void this.store.load();
  }

  protected async remove(role: Role): Promise<void> {
    const deleted = await this.dialog.confirmAction({
      header: 'Eliminar rol',
      message: `Se eliminará el rol "${role.name}". Solo se puede eliminar si no tiene usuarios asignados. Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      destructive: true,
      run: () => this.store.remove(role.id),
    });
    if (deleted) await this.toast.success('Rol eliminado.');
  }
}
