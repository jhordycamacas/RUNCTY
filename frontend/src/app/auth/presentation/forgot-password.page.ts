import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonButton, IonSpinner } from '@ionic/angular';
import { FirebaseAuthGateway } from '../../core/auth/firebase-auth.gateway';
import { userMessage } from '../../core/errors/user-message';
import { formValues } from '../../shared/forms/form-values';
import { Notice } from '../../shared/ui/notice';
import { TextField } from '../../shared/ui/text-field';
import { requestPasswordReset } from '../application/auth-use-cases';
import { validateEmail } from '../domain/personal-data';
import { AuthLayout } from './auth-layout';

// Neutral on purpose: it must not reveal whether the account exists.
export const RESET_SENT_MESSAGE =
  'Si existe una cuenta con ese correo, te enviamos un enlace para restablecer tu contraseña. Revisa también tu carpeta de spam.';

/** RF-01-7 */
@Component({
  selector: 'app-forgot-password-page',
  imports: [ReactiveFormsModule, RouterLink, IonButton, IonSpinner, AuthLayout, Notice, TextField],
  template: `
    <app-auth-layout
      tagline="Escribe el correo de tu cuenta y te enviaremos un enlace para crear una nueva contraseña."
    >
      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <app-text-field
          formControlName="email"
          label="Correo"
          type="email"
          inputmode="email"
          autocomplete="email"
          enterkeyhint="send"
          [error]="emailError()"
        />

        <app-notice [message]="error()" />
        <app-notice tone="success" [message]="sent() ? sentMessage : null" />

        <ion-button type="submit" expand="block" [disabled]="loading()">
          @if (loading()) {
            <ion-spinner name="crescent" aria-label="Enviando" />
          } @else {
            Enviar enlace
          }
        </ion-button>
      </form>
      <ion-button fill="clear" routerLink="/login">Volver a iniciar sesión</ion-button>
    </app-auth-layout>
  `,
  styles: `
    form {
      display: flex;
      flex-direction: column;
      gap: var(--rc-space-lg);
      margin-bottom: var(--rc-space-lg);
    }
  `,
})
export class ForgotPasswordPage {
  private readonly auth = inject(FirebaseAuthGateway);

  protected readonly sentMessage = RESET_SENT_MESSAGE;
  protected readonly form = inject(FormBuilder).nonNullable.group({ email: '' });
  private readonly values = formValues(this.form);
  private readonly submitted = signal(false);
  protected readonly loading = signal(false);
  protected readonly sent = signal(false);
  protected readonly error = signal<string | null>(null);

  protected emailError(): string | null {
    const show = this.submitted() || this.form.controls.email.touched;
    return show ? validateEmail(this.values().email ?? '') : null;
  }

  protected async submit(): Promise<void> {
    if (this.loading()) return;
    this.submitted.set(true);
    this.sent.set(false);
    this.error.set(null);
    if (validateEmail(this.form.getRawValue().email)) return;

    this.loading.set(true);
    try {
      await requestPasswordReset(this.form.getRawValue().email, { auth: this.auth });
      this.sent.set(true);
    } catch (error) {
      this.error.set(userMessage(error));
    } finally {
      this.loading.set(false);
    }
  }
}
