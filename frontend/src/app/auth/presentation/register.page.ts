import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonButton, IonCheckbox, IonSpinner } from '@ionic/angular';
import { AuthService } from '../../core/auth/auth.service';
import { FirebaseAuthGateway } from '../../core/auth/firebase-auth.gateway';
import { homeUrl } from '../../core/auth/home-route';
import { userMessage } from '../../core/errors/user-message';
import { CityPickerField } from '../../cities/presentation/city-picker-field';
import { BirthDateField } from '../../shared/ui/birth-date-field';
import { formValues } from '../../shared/forms/form-values';
import { Notice } from '../../shared/ui/notice';
import { TextField } from '../../shared/ui/text-field';
import { registerUser } from '../application/auth-use-cases';
import { UsersRepository } from '../domain/ports';
import { PASSWORD_HINT } from '../domain/password-policy';
import { RegisterField, RegisterInput, validateRegistration } from '../domain/registration';
import { AuthLayout } from './auth-layout';

const LOPDP_TEXT =
  'RUNCTY usará tus datos (nombre, correo, fecha de nacimiento, ciudad y, si lo indicas, tu cédula) solo para ' +
  'gestionar tu cuenta y ofrecerte rutas más seguras, conforme a la Ley Orgánica de Protección de Datos ' +
  'Personales del Ecuador. Puedes actualizarlos o eliminar tu cuenta en cualquier momento desde tu perfil.';

/** RF-01-1 */
@Component({
  selector: 'app-register-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    IonButton,
    IonCheckbox,
    IonSpinner,
    AuthLayout,
    BirthDateField,
    CityPickerField,
    Notice,
    TextField,
  ],
  template: `
    <app-auth-layout tagline="Completa tus datos para crear tu cuenta de corredor.">
      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <fieldset>
          <legend>Tus datos</legend>
          <app-text-field
            formControlName="firstName"
            label="Nombres"
            autocomplete="given-name"
            enterkeyhint="next"
            [error]="fieldError('firstName')"
          />
          <app-text-field
            formControlName="lastName"
            label="Apellidos"
            autocomplete="family-name"
            enterkeyhint="next"
            [error]="fieldError('lastName')"
          />
          <app-birth-date-field formControlName="birthDate" [error]="fieldError('birthDate')" />
          <app-city-picker-field formControlName="cityId" [error]="fieldError('cityId')" />
          <app-text-field
            formControlName="idNumber"
            label="Cédula (opcional)"
            inputmode="numeric"
            hint="10 dígitos. Puedes dejarlo vacío."
            enterkeyhint="next"
            [maxlength]="10"
            [error]="fieldError('idNumber')"
          />
        </fieldset>

        <fieldset>
          <legend>Acceso</legend>
          <app-text-field
            formControlName="email"
            label="Correo electrónico"
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
            autocomplete="new-password"
            enterkeyhint="next"
            [hint]="passwordHint"
            [error]="fieldError('password')"
          />
          <app-text-field
            formControlName="confirmPassword"
            label="Confirmar contraseña"
            type="password"
            autocomplete="new-password"
            enterkeyhint="go"
            [error]="fieldError('confirmPassword')"
          />
        </fieldset>

        <fieldset>
          <legend>Privacidad</legend>
          <p class="lopdp" id="lopdp-text">{{ lopdpText }}</p>
          <ion-checkbox
            formControlName="acceptsLopdp"
            labelPlacement="end"
            justify="start"
            aria-describedby="lopdp-text"
            >Acepto el tratamiento de mis datos personales</ion-checkbox
          >
          @if (fieldError('acceptsLopdp'); as text) {
            <p class="error" role="alert">{{ text }}</p>
          }
        </fieldset>

        <app-notice [message]="error()" />

        <ion-button type="submit" expand="block" [disabled]="loading()">
          @if (loading()) {
            <ion-spinner name="crescent" aria-label="Creando cuenta" />
          } @else {
            Crear cuenta
          }
        </ion-button>
      </form>
      <ion-button fill="clear" routerLink="/login">Ya tengo una cuenta</ion-button>
    </app-auth-layout>
  `,
  styles: `
    form {
      display: flex;
      flex-direction: column;
      gap: var(--rc-space-xl);
      margin-bottom: var(--rc-space-lg);
    }

    fieldset {
      display: flex;
      flex-direction: column;
      gap: var(--rc-space-lg);
      margin: 0;
      padding: 0;
      border: 0;
    }

    legend {
      margin-bottom: var(--rc-space-md);
      font-size: var(--rc-font-size-subtitle);
      font-weight: 600;
    }

    .lopdp {
      margin: 0;
      padding: var(--rc-space-md);
      border: 1px solid var(--rc-border);
      border-radius: var(--rc-radius-md);
      background: var(--rc-surface);
      color: var(--rc-text-muted);
      font-size: var(--rc-font-size-label);
    }

    .error {
      margin: 0;
      color: var(--rc-danger);
      font-size: var(--rc-font-size-caption);
    }
  `,
})
export class RegisterPage {
  private readonly auth = inject(AuthService);
  private readonly gateway = inject(FirebaseAuthGateway);
  private readonly users = inject(UsersRepository);
  private readonly router = inject(Router);

  protected readonly lopdpText = LOPDP_TEXT;
  protected readonly passwordHint = PASSWORD_HINT;
  protected readonly form = inject(FormBuilder).nonNullable.group<RegisterInput>({
    firstName: '',
    lastName: '',
    birthDate: '',
    cityId: '',
    idNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptsLopdp: false,
  });
  private readonly values = formValues(this.form);
  private readonly errors = computed(() => validateRegistration(this.values()));
  private readonly submitted = signal(false);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  /** A message shows once the field was visited or a submit was attempted. */
  protected fieldError(name: RegisterField): string | null {
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
      await registerUser(this.form.getRawValue(), {
        auth: this.gateway,
        users: this.users,
        session: this.auth,
      });
      await this.router.navigateByUrl(homeUrl(this.auth.session()), { replaceUrl: true });
    } catch (error) {
      this.error.set(userMessage(error));
    } finally {
      this.loading.set(false);
    }
  }
}
