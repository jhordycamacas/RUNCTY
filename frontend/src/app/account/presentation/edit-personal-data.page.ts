import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { IonButton, IonContent, IonSpinner } from '@ionic/angular';
import { PersonalDataFields } from '../../auth/presentation/personal-data-fields';
import { PersonalData, validatePersonalData } from '../../auth/domain/personal-data';
import { userMessage } from '../../core/errors/user-message';
import { formValues } from '../../shared/forms/form-values';
import { HasUnsavedChanges } from '../../shared/forms/unsaved-changes.guard';
import { Notice } from '../../shared/ui/notice';
import { SubpageHeader } from '../../shared/ui/subpage-header';
import { ProfileStore } from '../application/profile.store';

/** RF-01-3: edit personal data. The email cannot be changed. */
@Component({
  selector: 'app-edit-personal-data-page',
  imports: [
    ReactiveFormsModule,
    IonButton,
    IonContent,
    IonSpinner,
    Notice,
    PersonalDataFields,
    SubpageHeader,
  ],
  template: `
    <app-subpage-header title="Datos personales" />
    <ion-content class="ion-padding">
      @if (!ready()) {
        @if (store.error(); as failure) {
          <app-notice [message]="failure" />
          <ion-button fill="outline" (click)="load()">Reintentar</ion-button>
        } @else {
          <p class="state" role="status"><ion-spinner name="crescent" /> Cargando tus datos…</p>
        }
      } @else {
        <p class="email">
          <span>Correo</span>
          <strong>{{ store.profile()?.email }}</strong>
          <small>Tu correo no se puede cambiar.</small>
        </p>

        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <app-personal-data-fields [form]="form" [errorFor]="errorFor" />

          <app-notice tone="success" [message]="saved() ? 'Datos actualizados.' : null" />
          <app-notice [message]="error()" />

          <ion-button type="submit" expand="block" [disabled]="saving()">
            @if (saving()) {
              <ion-spinner name="crescent" aria-label="Guardando" />
            } @else {
              Guardar cambios
            }
          </ion-button>
        </form>
      }
    </ion-content>
  `,
  styles: `
    .email {
      display: flex;
      flex-direction: column;
      margin: 0 0 var(--rc-space-xl);
      overflow-wrap: anywhere;
    }

    .email span,
    .email small {
      color: var(--rc-text-muted);
      font-size: var(--rc-font-size-caption);
    }

    form {
      display: flex;
      flex-direction: column;
      gap: var(--rc-space-lg);
    }

    .state {
      display: flex;
      align-items: center;
      gap: var(--rc-space-sm);
      color: var(--rc-text-muted);
    }
  `,
})
export class EditPersonalDataPage implements HasUnsavedChanges {
  protected readonly store = inject(ProfileStore);

  protected readonly form = inject(FormBuilder).nonNullable.group<PersonalData>({
    firstName: '',
    lastName: '',
    birthDate: '',
    cityId: '',
    idNumber: '',
  });
  private readonly values = formValues(this.form);
  private readonly errors = computed(() => validatePersonalData(this.values()));
  /** What the server has, to tell whether the form holds unsaved changes. */
  private readonly baseline = signal<PersonalData | null>(null);
  private readonly submitted = signal(false);
  protected readonly ready = computed(() => this.baseline() !== null);
  protected readonly saving = signal(false);
  protected readonly saved = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly errorFor = (name: keyof PersonalData) =>
    this.submitted() || this.form.controls[name].touched ? (this.errors()[name] ?? null) : null;

  constructor() {
    // Home and the account tab already loaded the profile: no need to wait for it again.
    const cached = this.store.profile();
    if (cached) this.adopt(cached);
    else void this.load();
  }

  hasUnsavedChanges(): boolean {
    const baseline = this.baseline();
    return (
      baseline !== null && JSON.stringify(baseline) !== JSON.stringify(this.form.getRawValue())
    );
  }

  protected async load(): Promise<void> {
    await this.store.load();
    const profile = this.store.profile();
    if (profile && !this.baseline()) this.adopt(profile);
  }

  protected async submit(): Promise<void> {
    if (this.saving()) return;
    this.submitted.set(true);
    this.saved.set(false);
    this.error.set(null);
    if (Object.keys(this.errors()).length > 0) return;

    this.saving.set(true);
    try {
      await this.store.save(this.form.getRawValue());
      const profile = this.store.profile();
      if (profile) this.adopt(profile);
      this.saved.set(true);
    } catch (error) {
      this.error.set(userMessage(error));
    } finally {
      this.saving.set(false);
    }
  }

  private adopt(profile: NonNullable<ReturnType<ProfileStore['profile']>>): void {
    const values: PersonalData = {
      firstName: profile.firstName,
      lastName: profile.lastName,
      birthDate: profile.birthDate,
      cityId: profile.cityId,
      idNumber: profile.idNumber ?? '',
    };
    this.form.reset(values);
    this.baseline.set(values);
    this.submitted.set(false);
  }
}
