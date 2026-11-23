import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonContent, IonInput, IonSpinner, ViewWillEnter } from '@ionic/angular';
import { CitiesStore } from '../../../cities/application/cities.store';
import { AuthService } from '../../../core/auth/auth.service';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog';
import { Notice } from '../../../shared/ui/notice';
import { SelectOption } from '../../../shared/ui/select-field';
import { ToastService } from '../../../shared/ui/toast.service';
import { AdminRolesStore } from '../../roles/application/admin-roles.store';
import { AdminUsersStore } from '../application/admin-users.store';
import { ManagedUser, fullName } from '../domain/managed-user';
import { AdminHeader } from '../../admin-header';

/**
 * RF-01-2 and RF-02-3: the search of the users (one text box and pages) and the assignment of their
 * role. Only an admin with `roles.manage` gets the role picker; the rest read the role.
 */
@Component({
  selector: 'app-users-admin-page',
  imports: [
    AdminHeader,
    IonButton,
    IonContent,
    IonInput,
    IonSpinner,
    Notice,
    RouterLink,
  ],
  template: `
    <app-admin-header title="Usuarios" />
    <ion-content class="ion-padding">
      <form class="filters" (submit)="$event.preventDefault(); search()">
        <ion-input
          label="Buscar por cédula, correo o nombre"
          labelPlacement="floating"
          fill="outline"
          type="search"
          inputmode="search"
          enterkeyhint="search"
          autocomplete="off"
          helperText="Escribe una cédula de 10 dígitos, un correo o parte del nombre."
          [maxlength]="120"
          [value]="query()"
          (ionInput)="query.set($event.detail.value ?? '')"
        />
        <div class="buttons">
          <ion-button type="submit">Buscar</ion-button>
          <ion-button fill="outline" (click)="clear()">Limpiar</ion-button>
        </div>
      </form>

      @if (store.error(); as failure) {
        <div class="state">
          <app-notice [message]="failure" />
          @if (store.users() === null) {
            <ion-button fill="outline" (click)="store.reload()">Reintentar</ion-button>
          }
        </div>
      }

      @if (store.users(); as users) {
        @if (users.length === 0) {
          <p class="state muted" role="status">No hay usuarios que coincidan con la búsqueda.</p>
        } @else {
          <ul class="users">
            @for (user of users; track user.uid) {
              <li class="user">
                <div class="summary">
                  <h2>
                    <a class="user-name" [routerLink]="['/admin/usuarios', user.uid]">{{
                      name(user)
                    }}</a>
                  </h2>
                  <p class="meta">
                    <span>{{ user.email }}</span>
                    <span>{{ cityName(user.cityId) }}</span>
                  </p>
                </div>
                <div class="role">
                  @if (canAssign) {
                    <select
                      class="role-select"
                      [attr.aria-label]="'Rol de ' + name(user)"
                      (change)="changeRole(user, $event)"
                    >
                      @if (user.role === null) {
                        <option value="" selected disabled>Sin rol</option>
                      }
                      @for (option of roleOptions(user); track option.value) {
                        <option [value]="option.value" [selected]="option.value === user.role">
                          {{ option.label }}
                        </option>
                      }
                    </select>
                  } @else {
                    <span class="role-name">{{ roles.roleName(user.role) }}</span>
                  }
                </div>
              </li>
            }
          </ul>
          @if (store.hasMore()) {
            <div class="more">
              <ion-button fill="outline" [disabled]="store.loadingMore()" (click)="store.loadMore()">
                @if (store.loadingMore()) {
                  <ion-spinner name="crescent" aria-label="Cargando" />
                } @else {
                  Cargar más
                }
              </ion-button>
            </div>
          }
        }
      } @else if (!store.error()) {
        <p class="state muted" role="status"><ion-spinner name="crescent" /> Cargando usuarios…</p>
      }
    </ion-content>
  `,
  styles: `
    .filters {
      display: flex;
      flex-direction: column;
      gap: var(--rc-space-md);
      margin-bottom: var(--rc-space-lg);
    }

    .buttons {
      display: flex;
      flex-wrap: wrap;
      gap: var(--rc-space-sm);
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

    .users {
      display: flex;
      flex-direction: column;
      gap: var(--rc-space-md);
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .user {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--rc-space-md);
      padding: var(--rc-space-lg);
      border: 1px solid var(--rc-border);
      border-radius: var(--rc-radius-lg);
      box-shadow: var(--rc-shadow-sm);
      background: var(--rc-surface-elevated);
    }

    .summary {
      flex: 1 1 16rem;
      min-width: 0;
    }

    h2 {
      margin: 0 0 var(--rc-space-xs);
      font-size: var(--rc-font-size-subtitle);
      overflow-wrap: anywhere;
    }

    .user-name {
      display: inline-flex;
      align-items: center;
      min-height: var(--rc-min-touch-target);
    }

    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: var(--rc-space-xs) var(--rc-space-md);
      margin: 0;
      color: var(--rc-text-muted);
      font-size: var(--rc-font-size-label);
      overflow-wrap: anywhere;
    }

    .role {
      flex: 0 1 14rem;
    }

    .role-name {
      font-weight: 600;
    }

    .role-select {
      width: 100%;
      min-height: var(--rc-min-touch-target);
      padding: 0 var(--rc-space-md);
      border: 1px solid var(--rc-control-border);
      border-radius: var(--rc-radius-sm);
      background: transparent;
      color: var(--rc-text);
      font: inherit;
    }

    .more {
      display: flex;
      justify-content: center;
      margin-top: var(--rc-space-lg);
    }
  `,
})
export class UsersAdminPage implements ViewWillEnter {
  protected readonly store = inject(AdminUsersStore);
  protected readonly roles = inject(AdminRolesStore);
  private readonly cities = inject(CitiesStore);
  private readonly dialog = inject(ConfirmDialog);
  private readonly toast = inject(ToastService);
  /** Assigning roles needs `roles.manage`; the search itself only needs `users.read`. */
  protected readonly canAssign = inject(AuthService).can('roles.manage');

