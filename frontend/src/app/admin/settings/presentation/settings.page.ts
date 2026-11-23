import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { IonButton, IonContent, IonSpinner } from '@ionic/angular';
import {
  DEFAULT_SETTINGS,
  SettingKey,
  SystemSettings,
} from '../../../core/settings/system-settings';
import { ApiError } from '../../../core/errors/api-error';
import { userMessage } from '../../../core/errors/user-message';
import { formValues } from '../../../shared/forms/form-values';
import { HasUnsavedChanges } from '../../../shared/forms/unsaved-changes.guard';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog';
import { Notice } from '../../../shared/ui/notice';
import { TextField } from '../../../shared/ui/text-field';
import { ToastService } from '../../../shared/ui/toast.service';
import { AdminHeader } from '../../admin-header';
import { SettingsStore } from '../application/settings.store';
import { SETTING_GROUPS, SettingField } from '../domain/settings-fields';
import {
  SettingsForm,
  changedSettings,
  levelsReadout,
  parseSettingsForm,
  serverErrors,
  toSettingsForm,
} from '../domain/settings-form';
import { recalculatedMessage } from '../domain/system-settings';
import { SettingsTabs } from './settings-tabs';

/**
 * The system parameters in one form: grouped panels, one save for all of them, a reset to the
 * defaults (still needs saving) and the recalculation of every route on demand.
 */
@Component({
  selector: 'app-settings-page',
  imports: [
    AdminHeader,
    IonButton,
    IonContent,
    IonSpinner,
    Notice,
    ReactiveFormsModule,
    SettingsTabs,
    TextField,
  ],
  template: `
    <app-admin-header title="Configuración" />
    <ion-content class="ion-padding">
      <app-settings-tabs />
      @if (!ready()) {
        @if (store.error(); as failure) {
          <div class="state">
            <app-notice [message]="failure" />
            <ion-button fill="outline" (click)="load()">Reintentar</ion-button>
          </div>
        } @else {
          <p class="state muted" role="status">
            <ion-spinner name="crescent" /> Cargando la configuración…
          </p>
        }
      } @else {
        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          @for (group of groups; track group.id) {
            <section class="panel" [attr.aria-labelledby]="'settings-' + group.id">
              <h2 [id]="'settings-' + group.id">{{ group.title }}</h2>
              <p class="description">{{ group.description }}</p>
              <div class="fields">
                @for (field of group.fields; track field.key) {
                  <app-text-field
                    [formControlName]="field.key"
                    [label]="field.label"
                    [hint]="field.hint"
                    [inputmode]="inputmode(field)"
                    [error]="errorFor(field.key)"
                  />
                }
              </div>
              @if (group.id === 'safety') {
                <p class="readout" role="status">
                  {{ levels() ?? 'Completa los umbrales para ver los niveles.' }}
                </p>
              }
            </section>
          }

          <app-notice [message]="error()" />

          <div class="actions">
            <ion-button type="submit" [disabled]="!changed() || saving()">
              @if (saving()) {
                <ion-spinner name="crescent" aria-label="Guardando" />
              } @else {
                Guardar cambios
              }
            </ion-button>
            <ion-button fill="outline" [disabled]="saving()" (click)="reset()">
              Restablecer valores por defecto
            </ion-button>
            <ion-button
              fill="outline"
              [disabled]="saving() || recalculating()"
              (click)="recalculate()"
            >
              @if (recalculating()) {
                <ion-spinner name="crescent" aria-label="Recalculando" />
              } @else {
                Recalcular rutas
              }
            </ion-button>
          </div>
          <p class="note">
            «Recalcular rutas» usa los valores ya guardados. Los cambios del formulario se aplican
            al guardarlos.
          </p>
        </form>
      }
    </ion-content>
  `,
  styles: `
    form {
      display: flex;
      flex-direction: column;
      gap: var(--rc-space-lg);
      max-width: 64rem;
    }

    .panel {
      display: flex;
      flex-direction: column;
      gap: var(--rc-space-md);
      padding: var(--rc-space-lg);
      border-radius: var(--rc-radius-lg);
      background: var(--rc-surface-elevated);
    }

    h2 {
      margin: 0;
      font-size: var(--rc-font-size-subtitle);
    }

    .description,
    .note {
      margin: 0;
      color: var(--rc-text-muted);
      font-size: var(--rc-font-size-label);
    }

    .fields {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr));
      align-items: start;
      gap: var(--rc-space-md);
    }

    .readout {
      margin: 0;
      padding: var(--rc-space-md);
      border-radius: var(--rc-radius-md);
      background: var(--rc-surface);
      font-weight: 600;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--rc-space-sm);
    }

    .state {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--rc-space-sm);
    }

    .muted {
      color: var(--rc-text-muted);
    }
  `,
})
export class SettingsPage implements HasUnsavedChanges {
  protected readonly store = inject(SettingsStore);
  private readonly dialog = inject(ConfirmDialog);
  private readonly toast = inject(ToastService);

