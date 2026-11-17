import {
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonButton, IonContent, IonSpinner } from '@ionic/angular';
import { Permission } from '../../../core/permissions/permissions';
import { userMessage } from '../../../core/errors/user-message';
import { formValues } from '../../../shared/forms/form-values';
import { HasUnsavedChanges } from '../../../shared/forms/unsaved-changes.guard';
import { Notice } from '../../../shared/ui/notice';
import { SubpageHeader } from '../../../shared/ui/subpage-header';
import { TextField } from '../../../shared/ui/text-field';
import { TextareaField } from '../../../shared/ui/textarea-field';
import { ToastService } from '../../../shared/ui/toast.service';
import { AdminRolesStore } from '../application/admin-roles.store';
import { PERMISSION_GROUPS, PERMISSION_LABELS, sortPermissions } from '../domain/role';
import {
  EMPTY_ROLE_FORM,
  RoleForm,
  RoleFormField,
  parseRoleForm,
  toRoleForm,
} from '../domain/role-form';

const LIST_URL = '/admin/roles';

/** RF-02-1 and RF-02-3: one form creates a role (`/nuevo`) or edits it (`/:id/editar`). */
@Component({
  selector: 'app-role-form-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    IonButton,
    IonContent,
    IonSpinner,
    Notice,
    SubpageHeader,
    TextField,
    TextareaField,
  ],
  template: `
    <app-subpage-header [title]="title" backTo="/admin/roles" />
    <ion-content class="ion-padding">
      @if (!ready()) {
        @if (loadError(); as failure) {
          <div class="state">
            <app-notice [message]="failure" />
            <ion-button fill="outline" (click)="load()">Reintentar</ion-button>
          </div>
        } @else {
          <p class="state muted" role="status"><ion-spinner name="crescent" /> Cargando rol…</p>
        }
      } @else {
        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <h2 #heading tabindex="-1">{{ title }}</h2>

          <app-text-field
            formControlName="id"
            label="Identificador"
            hint="Minúsculas, números y guion bajo. No se puede cambiar después."
            [maxlength]="32"
            [error]="errorFor('id')"
          />
          <app-text-field
            formControlName="name"
            label="Nombre"
            [maxlength]="60"
            [error]="errorFor('name')"
          />
          <app-textarea-field
            formControlName="description"
            label="Descripción (opcional)"
            [maxlength]="200"
            [error]="errorFor('description')"
          />

          <div class="permissions">
            <h3>Permisos</h3>
            @for (group of groups; track group.label) {
              <fieldset>
                <legend>{{ group.label }}</legend>
                @for (permission of group.permissions; track permission) {
                  <label class="check">
                    <input
                      type="checkbox"
                      [checked]="selected().includes(permission)"
                      (change)="toggle(permission, $event)"
                    />
                    <span>{{ labels[permission] }}</span>
                  </label>
                }
              </fieldset>
            }
          </div>

          <app-notice [message]="error()" />

          <div class="buttons">
            <ion-button type="submit" [disabled]="saving()">
              @if (saving()) {
                <ion-spinner name="crescent" aria-label="Guardando" />
              } @else {
                Guardar rol
              }
            </ion-button>
            <ion-button fill="outline" routerLink="/admin/roles">Cancelar</ion-button>
          </div>
        </form>
      }
    </ion-content>
  `,
  styles: `
    form {
      display: flex;
      flex-direction: column;
      gap: var(--rc-space-lg);
      max-width: 48rem;
    }

    h2 {
      margin: 0;
      font-size: var(--rc-font-size-subtitle);
    }

    h3 {
      margin: 0 0 var(--rc-space-sm);
      font-size: var(--rc-font-size-body);
    }

    fieldset {
      display: flex;
      flex-direction: column;
      min-width: 0;
      margin: 0 0 var(--rc-space-md);
      padding: var(--rc-space-sm) var(--rc-space-md);
      border: 1px solid var(--rc-border);
      border-radius: var(--rc-radius-md);
    }

    legend {
      padding: 0 var(--rc-space-xs);
      font-weight: 600;
    }

    .check {
      display: flex;
      align-items: center;
      gap: var(--rc-space-md);
      min-height: var(--rc-min-touch-target);
    }

    .check input {
      flex: none;
      width: 24px;
      height: 24px;
      accent-color: var(--rc-primary);
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
    }

    .muted {
      color: var(--rc-text-muted);
    }
  `,
})
export class RoleFormPage implements HasUnsavedChanges {
  private readonly store = inject(AdminRolesStore);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly injector = inject(Injector);
  private readonly roleId = inject(ActivatedRoute).snapshot.paramMap.get('id');
  private readonly heading = viewChild<ElementRef<HTMLElement>>('heading');

