import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonInput,
  IonInputPasswordToggle,
  IonNote,
  IonSpinner,
} from '@ionic/angular';
import { AuthService } from '../core/auth/auth.service';
import { homeUrl, safeReturnUrl } from '../core/auth/home-route';
import { userMessage } from '../core/errors/user-message';

@Component({
  selector: 'app-login-page',
  imports: [
    ReactiveFormsModule,
    IonButton,
    IonContent,
    IonInput,
    IonInputPasswordToggle,
    IonNote,
    IonSpinner,
  ],
  template: `
    <ion-content>
      <main class="login">
        <h1>RUNCTY</h1>
        <p class="tagline">Inicia sesión para continuar.</p>

        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <ion-input
            formControlName="email"
            type="email"
            autocomplete="email"
            inputmode="email"
            label="Correo"
            labelPlacement="floating"
            fill="outline"
          />
          <ion-input
            formControlName="password"
            type="password"
            autocomplete="current-password"
            label="Contraseña"
            labelPlacement="floating"
            fill="outline"
          >
            <ion-input-password-toggle slot="end" />
          </ion-input>

          @if (error(); as message) {
            <ion-note color="danger" role="alert">{{ message }}</ion-note>
          }

          <ion-button type="submit" expand="block" [disabled]="loading()">
            @if (loading()) {
              <ion-spinner name="crescent" />
            } @else {
              Iniciar sesión
            }
          </ion-button>
        </form>
      </main>
    </ion-content>
  `,
  styles: `
    .login {
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-height: 100%;
      max-width: 26rem;
      margin: 0 auto;
      padding: var(--rc-space-xl);
    }

    h1 {
      margin: 0;
      color: var(--rc-primary-text);
      font-size: var(--rc-font-size-display);
    }

    .tagline {
      margin: var(--rc-space-xs) 0 var(--rc-space-xl);
      color: var(--rc-text-muted);
    }

    form {
      display: flex;
      flex-direction: column;
      gap: var(--rc-space-lg);
    }
  `,
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected async submit(): Promise<void> {
    if (this.loading()) return;
    if (this.form.invalid) {
      this.error.set('Ingresa un correo válido y tu contraseña.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    try {
      const { email, password } = this.form.getRawValue();
      await this.auth.signIn(email.trim(), password);
      const returnUrl = safeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'));
      await this.router.navigateByUrl(returnUrl ?? homeUrl(this.auth.session()), { replaceUrl: true });
    } catch (error) {
      this.error.set(userMessage(error));
    } finally {
      this.loading.set(false);
    }
  }
}
