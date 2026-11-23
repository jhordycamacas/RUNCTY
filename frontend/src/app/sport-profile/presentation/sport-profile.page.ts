import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  IonButton,
  IonCheckbox,
  IonContent,
  IonRadio,
  IonRadioGroup,
  IonSpinner,
} from '@ionic/angular';
import { userMessage } from '../../core/errors/user-message';
import { formValues } from '../../shared/forms/form-values';
import { HasUnsavedChanges } from '../../shared/forms/unsaved-changes.guard';
import { ConfirmDialog } from '../../shared/ui/confirm-dialog';
import { Notice } from '../../shared/ui/notice';
import { SubpageHeader } from '../../shared/ui/subpage-header';
import { TextField } from '../../shared/ui/text-field';
import { PreferencesStore } from '../../preferences/application/preferences.store';
import { formatDistance } from '../../preferences/domain/units';
import { SportOptionsStore } from '../application/sport-options.store';
import { SportProfileStore } from '../application/sport-profile.store';
import {
  EMPTY_SPORT_PROFILE_FORM,
  SportProfileField,
  SportProfileForm,
  formatPace,
  parseSportProfileForm,
  toSportProfileForm,
} from '../domain/sport-profile';

/** RF-01-9..12: create, read, update and delete the sport profile. */
@Component({
  selector: 'app-sport-profile-page',
  imports: [
    ReactiveFormsModule,
    IonButton,
    IonCheckbox,
    IonContent,
    IonRadio,
    IonRadioGroup,
    IonSpinner,
    Notice,
    SubpageHeader,
    TextField,
  ],
  template: `
    <app-subpage-header title="Perfil deportivo" />
    <ion-content class="ion-padding">
      @switch (store.status()) {
        @case ('loading') {
          <p class="state" role="status">
            <ion-spinner name="crescent" /> Cargando tu perfil deportivo…
          </p>
        }
        @case ('error') {
          <app-notice [message]="store.error()" />
          <ion-button fill="outline" (click)="store.load()">Reintentar</ion-button>
        }
        @default {
          <app-notice tone="success" [message]="notice()" />
          <app-notice [message]="store.error()" />

          @if (showForm() && !options.ready()) {
            @if (options.error(); as failure) {
              <app-notice [message]="failure" />
              <ion-button fill="outline" (click)="options.load()">Reintentar</ion-button>
            } @else {
              <p class="state" role="status">
                <ion-spinner name="crescent" /> Cargando las opciones…
              </p>
            }
          } @else if (showForm()) {
            @if (store.status() === 'empty') {
              <app-notice
                tone="info"
                message="Crea tu perfil deportivo: cuéntanos cómo corres para recomendarte mejores rutas."
              />
            }
            <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
              <fieldset>
                <legend>Nivel</legend>
                <ion-radio-group formControlName="level">
                  @for (level of options.levels(); track level.code) {
                    <ion-radio [value]="level.code" labelPlacement="end" justify="start">{{
                      level.label
                    }}</ion-radio>
                  }
                </ion-radio-group>
                @if (fieldError('level'); as text) {
                  <p class="error" role="alert">{{ text }}</p>
                }
              </fieldset>

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
              <ion-button type="submit" expand="block" [disabled]="saving()">
                @if (saving()) {
                  <ion-spinner name="crescent" aria-label="Guardando" />
                } @else {
                  Guardar perfil deportivo
                }
              </ion-button>
              @if (store.profile()) {
                <ion-button fill="clear" expand="block" (click)="cancelEdit()">Cancelar</ion-button>
              }
            </form>
          } @else if (store.profile(); as profile) {
            <dl class="stats">
              <div>
                <dt>Ritmo habitual</dt>
                <dd>{{ pace(profile.usualPaceSecPerKm) }} min/km</dd>
              </div>
              <div>
                <dt>Distancia preferida</dt>
                <dd>{{ distance(profile.preferredDistanceKm) }}</dd>
              </div>
              <div>
                <dt>Nivel</dt>
                <dd>{{ options.levelLabel(profile.level) }}</dd>
              </div>
            </dl>
            <h2>Objetivos</h2>
            <ul class="goals">
              @for (goal of profile.goals; track goal) {
                <li>{{ options.goalLabel(goal) }}</li>
              }
            </ul>

            <div class="actions">
              <ion-button expand="block" (click)="startEdit()">Editar perfil deportivo</ion-button>
              <ion-button
                expand="block"
                fill="outline"
                color="danger"
                [disabled]="deleting()"
                (click)="remove()"
              >
                @if (deleting()) {
                  <ion-spinner name="crescent" aria-label="Eliminando" />
                } @else {
                  Eliminar perfil deportivo
                }
              </ion-button>
            </div>
          }
        }
      }
    </ion-content>
  `,
  styles: `
    form,
    .actions {
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

    .error {
      margin: var(--rc-space-xs) 0 0;
      color: var(--rc-danger);
      font-size: var(--rc-font-size-caption);
    }

    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
      gap: var(--rc-space-md);
      margin: 0 0 var(--rc-space-lg);
    }

    .stats div {
      padding: var(--rc-space-md);
      border: 1px solid var(--rc-border);
      border-radius: var(--rc-radius-md);
      background: var(--rc-surface);
    }

    dt {
      color: var(--rc-text-muted);
      font-size: var(--rc-font-size-caption);
    }

    dd {
      margin: 0;
      font-size: var(--rc-font-size-subtitle);
      font-weight: 600;
    }

    h2 {
      margin: 0 0 var(--rc-space-sm);
      font-size: var(--rc-font-size-subtitle);
    }

    .goals {
      display: flex;
      flex-wrap: wrap;
      gap: var(--rc-space-sm);
      margin: 0 0 var(--rc-space-xl);
      padding: 0;
      list-style: none;
    }

    .goals li {
      padding: var(--rc-space-xs) var(--rc-space-md);
      border: 1px solid var(--rc-border);
      border-radius: var(--rc-radius-lg);
      box-shadow: var(--rc-shadow-sm);
    }

    .state {
      display: flex;
      align-items: center;
      gap: var(--rc-space-sm);
      color: var(--rc-text-muted);
    }
  `,
})
export class SportProfilePage implements HasUnsavedChanges {
  protected readonly store = inject(SportProfileStore);
  private readonly dialog = inject(ConfirmDialog);
  private readonly preferences = inject(PreferencesStore).preferences;

