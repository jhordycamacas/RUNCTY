import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
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
import { CitiesStore } from '../../../cities/application/cities.store';
import { AuthService } from '../../../core/auth/auth.service';
import { formValues } from '../../../shared/forms/form-values';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog';
import { Notice } from '../../../shared/ui/notice';
import { SelectField, SelectOption } from '../../../shared/ui/select-field';
import { TextField } from '../../../shared/ui/text-field';
import { ToastService } from '../../../shared/ui/toast.service';
import { AdminRolesStore } from '../../roles/application/admin-roles.store';
import { AdminUsersStore } from '../application/admin-users.store';
import { ManagedUser, fullName } from '../domain/managed-user';
import { parseUserSearch } from '../domain/user-search';

/**
 * RF-01-2 and RF-02-3: the search of the users (filters and pages) and the assignment of their
 * role. Only an admin with `roles.manage` gets the role picker; the rest read the role.
 */
@Component({
  selector: 'app-users-admin-page',
  imports: [
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonMenuButton,
    IonSpinner,
    IonTitle,
    IonToolbar,
    Notice,
    ReactiveFormsModule,
    SelectField,
    TextField,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button />
        </ion-buttons>
        <ion-title>Usuarios</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <form class="filters" [formGroup]="form" (ngSubmit)="search()" novalidate>
        <app-text-field formControlName="firstName" label="Nombres" [maxlength]="120" />
        <app-text-field formControlName="lastName" label="Apellidos" [maxlength]="120" />
        <app-text-field
          formControlName="email"
          label="Correo electrónico"
          inputmode="email"
          [maxlength]="120"
        />
        <app-text-field
          formControlName="idNumber"
          label="Identificación"
          inputmode="numeric"
          [maxlength]="10"
        />
        <app-text-field
          formControlName="birthDate"
          label="Fecha de nacimiento"
          placeholder="AAAA-MM-DD"
          inputmode="numeric"
          [maxlength]="10"
        />
        <app-select-field
          formControlName="cityId"
          label="Ciudad"
          placeholder="Todas las ciudades"
          [options]="cityOptions()"
        />
        <app-notice class="filter-error" [message]="filterError()" />
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
                  <h2 class="user-name">{{ name(user) }}</h2>
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
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr));
      align-items: start;
      gap: var(--rc-space-md);
      margin-bottom: var(--rc-space-lg);
    }

    .filter-error {
      grid-column: 1 / -1;
    }

    .buttons {
      grid-column: 1 / -1;
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
      box-shadow: var(--rc-shadow-sm);
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

  protected readonly form = new FormGroup({
    firstName: new FormControl('', { nonNullable: true }),
    lastName: new FormControl('', { nonNullable: true }),
    email: new FormControl('', { nonNullable: true }),
    idNumber: new FormControl('', { nonNullable: true }),
    birthDate: new FormControl('', { nonNullable: true }),
    cityId: new FormControl('', { nonNullable: true }),
  });
  private readonly values = formValues(this.form);
  private readonly submitted = signal(false);
  private readonly errors = computed(() => parseUserSearch(this.values()).errors ?? {});

  protected readonly cityOptions = computed<SelectOption[]>(() =>
    (this.cities.cities() ?? []).map((city) => ({ value: city.id, label: city.name })),
  );
  /** Both format messages in one alert: a notice is announced, and it needs no field plumbing. */
  protected readonly filterError = computed(() =>
    this.submitted() ? Object.values(this.errors()).join(' ') || null : null,
  );

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
    this.submitted.set(true);
    const { filters } = parseUserSearch(this.form.getRawValue());
    if (filters) await this.store.search(filters);
  }

  protected async clear(): Promise<void> {
    this.form.reset();
    this.submitted.set(false);
    await this.store.search({});
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