  protected readonly title = this.roleId ? 'Editar rol' : 'Nuevo rol';
  protected readonly groups = PERMISSION_GROUPS;
  protected readonly labels = PERMISSION_LABELS;

  protected readonly form = new FormGroup({
    id: new FormControl('', { nonNullable: true }),
    name: new FormControl('', { nonNullable: true }),
    description: new FormControl('', { nonNullable: true }),
    permissions: new FormControl<Permission[]>([], { nonNullable: true }),
  });
  private readonly values = formValues(this.form);
  private readonly errors = computed(
    () => parseRoleForm(this.values(), this.roleId !== null).errors ?? {},
  );
  protected readonly selected = computed(() => this.values().permissions);
  /** What is stored, to tell whether the form holds unsaved changes. */
  private readonly baseline = signal<RoleForm | null>(null);
  private readonly submitted = signal(false);
  protected readonly ready = computed(() => this.baseline() !== null);
  protected readonly loadError = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly errorFor = (name: RoleFormField) =>
    this.submitted() || this.form.controls[name].touched ? (this.errors()[name] ?? null) : null;

  constructor() {
    if (this.roleId) void this.load();
    else this.adopt(EMPTY_ROLE_FORM);
  }

  hasUnsavedChanges(): boolean {
    const baseline = this.baseline();
    return (
      baseline !== null && JSON.stringify(baseline) !== JSON.stringify(this.form.getRawValue())
    );
  }

  protected async load(): Promise<void> {
    if (!this.roleId) return;
    this.loadError.set(null);
    try {
      const role = await this.store.find(this.roleId);
      if (role) this.adopt(toRoleForm(role));
      else this.loadError.set('El rol ya no existe.');
    } catch (error) {
      this.loadError.set(userMessage(error));
    }
  }

  protected toggle(permission: Permission, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const current = this.form.controls.permissions.value.filter((item) => item !== permission);
    this.form.controls.permissions.setValue(
      sortPermissions(checked ? [...current, permission] : current),
    );
  }

  protected async submit(): Promise<void> {
    if (this.saving()) return;
    this.submitted.set(true);
    this.error.set(null);
    const { input } = parseRoleForm(this.form.getRawValue(), this.roleId !== null);
    if (!input) return;

    this.saving.set(true);
    try {
      const synced = await this.store.save(this.roleId, input);
      this.baseline.set(this.form.getRawValue());
      await this.toast.success(this.savedMessage(synced));
      await this.router.navigateByUrl(LIST_URL);
    } catch (error) {
      this.error.set(userMessage(error));
    } finally {
      this.saving.set(false);
    }
  }

  private savedMessage(synced: number): string {
    if (!this.roleId) return 'Rol creado.';
    if (synced === 0) return 'Rol actualizado.';
    return `Rol actualizado. Se actualizó el acceso de ${synced} ${synced === 1 ? 'usuario' : 'usuarios'}.`;
  }

  private adopt(values: RoleForm): void {
    this.form.reset(values);
    if (this.roleId) this.form.controls.id.disable();
    this.baseline.set(this.form.getRawValue());
    this.submitted.set(false);
    // The form replaces the loading state: move the focus to it (keyboard and screen readers).
    afterNextRender(() => this.heading()?.nativeElement.focus(), { injector: this.injector });
  }
}
