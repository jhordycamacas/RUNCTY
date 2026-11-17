import { Component, computed, inject, signal } from '@angular/core';
import {
  IonButton,
  IonContent,
  IonRadio,
  IonRadioGroup,
  IonSpinner,
  IonToggle,
} from '@ionic/angular';
import { userMessage } from '../../core/errors/user-message';
import { HasUnsavedChanges } from '../../shared/forms/unsaved-changes.guard';
import { ConfirmDialog } from '../../shared/ui/confirm-dialog';
import { Notice } from '../../shared/ui/notice';
import { SubpageHeader } from '../../shared/ui/subpage-header';
import { PreferencesStore } from '../application/preferences.store';
import {
  APPEARANCES,
  APPEARANCE_LABELS,
  FONT_SCALES,
  FONT_SCALE_LABELS,
  LOCATION_PRIVACY_LABELS,
  LOCATION_PRIVACY_OPTIONS,
  NotificationPreferences,
  Preferences,
  UNIT_SYSTEMS,
  UNIT_SYSTEM_LABELS,
  fontScaleMultiplier,
} from '../domain/preferences';

function options<T extends string>(values: readonly T[], labels: Record<T, string>) {
  return values.map((value) => ({ value, label: labels[value] }));
}

/** RF-01-13..16: create, view, update and reset the preferences. */
@Component({
  selector: 'app-preferences-page',
  imports: [
    IonButton,
    IonContent,
    IonRadio,
    IonRadioGroup,
    IonSpinner,
    IonToggle,
    Notice,
    SubpageHeader,
  ],
  template: `
    <app-subpage-header title="Preferencias" />
    <ion-content class="ion-padding">
      @if (draft(); as value) {
        <fieldset>
          <legend>Idioma</legend>
          <ion-radio-group [value]="value.language">
            <ion-radio value="es" labelPlacement="end" justify="start">Español</ion-radio>
            <ion-radio value="en" labelPlacement="end" justify="start" [disabled]="true"
              >English (próximamente)</ion-radio
            >
          </ion-radio-group>
          <p class="hint">Por ahora RUNCTY está disponible solo en español.</p>
        </fieldset>

        <fieldset>
          <legend>Tamaño de letra</legend>
          <ion-radio-group
            [value]="value.fontScale"
            (ionChange)="update({ fontScale: $event.detail.value })"
          >
            @for (option of fontScales; track option.value) {
              <ion-radio [value]="option.value" labelPlacement="end" justify="start">{{
                option.label
              }}</ion-radio>
            }
          </ion-radio-group>
          <div class="preview" aria-live="polite">
            <span class="hint">Vista previa</span>
            <p [style.font-size.rem]="previewSize()">Así se verá el texto en RUNCTY.</p>
          </div>
        </fieldset>

        <fieldset>
          <legend>Apariencia</legend>
          <ion-radio-group
            [value]="value.appearance"
            (ionChange)="update({ appearance: $event.detail.value })"
          >
            @for (option of appearances; track option.value) {
              <ion-radio [value]="option.value" labelPlacement="end" justify="start">{{
                option.label
              }}</ion-radio>
            }
          </ion-radio-group>
        </fieldset>

        <fieldset>
          <legend>Unidades de distancia</legend>
          <ion-radio-group
            [value]="value.units"
            (ionChange)="update({ units: $event.detail.value })"
          >
            @for (option of units; track option.value) {
              <ion-radio [value]="option.value" labelPlacement="end" justify="start">{{
                option.label
              }}</ion-radio>
            }
          </ion-radio-group>
        </fieldset>

        <fieldset>
          <legend>Notificaciones <span class="soon">Próximamente</span></legend>
          <p class="hint">Guardamos tu elección, pero todavía no enviamos notificaciones.</p>
          <ion-toggle
            justify="space-between"
            [checked]="value.notifications.enabled"
            (ionChange)="updateNotifications({ enabled: $event.detail.checked })"
            >Recibir notificaciones</ion-toggle
          >
          <ion-toggle
            justify="space-between"
            [checked]="value.notifications.safetyAlerts"
            [disabled]="!value.notifications.enabled"
            (ionChange)="updateNotifications({ safetyAlerts: $event.detail.checked })"
            >Alertas de seguridad</ion-toggle
          >
          <ion-toggle
            justify="space-between"
            [checked]="value.notifications.events"
            [disabled]="!value.notifications.enabled"
            (ionChange)="updateNotifications({ events: $event.detail.checked })"
            >Eventos</ion-toggle
          >
        </fieldset>

        <fieldset>
          <legend>Privacidad de ubicación <span class="soon">Próximamente</span></legend>
          <p class="hint">
            Decide quién podrá ver tu ubicación. Guardamos tu elección, pero todavía no se comparte
            la ubicación.
          </p>
          <ion-radio-group
            [value]="value.locationPrivacy"
            (ionChange)="update({ locationPrivacy: $event.detail.value })"
          >
            @for (option of locationPrivacy; track option.value) {
              <ion-radio [value]="option.value" labelPlacement="end" justify="start">{{
                option.label
              }}</ion-radio>
            }
          </ion-radio-group>
        </fieldset>

        <app-notice tone="success" [message]="notice()" />
        <app-notice [message]="error()" />

        <div class="actions">
          <ion-button expand="block" [disabled]="busy()" (click)="save()">
            @if (busy() === 'save') {
              <ion-spinner name="crescent" aria-label="Guardando" />
            } @else {
              Guardar preferencias
            }
          </ion-button>
          <ion-button expand="block" fill="clear" [disabled]="busy() !== null" (click)="reset()">
            @if (busy() === 'reset') {
              <ion-spinner name="crescent" aria-label="Restableciendo" />
            } @else {
              Restablecer valores predeterminados
            }
          </ion-button>
        </div>
      } @else if (store.error(); as failure) {
        <app-notice [message]="failure" />
        <ion-button fill="outline" (click)="load()">Reintentar</ion-button>
      } @else {
        <p class="state" role="status">
          <ion-spinner name="crescent" /> Cargando tus preferencias…
        </p>
      }
    </ion-content>
  `,
  styles: `
    fieldset {
      display: flex;
      flex-direction: column;
      margin: 0 0 var(--rc-space-xl);
      padding: 0;
      border: 0;
    }

    legend {
      margin-bottom: var(--rc-space-sm);
      font-size: var(--rc-font-size-subtitle);
      font-weight: 600;
    }

    .soon {
      margin-left: var(--rc-space-sm);
      padding: 2px var(--rc-space-sm);
      border: 1px solid var(--rc-border);
      border-radius: var(--rc-radius-lg);
      box-shadow: var(--rc-shadow-sm);
      color: var(--rc-text-muted);
      font-size: var(--rc-font-size-caption);
      font-weight: 500;
    }

    .hint {
      margin: var(--rc-space-xs) 0 var(--rc-space-sm);
      color: var(--rc-text-muted);
      font-size: var(--rc-font-size-label);
    }

    .preview {
      margin-top: var(--rc-space-md);
      padding: var(--rc-space-md);
      border: 1px solid var(--rc-border);
      border-radius: var(--rc-radius-md);
      background: var(--rc-surface);
    }

    .preview p {
      margin: 0;
    }

    .actions {
      display: flex;
      flex-direction: column;
      gap: var(--rc-space-sm);
      margin-top: var(--rc-space-lg);
    }

    .state {
      display: flex;
      align-items: center;
      gap: var(--rc-space-sm);
      color: var(--rc-text-muted);
    }
  `,
})
export class PreferencesPage implements HasUnsavedChanges {
  protected readonly store = inject(PreferencesStore);
  private readonly dialog = inject(ConfirmDialog);

