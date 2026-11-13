import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonButton, IonSpinner } from '@ionic/angular';
import { AuthService } from '../../core/auth/auth.service';
import { homeUrl, safeReturnUrl } from '../../core/auth/home-route';
import { userMessage } from '../../core/errors/user-message';
import { formValues } from '../../shared/forms/form-values';
import { Notice } from '../../shared/ui/notice';
import { TextField } from '../../shared/ui/text-field';
import { normalizeEmail } from '../domain/personal-data';
import { validateLogin } from '../domain/registration';
import { AuthLayout } from './auth-layout';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, RouterLink, IonButton, IonSpinner, AuthLayout, Notice, TextField],
  template: `
    <app-auth-layout tagline="Inicia sesión para continuar.">
      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <app-text-field
          formControlName="email"
          label="Correo"
          type="email"
          inputmode="email"
          autocomplete="email"
          enterkeyhint="next"
          [error]="fieldError('email')"
        />
        <app-text-field
          formControlName="password"
          label="Contraseña"
          type="password"
          autocomplete="current-password"
          enterkeyhint="go"
          [error]="fieldError('password')"
        />

        <app-notice [message]="error()" />

        <ion-button type="submit" expand="block" [disabled]="loading()">
          @if (loading()) {
            <ion-spinner name="crescent" aria-label="Iniciando sesión" />
          } @else {
            Iniciar sesión
          }
        </ion-button>
      </form>

      <nav class="links" aria-label="Más opciones">
        <ion-button fill="clear" routerLink="/recuperar">¿Olvidaste tu contraseña?</ion-button>
        <ion-button fill="clear" routerLink="/registro">Crear cuenta</ion-button>
      </nav>
    </app-auth-layout>
  `,
  styles: `
    form {
      display: flex;
      flex-direction: column;
      gap: var(--rc-space-lg);
    }

    .links {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      margin-top: var(--rc-space-lg);
    }
  `,
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly form = inject(FormBuilder).nonNullable.group({ email: '', password: '' });
  private readonly values = formValues(this.form);
  private readonly errors = computed(() => validateLogin(this.values()));
  private readonly submitted = signal(false);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected fieldError(name: 'email' | 'password'): string | null {
    return this.submitted() || this.form.controls[name].touched
      ? (this.errors()[name] ?? null)
      : null;
  }

  protected async submit(): Promise<void> {
    if (this.loading()) return;
    this.submitted.set(true);
    this.error.set(null);
    if (Object.keys(this.errors()).length > 0) return;

    this.loading.set(true);
    try {
      const { email, password } = this.form.getRawValue();
      await this.auth.signIn(normalizeEmail(email), password);
      const returnUrl = safeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'));
      await this.router.navigateByUrl(returnUrl ?? homeUrl(this.auth.session()), {
        replaceUrl: true,
      });
    } catch (error) {
      this.error.set(userMessage(error));
    } finally {
      this.loading.set(false);
    }
  }
}