  protected readonly groups = SETTING_GROUPS;

  protected readonly form = inject(FormBuilder).nonNullable.group<SettingsForm>({
    ...toSettingsForm(DEFAULT_SETTINGS),
  });
  private readonly values = formValues(this.form);
  private readonly errors = computed(() => parseSettingsForm(this.values()).errors ?? {});
  protected readonly levels = computed(() => levelsReadout(this.values()));

  /** What is stored, as form text, to tell whether there is anything to save. */
  private readonly baseline = signal<SettingsForm | null>(null);
  protected readonly ready = computed(() => this.baseline() !== null);
  protected readonly changed = computed(
    () => JSON.stringify(this.baseline()) !== JSON.stringify(this.values()),
  );

  private readonly submitted = signal(false);
  /** What the API rejected, with the text typed then: it stops showing once the field changes. */
  private readonly rejected = signal<Partial<Record<SettingKey, { message: string; text: string }>>>({});
  protected readonly saving = signal(false);
  protected readonly recalculating = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly errorFor = (key: SettingKey): string | null => {
    if (this.submitted() || this.form.controls[key].touched) {
      const own = this.errors()[key];
      if (own) return own;
    }
    const rejection = this.rejected()[key];
    return rejection && rejection.text === this.values()[key] ? rejection.message : null;
  };

  protected readonly inputmode = (field: SettingField) =>
    field.kind === 'text' ? 'text' : field.kind === 'decimal' ? 'decimal' : 'numeric';

  constructor() {
    void this.load();
  }

  hasUnsavedChanges(): boolean {
    return this.ready() && this.changed();
  }

  protected async load(): Promise<void> {
    await this.store.load();
    const settings = this.store.settings();
    if (settings) this.adopt(settings);
  }

  protected async submit(): Promise<void> {
    if (this.saving() || !this.changed()) return;
    this.submitted.set(true);
    this.error.set(null);
    const { settings } = parseSettingsForm(this.form.getRawValue());
    const stored = this.store.settings();
    if (!settings || !stored) return;

    const changes = changedSettings(stored, settings);
    if (Object.keys(changes).length === 0) {
      this.adopt(stored);
      return;
    }
    await this.save(changes);
  }

  protected async reset(): Promise<void> {
    const confirmed = await this.dialog.confirm({
      header: 'Restablecer valores por defecto',
      message:
        'Se llenará el formulario con los valores por defecto. No se aplican hasta que guardes los cambios.',
      confirmText: 'Restablecer',
    });
    if (!confirmed) return;
    this.form.reset(toSettingsForm(DEFAULT_SETTINGS));
    this.rejected.set({});
    this.submitted.set(false);
    this.error.set(null);
  }

  protected async recalculate(): Promise<void> {
    if (this.saving() || this.recalculating()) return;
    this.recalculating.set(true);
    this.error.set(null);
    try {
      await this.toast.success(`${recalculatedMessage(await this.store.recalculate())}.`);
    } catch (error) {
      this.error.set(userMessage(error));
    } finally {
      this.recalculating.set(false);
    }
  }

  private async save(changes: Partial<SystemSettings>): Promise<void> {
    this.saving.set(true);
    try {
      const recalculated = await this.store.save(changes);
      const stored = this.store.settings();
      if (stored) this.adopt(stored);
      await this.toast.success(
        recalculated > 0
          ? `Configuración guardada. ${recalculatedMessage(recalculated)}.`
          : 'Configuración guardada.',
      );
    } catch (error) {
      this.error.set(userMessage(error));
      if (error instanceof ApiError) this.rejectFields(serverErrors(error.fields));
    } finally {
      this.saving.set(false);
    }
  }

  private rejectFields(messages: Partial<Record<SettingKey, string>>): void {
    const values = this.form.getRawValue();
    this.rejected.set(
      Object.fromEntries(
        Object.entries(messages).map(([key, message]) => [
          key,
          { message, text: values[key as SettingKey] },
        ]),
      ),
    );
  }

  private adopt(settings: SystemSettings): void {
    const form = toSettingsForm(settings);
    this.form.reset(form);
    this.baseline.set(form);
    this.rejected.set({});
    this.submitted.set(false);
  }
}