  /** One text for the cédula, the email or the name. */
  protected readonly query = signal('');

  /** Every time the list shows again, it asks the API again; the roles name the assignments. */
  ionViewWillEnter(): void {
    void this.cities.load();
    void this.roles.load();
    void this.store.reload();
  }

  protected name(user: ManagedUser): string {
    return fullName(user);
  }

  protected cityName(cityId: string): string {
    return this.cities.byId().get(cityId)?.name ?? cityId;
  }

  /** The catalogue, plus the current role when it was deleted from it. */
  protected roleOptions(user: ManagedUser): SelectOption[] {
    const options = (this.roles.roles() ?? []).map((role) => ({ value: role.id, label: role.name }));
    if (user.role !== null && !options.some((option) => option.value === user.role)) {
      options.push({ value: user.role, label: user.role });
    }
    return options;
  }

  protected async search(): Promise<void> {
    await this.store.search(this.query());
  }

  protected async clear(): Promise<void> {
    this.query.set('');
    await this.store.search('');
  }

  protected async changeRole(user: ManagedUser, event: Event): Promise<void> {
    const select = event.target as HTMLSelectElement;
    const roleId = select.value;
    const changed = await this.dialog.confirmAction({
      header: 'Cambiar rol',
      message: `${this.name(user)} pasará de "${this.roles.roleName(user.role)}" a "${this.roles.roleName(roleId)}". Su sesión se cerrará para aplicar los nuevos permisos.`,
      confirmText: 'Cambiar rol',
      run: async () => {
        await this.roles.assign(user.uid, roleId);
        this.store.setRole(user.uid, roleId);
      },
    });
    if (changed) await this.toast.success('Rol actualizado.');
    else select.value = user.role ?? '';
  }
}
