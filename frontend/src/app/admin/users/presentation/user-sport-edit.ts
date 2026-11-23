import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { IonButton, IonCheckbox, IonSpinner } from '@ionic/angular';
import { ApiError } from '../../../core/errors/api-error';
import { userMessage } from '../../../core/errors/user-message';
import { formValues } from '../../../shared/forms/form-values';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog';
import { Notice } from '../../../shared/ui/notice';
import { SelectField } from '../../../shared/ui/select-field';
import { TextField } from '../../../shared/ui/text-field';
import { ToastService } from '../../../shared/ui/toast.service';
import { SportOptionsStore } from '../../../sport-profile/application/sport-options.store';
import {
  SportProfileField,
  parseSportProfileForm,
} from '../../../sport-profile/domain/sport-profile';
import { UserDetailStore } from '../application/user-detail.store';
import { UserSportProfile } from '../domain/user-detail';
import { sportFormOf, sportRulesFor, sportServerErrors } from '../domain/user-edit';

/**
 * The inline form that replaces the sport profile panel when an admin edits a user: level, goals,
 * pace and distance within the ranges of the system settings, and a way to clear the profile.
 */
@Component({
  selector: 'app-user-sport-edit',
  imports: [
    ReactiveFormsModule,
    IonButton,
    IonCheckbox,
    IonSpinner,
    Notice,
    SelectField,
    TextField,
  ],
  template: `
    @if (!options.ready()) {
      @if (options.error(); as failure) {
        <app-notice [message]="failure" />
        <ion-button fill="outline" (click)="options.load()">Reintentar</ion-button>
      } @else {
        <p class="muted" role="status"><ion-spinner name="crescent" /> Cargando las opciones…</p>
      }
    } @else {
      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <app-select-field
          formControlName="level"
          label="Nivel"
          placeholder="Selecciona un nivel"
          [options]="levelOptions()"
          [error]="fieldError('level')"
        />

        <fieldset>
          <legend>Objetivos <small>Puedes elegir varios.</small></legend>
          @for (goal of options.goals(); track goal.code) {
            <ion-checkbox
              labelPlacement="end"
              justify="start"
              [checked]="selectedGoals().includes(goal.code)"
              (ionChange)="toggleGoal(goal.code, $event.detail.checked)"
              >{{ goal.label }}</ion-checkbox
            >
          }
          @if (fieldError('goals'); as text) {
            <p class="error" role="alert">{{ text }}</p>
          }
        </fieldset>

        <app-text-field
          formControlName="pace"
          label="Ritmo habitual (min/km)"
          placeholder="6:30"
          hint="Formato minutos:segundos por kilómetro."
          enterkeyhint="next"
          [maxlength]="5"
          [error]="fieldError('pace')"
        />
        <app-text-field
          formControlName="distance"
          label="Distancia preferida (km)"
          placeholder="10"
          inputmode="decimal"
          enterkeyhint="done"
          [maxlength]="5"
          [error]="fieldError('distance')"
        />

        <app-notice [message]="error()" />

        <div class="actions">
          <ion-button type="submit" [disabled]="busy()">
            @if (saving()) {
              <ion-spinner name="crescent" aria-label="Guardando" />
            } @else {
              Guardar
            }
          </ion-button>
          <ion-button type="button" fill="outline" [disabled]="busy()" (click)="cancelled.emit()">
            Cancelar
          </ion-button>
          @if (sport()) {
            <ion-button
              type="button"
              fill="clear"
              color="danger"
              [disabled]="busy()"
              (click)="clear()"
            >
              Borrar perfil deportivo
            </ion-button>
          }
        </div>
      </form>
    }
  `,
  styles: `
    form {
      display: flex;
      flex-direction: column;
      gap: var(--rc-space-lg);
    }

    fieldset {
      display: flex;
      flex-direction: column;
      margin: 0;
      padding: 0;
      border: 0;
    }

    legend {
      margin-bottom: var(--rc-space-sm);
      font-weight: 600;
    }

    legend small {
      color: var(--rc-text-muted);
      font-weight: 400;
    }

    ion-checkbox {
      min-height: var(--rc-min-touch-target);
    }

    .error {
      margin: var(--rc-space-xs) 0 0;
      color: var(--rc-danger);
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

    .muted {
      display: flex;
      align-items: center;
      gap: var(--rc-space-sm);
      margin: 0;
      color: var(--rc-text-muted);
    }
  `,
})
export class UserSportEdit implements OnInit {
  private readonly store = inject(UserDetailStore);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(ConfirmDialog);
  protected readonly options = inject(SportOptionsStore);