  protected readonly fontScales = options(FONT_SCALES, FONT_SCALE_LABELS);
  protected readonly appearances = options(APPEARANCES, APPEARANCE_LABELS);
  protected readonly units = options(UNIT_SYSTEMS, UNIT_SYSTEM_LABELS);
  protected readonly locationPrivacy = options(LOCATION_PRIVACY_OPTIONS, LOCATION_PRIVACY_LABELS);

  /**
   * What the user is editing. It is set once, when the preferences are first known, and only a
   * save or a reset replaces it, so a late answer from the API never wipes the draft and the
   * page never re-renders from scratch (which would jump the scroll position).
   */
  protected readonly draft = signal<Preferences | null>(null);
  private readonly baseline = signal<Preferences | null>(null);
  protected readonly busy = signal<'save' | 'reset' | null>(null);
  protected readonly notice = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly previewSize = computed(() => {
    const draft = this.draft();
    return draft ? fontScaleMultiplier(draft.fontScale) : 1;
  });

  constructor() {
    void this.load();
  }

  hasUnsavedChanges(): boolean {
    const draft = this.draft();
    return draft !== null && JSON.stringify(draft) !== JSON.stringify(this.baseline());
  }

  protected async load(): Promise<void> {
    await this.store.load();
    if (this.store.loaded() && !this.draft()) this.adopt(this.store.preferences());
  }

  protected update(patch: Partial<Preferences>): void {
    this.notice.set(null);
    this.draft.update((draft) => (draft ? { ...draft, ...patch } : draft));
  }

  protected updateNotifications(patch: Partial<NotificationPreferences>): void {
    const draft = this.draft();
    if (draft) this.update({ notifications: { ...draft.notifications, ...patch } });
  }

  protected async save(): Promise<void> {
    const draft = this.draft();
    if (!draft || this.busy()) return;
    await this.run('save', async () => {
      await this.store.save(draft);
      this.baseline.set(this.store.preferences());
      this.notice.set('Preferencias guardadas.');
    });
  }

  protected async reset(): Promise<void> {
    if (this.busy()) return;
    const confirmed = await this.dialog.confirm({
      header: 'Restablecer preferencias',
      message:
        'Se aplicarán los valores predeterminados de idioma, letra, apariencia, unidades, notificaciones y ubicación.',
      confirmText: 'Restablecer',
      destructive: true,
    });
    if (!confirmed) return;
    await this.run('reset', async () => {
      await this.store.reset();
      this.adopt(this.store.preferences());
      this.notice.set('Se restablecieron los valores predeterminados.');
    });
  }

  private async run(action: 'save' | 'reset', work: () => Promise<void>): Promise<void> {
    this.busy.set(action);
    this.notice.set(null);
    this.error.set(null);
    try {
      await work();
    } catch (error) {
      this.error.set(userMessage(error));
    } finally {
      this.busy.set(null);
    }
  }

  private adopt(preferences: Preferences): void {
    this.draft.set(preferences);
    this.baseline.set(preferences);
  }
}
