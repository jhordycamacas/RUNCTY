import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonButton, IonCheckbox, IonContent, IonSpinner } from '@ionic/angular';
import { AuthService } from '../../core/auth/auth.service';
import { FirebaseAuthGateway } from '../../core/auth/firebase-auth.gateway';
import { ApiError } from '../../core/errors/api-error';
import { userMessage } from '../../core/errors/user-message';
import { formValues } from '../../shared/forms/form-values';
import { Notice } from '../../shared/ui/notice';
import { SubpageHeader } from '../../shared/ui/subpage-header';
import { TextField } from '../../shared/ui/text-field';
import { deleteAccount } from '../application/account-use-cases';
import { AccountRepository, DeleteAccountInput, validateDeleteAccount } from '../domain/profile';

/** The server refuses when the sign-in is old even after re-typing the password. */
const RECENT_SIGN_IN_MESSAGE =
  'Por seguridad, confirma tu contraseña de nuevo e inténtalo otra vez.';

/**
 * RF-01-4: deletes credentials, profile and preferences. The password is re-entered first; on
 * success the session ends and the app goes back to the sign-in screen.
 */
@Component({
  selector: 'app-delete-account-page',
  imports: [
    ReactiveFormsModule,
    IonButton,
    IonCheckbox,
    IonContent,
    IonSpinner,
    Notice,
    SubpageHeader,
    TextField,
  ],
  template: `
    <app-subpage-header title="Eliminar cuenta" />
    <ion-content class="ion-padding">
      <app-notice
        tone="danger"
        message="Eliminar tu cuenta es permanente. Se borrarán tu acceso, tus datos personales, tu perfil deportivo y tus preferencias. No podrás recuperarlos."
      />
      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <app-text-field
          formControlName="password"
          label="Contraseña actual"
          type="password"
          autocomplete="current-password"
          enterkeyhint="go"
          [error]="fieldError('password')"
        />
        <div>
          <ion-checkbox formControlName="confirmed" labelPlacement="end" justify="start"
            >Entiendo que esta acción no se puede deshacer</ion-checkbox
          >
          @if (fieldError('confirmed'); as text) {
            <p class="error" role="alert">{{ text }}</p>
          }
        </div>

        <app-notice [message]="error()" />

        <ion-button type="submit" expand="block" color="danger" [disabled]="deleting()">
          @if (deleting()) {
            <ion-spinner name="crescent" aria-label="Eliminando" />
          } @else {
            Eliminar mi cuenta
          }
        </ion-button>
      </form>
    </ion-content>
  `,
  styles: `
    form {
      display: flex;
      flex-direction: column;
      gap: var(--rc-space-lg);
      margin-top: var(--rc-space-lg);
    }

    .error {
      margin: var(--rc-space-xs) 0 0;
      color: var(--rc-danger);
      font-size: var(--rc-font-size-caption);
    }
  `,
})
export class DeleteAccountPage {
  private readonly auth = inject(AuthService);
  private readonly gateway = inject(FirebaseAuthGateway);
  private readonly account = inject(AccountRepository);
  private readonly router = inject(Router);

  protected readonly form = inject(FormBuilder).nonNullable.group<DeleteAccountInput>({
    password: '',
    confirmed: false,
  });
  private readonly values = formValues(this.form);
  private readonly errors = computed(() => validateDeleteAccount(this.values()));
  private readonly submitted = signal(false);
  protected readonly deleting = signal(false);
  protected readonly error = signal<string | null>(null);

  protected fieldError(name: keyof DeleteAccountInput): string | null {
    return this.submitted() || this.form.controls[name].touched
      ? (this.errors()[name] ?? null)
      : null;
  }

  protected async submit(): Promise<void> {
    if (this.deleting()) return;
    this.submitted.set(true);
    this.error.set(null);
    if (Object.keys(this.errors()).length > 0) return;

    this.deleting.set(true);
    try {
      await deleteAccount(this.form.getRawValue(), {
        auth: this.gateway,
        account: this.account,
        signOut: () => this.auth.signOut(),
      });
      await this.router.navigateByUrl('/login', { replaceUrl: true });
    } catch (error) {
      this.error.set(
        error instanceof ApiError && error.reason === 'recent-sign-in-required'
          ? RECENT_SIGN_IN_MESSAGE
          : userMessage(error, 'reauthenticate'),
      );
    } finally {
      this.deleting.set(false);
    }
  }
}
