import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { IonButton, IonContent, IonSpinner } from '@ionic/angular';
import { PASSWORD_HINT } from '../../auth/domain/password-policy';
import { FirebaseAuthGateway } from '../../core/auth/firebase-auth.gateway';
import { userMessage } from '../../core/errors/user-message';
import { formValues } from '../../shared/forms/form-values';
import { Notice } from '../../shared/ui/notice';
import { SubpageHeader } from '../../shared/ui/subpage-header';
import { TextField } from '../../shared/ui/text-field';
import { changePassword } from '../application/account-use-cases';
import { ChangePasswordInput, validateChangePassword } from '../domain/profile';

/** RF-01-3: change the password after confirming the current one. */
@Component({
  selector: 'app-change-password-page',
  imports: [
    ReactiveFormsModule,
    IonButton,
    IonContent,
    IonSpinner,
    Notice,
    SubpageHeader,
    TextField,
  ],
  template: `
    <app-subpage-header title="Cambiar contraseña" />
    <ion-content class="ion-padding">
      <p class="intro">Primero confirma tu contraseña actual y luego elige una nueva.</p>
      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <app-text-field
          formControlName="currentPassword"
          label="Contraseña actual"
          type="password"
          autocomplete="current-password"
          enterkeyhint="next"
          [error]="fieldError('currentPassword')"
        />
        <app-text-field
          formControlName="newPassword"
          label="Nueva contraseña"
          type="password"
          autocomplete="new-password"
          enterkeyhint="next"
          [hint]="passwordHint"
          [error]="fieldError('newPassword')"
        />
        <app-text-field
          formControlName="confirmNewPassword"
          label="Confirmar nueva contraseña"
          type="password"
          autocomplete="new-password"
          enterkeyhint="go"
          [error]="fieldError('confirmNewPassword')"
        />

        <app-notice tone="success" [message]="done() ? 'Tu contraseña se actualizó.' : null" />
        <app-notice [message]="error()" />

        <ion-button type="submit" expand="block" [disabled]="saving()">
          @if (saving()) {
            <ion-spinner name="crescent" aria-label="Guardando" />
          } @else {
            Cambiar contraseña
          }
        </ion-button>
      </form>
    </ion-content>
  `,
  styles: `
    .intro {
      margin: 0 0 var(--rc-space-lg);
      color: var(--rc-text-muted);
    }

    form {
      display: flex;
      flex-direction: column;
      gap: var(--rc-space-lg);
    }
  `,
})
export class ChangePasswordPage {
  private readonly auth = inject(FirebaseAuthGateway);

  protected readonly passwordHint = PASSWORD_HINT;
  protected readonly form = inject(FormBuilder).nonNullable.group<ChangePasswordInput>({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  private readonly values = formValues(this.form);
  private readonly errors = computed(() => validateChangePassword(this.values()));
  private readonly submitted = signal(false);
  protected readonly saving = signal(false);
  protected readonly done = signal(false);
  protected readonly error = signal<string | null>(null);

  protected fieldError(name: keyof ChangePasswordInput): string | null {
    return this.submitted() || this.form.controls[name].touched
      ? (this.errors()[name] ?? null)
      : null;
  }

  protected async submit(): Promise<void> {
    if (this.saving()) return;
    this.submitted.set(true);
    this.done.set(false);
    this.error.set(null);
    if (Object.keys(this.errors()).length > 0) return;

    this.saving.set(true);
    try {
      await changePassword(this.form.getRawValue(), { auth: this.auth });
      this.form.reset();
      this.submitted.set(false);
      this.done.set(true);
    } catch (error) {
      this.error.set(userMessage(error, 'reauthenticate'));
    } finally {
      this.saving.set(false);
    }
  }
}