  /** `null` while the user has none: saving then creates it. */
  readonly sport = input.required<UserSportProfile | null>();
  readonly saved = output<void>();
  readonly cancelled = output<void>();

  protected readonly form = inject(FormBuilder).nonNullable.group({
    level: '',
    goals: new FormControl<string[]>([], { nonNullable: true }),
    pace: '',
    distance: '',
  });
  private readonly values = formValues(this.form);
  /** The active options and the ranges of the settings, plus the level the user already has. */
  private readonly rules = computed(() =>
    sportRulesFor(this.options.rules(), this.sport()?.level ?? null),
  );
  protected readonly levelOptions = computed(() =>
    this.rules().levels.map((code) => ({ value: code, label: this.options.levelLabel(code) })),
  );
  protected readonly selectedGoals = computed(() => this.values().goals);
  private readonly clientErrors = computed(
    () => parseSportProfileForm(this.values(), this.rules()).errors ?? {},
  );
  private readonly serverErrors = signal<Partial<Record<SportProfileField, string>>>({});
  private readonly submitted = signal(false);
  protected readonly saving = signal(false);
  protected readonly clearing = signal(false);
  protected readonly busy = computed(() => this.saving() || this.clearing());
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.form.reset(sportFormOf(this.sport(), this.rules()));
  }

  protected fieldError(name: SportProfileField): string | null {
    return (
      this.serverErrors()[name] ??
      (this.submitted() || this.form.controls[name].touched
        ? (this.clientErrors()[name] ?? null)
        : null)
    );
  }

  protected toggleGoal(goal: string, checked: boolean): void {
    const current = this.form.controls.goals.value;
    if (checked === current.includes(goal)) return;
    this.form.controls.goals.setValue(
      checked ? [...current, goal] : current.filter((g) => g !== goal),
    );
    this.form.controls.goals.markAsTouched();
  }

  protected async submit(): Promise<void> {
    if (this.busy()) return;
    this.submitted.set(true);
    this.serverErrors.set({});
    this.error.set(null);
    const result = parseSportProfileForm(this.form.getRawValue(), this.rules());
    if (!result.profile) return;

    this.saving.set(true);
    try {
      await this.store.saveSportProfile(result.profile);
      await this.toast.success('Perfil deportivo actualizado.');
      this.saved.emit();
    } catch (error) {
      const fieldErrors = error instanceof ApiError ? sportServerErrors(error.fields) : {};
      this.serverErrors.set(fieldErrors);
      if (Object.keys(fieldErrors).length === 0) this.error.set(userMessage(error));
    } finally {
      this.saving.set(false);
    }
  }

  protected async clear(): Promise<void> {
    if (this.busy()) return;
    const confirmed = await this.dialog.confirm({
      header: 'Borrar perfil deportivo',
      message:
        'Se borrarán el nivel, los objetivos, el ritmo y la distancia preferida de este usuario. Su cuenta no se verá afectada.',
      confirmText: 'Borrar',
      destructive: true,
    });
    if (!confirmed) return;

    this.clearing.set(true);
    this.error.set(null);
    try {
      await this.store.clearSportProfile();
      await this.toast.success('Perfil deportivo borrado.');
      this.saved.emit();
    } catch (error) {
      this.error.set(userMessage(error));
    } finally {
      this.clearing.set(false);
    }
  }
}