  protected readonly options = inject(SportOptionsStore);
  protected readonly pace = formatPace;
  /** Distances follow the unit preference (RF-01-13). */
  protected readonly distance = (km: number) => formatDistance(km, this.preferences().units);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    level: '',
    goals: new FormControl<string[]>([], { nonNullable: true }),
    pace: '',
    distance: '',
  });
  private readonly values = formValues(this.form);
  private readonly errors = computed(() => {
    const result = parseSportProfileForm(this.values(), this.options.rules());
    return result.errors ?? {};
  });
  private readonly baseline = signal<SportProfileForm>(EMPTY_SPORT_PROFILE_FORM);
  private readonly submitted = signal(false);
  protected readonly editing = signal(false);
  protected readonly showForm = computed(() => this.store.status() === 'empty' || this.editing());
  protected readonly selectedGoals = computed(() => this.values().goals);
  protected readonly saving = signal(false);
  protected readonly deleting = signal(false);
  protected readonly notice = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);

  constructor() {
    void this.store.load();
    void this.options.load();
  }

  hasUnsavedChanges(): boolean {
    return (
      this.showForm() && JSON.stringify(this.baseline()) !== JSON.stringify(this.form.getRawValue())
    );
  }

  protected fieldError(name: SportProfileField): string | null {
    return this.submitted() || this.form.controls[name].touched
      ? (this.errors()[name] ?? null)
      : null;
  }

  protected toggleGoal(goal: string, checked: boolean): void {
    const current = this.form.controls.goals.value;
    if (checked === current.includes(goal)) return;
    this.form.controls.goals.setValue(
      checked ? [...current, goal] : current.filter((g) => g !== goal),
    );
    this.form.controls.goals.markAsTouched();
  }

  protected startEdit(): void {
    const profile = this.store.profile();
    this.notice.set(null);
    this.open(profile ? toSportProfileForm(profile, this.options.rules()) : EMPTY_SPORT_PROFILE_FORM);
    this.editing.set(true);
  }

  protected cancelEdit(): void {
    this.editing.set(false);
    this.error.set(null);
  }

  protected async submit(): Promise<void> {
    if (this.saving()) return;
    this.submitted.set(true);
    this.notice.set(null);
    this.error.set(null);
    const result = parseSportProfileForm(this.form.getRawValue(), this.options.rules());
    if (!result.profile) return;

    this.saving.set(true);
    try {
      await this.store.save(result.profile);
      this.open(toSportProfileForm(result.profile, this.options.rules()));
      this.editing.set(false);
      this.notice.set('Perfil deportivo guardado.');
    } catch (error) {
      this.error.set(userMessage(error));
    } finally {
      this.saving.set(false);
    }
  }

  protected async remove(): Promise<void> {
    const confirmed = await this.dialog.confirm({
      header: 'Eliminar perfil deportivo',
      message:
        'Se borrarán tu nivel, objetivos, ritmo y distancia preferida. Tu cuenta no se verá afectada.',
      confirmText: 'Eliminar',
      destructive: true,
    });
    if (!confirmed) return;

    this.deleting.set(true);
    this.error.set(null);
    try {
      await this.store.remove();
      this.open(EMPTY_SPORT_PROFILE_FORM);
      this.notice.set('Perfil deportivo eliminado.');
    } catch (error) {
      this.error.set(userMessage(error));
    } finally {
      this.deleting.set(false);
    }
  }

  /** Puts `values` in the form and makes them the reference for "unsaved changes". */
  private open(values: SportProfileForm): void {
    this.form.reset(values);
    this.baseline.set(values);
    this.submitted.set(false);
  }
}
