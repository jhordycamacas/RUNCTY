import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { IonButton, IonSpinner } from '@ionic/angular';
import { PersonalData } from '../../../auth/domain/personal-data';
import { PersonalDataFields } from '../../../auth/presentation/personal-data-fields';
import { ApiError } from '../../../core/errors/api-error';
import { userMessage } from '../../../core/errors/user-message';
import { formValues } from '../../../shared/forms/form-values';
import { Notice } from '../../../shared/ui/notice';
import { ToastService } from '../../../shared/ui/toast.service';
import { UserDetailStore } from '../application/user-detail.store';
import { parsePersonalEdit, personalFormOf, personalServerErrors } from '../domain/user-edit';
import { UserProfile } from '../domain/user-detail';

/**
 * The inline form that replaces the personal profile panel when an admin edits a user. It uses the
 * same fields and rules as the runner's form; the e-mail is shown but cannot change.
 */
@Component({
  selector: 'app-user-personal-edit',
  imports: [ReactiveFormsModule, IonButton, IonSpinner, Notice, PersonalDataFields],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <p class="email">
        <span>Correo electrónico</span>
        <strong>{{ user().email }}</strong>
        <small>El correo es el acceso del usuario y no se puede cambiar aquí.</small>
      </p>

      <app-personal-data-fields [form]="form" [errorFor]="errorFor" />

      <app-notice [message]="error()" />

      <div class="actions">
        <ion-button type="submit" [disabled]="saving()">
          @if (saving()) {
            <ion-spinner name="crescent" aria-label="Guardando" />
          } @else {
            Guardar
          }
        </ion-button>
        <ion-button type="button" fill="outline" [disabled]="saving()" (click)="cancelled.emit()">
          Cancelar
        </ion-button>
      </div>
    </form>
  `,
  styles: `
    form {
      display: flex;
      flex-direction: column;
      gap: var(--rc-space-lg);
    }

    .email {
      display: flex;
      flex-direction: column;
      margin: 0;
      overflow-wrap: anywhere;
    }

    .email span,
    .email small {
      color: var(--rc-text-muted);
      font-size: var(--rc-font-size-caption);
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--rc-space-sm);
    }

    ion-button {
      min-height: var(--rc-min-touch-target);
    }
  `,
})
export class UserPersonalEdit implements OnInit {
  private readonly store = inject(UserDetailStore);
  private readonly toast = inject(ToastService);

  readonly user = input.required<UserProfile>();
  /** The data was saved. */
  readonly saved = output<void>();
  readonly cancelled = output<void>();

  protected readonly form = inject(FormBuilder).nonNullable.group<PersonalData>({
    firstName: '',
    lastName: '',
    birthDate: '',
    cityId: '',
    idNumber: '',
  });
  private readonly values = formValues(this.form);
  private readonly clientErrors = computed(() => parsePersonalEdit(this.values()).errors ?? {});
  private readonly serverErrors = signal<Partial<Record<keyof PersonalData, string>>>({});
  private readonly submitted = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly errorFor = (name: keyof PersonalData) =>
    this.serverErrors()[name] ??
    (this.submitted() || this.form.controls[name].touched
      ? (this.clientErrors()[name] ?? null)
      : null);

  ngOnInit(): void {
    this.form.reset(personalFormOf(this.user()));
  }

  protected async submit(): Promise<void> {
    if (this.saving()) return;
    this.submitted.set(true);
    this.serverErrors.set({});
    this.error.set(null);
    const result = parsePersonalEdit(this.form.getRawValue());
    if (!result.data) return;

    this.saving.set(true);
    try {
      await this.store.savePersonalData(result.data);
      await this.toast.success('Datos actualizados.');
      this.saved.emit();
    } catch (error) {
      const fieldErrors = error instanceof ApiError ? personalServerErrors(error.fields) : {};
      this.serverErrors.set(fieldErrors);
      if (Object.keys(fieldErrors).length === 0) this.error.set(userMessage(error));
    } finally {
      this.saving.set(false);
    }
  }
}
