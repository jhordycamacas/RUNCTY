import {
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { IonButton, IonSpinner } from '@ionic/angular';
import { userMessage } from '../../../core/errors/user-message';
import { SystemSettingsStore } from '../../../core/settings/system-settings.store';
import { HasUnsavedChanges } from '../../../shared/forms/unsaved-changes.guard';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog';
import { DateTimeField } from '../../../shared/ui/date-time-field';
import { Notice } from '../../../shared/ui/notice';
import { TextField } from '../../../shared/ui/text-field';
import { ToastService } from '../../../shared/ui/toast.service';
import { RouteDetailStore } from '../application/route-detail.store';
import { minutesOf } from '../domain/form-parsing';
import { TimeSlot } from '../domain/managed-route';
import {
  EMPTY_TIME_SLOT_FORM,
  TimeSlotForm,
  TimeSlotFormField,
  formatValidity,
  parseTimeSlotForm,
  slotName,
  toTimeSlotForm,
} from '../domain/time-slot-form';

/** What the form edits: a new slot or an existing one. */
type Editing = { kind: 'new' } | { kind: 'edit'; slot: TimeSlot };

/**
 * RF-07-1 to RF-07-4: the time slots of the route by start time, and one form at a time to add
 * or edit them. Slots may not overlap; the API recalculates the safety index on every change and
 * the store reloads it. Lives inside the detail page, which provides the `RouteDetailStore`.
 */
@Component({
  selector: 'app-time-slots-section',
  imports: [ReactiveFormsModule, IonButton, IonSpinner, DateTimeField, Notice, TextField],
  template: `
    <section aria-labelledby="slots-title">
      <div class="section-header">
        <h2 id="slots-title">Franjas horarias</h2>
        <ion-button
          fill="outline"
          [disabled]="editing() !== null || full()"
          (click)="startCreate()"
          >Agregar franja</ion-button
        >
      </div>
      @if (full()) {
        <p class="muted">Máximo de {{ maxSlots() }} franjas por ruta alcanzado.</p>
      }

      @if (editing(); as current) {
        <form
          class="slot-form"
          [formGroup]="form"
          (ngSubmit)="submit()"
          novalidate
          aria-labelledby="slot-form-title"
        >
          <h3 id="slot-form-title" #formHeading tabindex="-1">
            {{ current.kind === 'new' ? 'Nueva franja' : 'Editar franja' }}
          </h3>
          <app-text-field
            formControlName="label"
            label="Nombre de la franja (opcional)"
            [maxlength]="40"
            [error]="errorFor('label')"
          />
          <div class="pair">
            <app-date-time-field
              formControlName="startTime"
              type="time"
              label="Hora de inicio"
              [error]="errorFor('startTime')"
            />
            <app-date-time-field
              formControlName="endTime"
              type="time"
              label="Hora de fin"
              hint="00:00 significa medianoche."
              [error]="errorFor('endTime')"
            />
          </div>
          <div class="pair">
            <app-date-time-field
              formControlName="validFrom"
              type="date"
              label="Vigente desde (opcional)"
              [error]="errorFor('validFrom')"
            />
            <app-date-time-field
              formControlName="validTo"
              type="date"
              label="Vigente hasta (opcional)"
              [error]="errorFor('validTo')"
            />
          </div>
          <app-notice [message]="formError()" />
          <div class="buttons">
            <ion-button type="submit" [disabled]="saving()">
              @if (saving()) {
                <ion-spinner name="crescent" aria-label="Guardando" />
              } @else {
                Guardar franja
              }
            </ion-button>
            <ion-button fill="outline" [disabled]="saving()" (click)="cancel()"
              >Cancelar</ion-button
            >
          </div>
        </form>
      }

      @if (slots().length === 0) {
        <p class="muted">Esta ruta aún no tiene franjas horarias.</p>
      } @else {
        <ul class="slots">
          @for (slot of slots(); track slot.id) {
            <li class="slot">
              <div class="summary">
                <h3 class="slot-name">{{ name(slot) }}</h3>
                <p class="meta">{{ validity(slot) }}</p>
              </div>
              <div class="actions">
                <ion-button
                  fill="outline"
                  [disabled]="editing() !== null"
                  [attr.aria-label]="'Editar franja ' + name(slot)"
                  (click)="startEdit(slot)"
                  >Editar</ion-button
                >
                <ion-button
                  fill="clear"
                  color="danger"
                  [attr.aria-label]="'Eliminar franja ' + name(slot)"
                  (click)="remove(slot)"
                  >Eliminar</ion-button
                >
              </div>
            </li>
          }
        </ul>
      }
    </section>
  `,
  styles: `
    :host {
      display: block;
    }

    .section-header {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--rc-space-sm);
      margin-bottom: var(--rc-space-md);
    }

    h2 {
      margin: 0;
      font-size: var(--rc-font-size-subtitle);
    }

    h3 {
      margin: 0;
      font-size: var(--rc-font-size-body);
      font-variant-numeric: tabular-nums;
      overflow-wrap: anywhere;
    }

    .slot-form {
      display: flex;
      flex-direction: column;
      gap: var(--rc-space-md);
      max-width: 48rem;
      margin-bottom: var(--rc-space-lg);
      padding: var(--rc-space-lg);
      border: 1px solid var(--rc-primary-text);
      border-radius: var(--rc-radius-lg);
      background: var(--rc-surface-elevated);
    }

    .pair {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
      gap: var(--rc-space-md);
    }

    .buttons,
    .actions {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      gap: var(--rc-space-sm);
    }

    .slots {
      display: flex;
      flex-direction: column;
      gap: var(--rc-space-sm);
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .slot {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--rc-space-sm) var(--rc-space-md);
      padding: var(--rc-space-md) var(--rc-space-lg);
      border-radius: var(--rc-radius-lg);
      background: var(--rc-surface-elevated);
    }

    .summary {
      display: flex;
      flex: 1 1 14rem;
      flex-direction: column;
      gap: var(--rc-space-xs);
      min-width: 0;
    }

    .meta,
    .muted {
      margin: 0;
      color: var(--rc-text-muted);
      font-size: var(--rc-font-size-label);
    }
  `,
})
export class TimeSlotsSection implements HasUnsavedChanges {
  private readonly store = inject(RouteDetailStore);
  private readonly dialog = inject(ConfirmDialog);
  private readonly toast = inject(ToastService);
  private readonly settings = inject(SystemSettingsStore);
  private readonly injector = inject(Injector);
  private readonly formHeading = viewChild<ElementRef<HTMLElement>>('formHeading');

  protected readonly slots = computed(() =>
    [...(this.store.detail()?.timeSlots ?? [])].sort(
      (a, b) => minutesOf(a.startTime) - minutesOf(b.startTime),
    ),
  );

  protected readonly maxSlots = computed(() => this.settings.settings().maxTimeSlotsPerRoute);
  protected readonly full = computed(() => this.slots().length >= this.maxSlots());

  protected readonly form = inject(FormBuilder).nonNullable.group<TimeSlotForm>({
    ...EMPTY_TIME_SLOT_FORM,
  });
  protected readonly editing = signal<Editing | null>(null);
  private readonly baseline = signal<TimeSlotForm>(EMPTY_TIME_SLOT_FORM);
  private readonly submitted = signal(false);
  protected readonly saving = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected readonly name = slotName;

  protected validity(slot: TimeSlot): string {
    return formatValidity(slot) ?? 'Todos los días';
  }

  /** Errors are read when shown, so they follow the current values. */
  protected errorFor(name: TimeSlotFormField): string | null {
    if (!this.submitted() && !this.form.controls[name].touched) return null;
    return this.parse().errors?.[name] ?? null;
  }

  hasUnsavedChanges(): boolean {
    return (
      this.editing() !== null &&
      JSON.stringify(this.baseline()) !== JSON.stringify(this.form.getRawValue())
    );
  }

  protected startCreate(): void {
    this.open({ kind: 'new' }, EMPTY_TIME_SLOT_FORM);
  }

  protected startEdit(slot: TimeSlot): void {
    this.open({ kind: 'edit', slot }, toTimeSlotForm(slot));
  }

  protected async cancel(): Promise<void> {
    if (this.hasUnsavedChanges()) {
      const discard = await this.dialog.confirm({
        header: 'Cambios sin guardar',
        message: 'Si cierras el formulario perderás los cambios de la franja.',
        confirmText: 'Descartar cambios',
        cancelText: 'Seguir editando',
        destructive: true,
      });
      if (!discard) return;
    }
    this.close();
  }

  protected async submit(): Promise<void> {
    const current = this.editing();
    if (!current || this.saving()) return;
    this.submitted.set(true);
    this.formError.set(null);
    const { input } = this.parse();
    if (!input) return;

    this.saving.set(true);
    try {
      await this.store.saveTimeSlot(current.kind === 'edit' ? current.slot.id : null, input);
      this.close();
      await this.toast.success(current.kind === 'new' ? 'Franja agregada.' : 'Franja actualizada.');
    } catch (error) {
      this.formError.set(userMessage(error));
    } finally {
      this.saving.set(false);
    }
  }

  protected async remove(slot: TimeSlot): Promise<void> {
    const deleted = await this.dialog.confirmAction({
      header: 'Eliminar franja',
      message: `Se eliminará la franja ${slotName(slot)} y su nivel de seguridad. Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      destructive: true,
      run: () => this.store.deleteTimeSlot(slot.id),
    });
    if (!deleted) return;
    const current = this.editing();
    if (current?.kind === 'edit' && current.slot.id === slot.id) this.close();
    await this.toast.success('Franja eliminada.');
  }

  /** The slot being edited is not an overlap of itself. */
  private parse() {
    const current = this.editing();
    const editedId = current?.kind === 'edit' ? current.slot.id : null;
    const others = this.slots().filter((slot) => slot.id !== editedId);
    return parseTimeSlotForm(this.form.getRawValue(), others);
  }

  private open(editing: Editing, values: TimeSlotForm): void {
    this.form.reset(values);
    this.baseline.set(this.form.getRawValue());
    this.submitted.set(false);
    this.formError.set(null);
    this.editing.set(editing);
    // Keyboard and screen reader users land on the form that just opened.
    afterNextRender(() => this.formHeading()?.nativeElement.focus(), { injector: this.injector });
  }

  private close(): void {
    this.editing.set(null);
    this.form.reset(EMPTY_TIME_SLOT_FORM);
    this.baseline.set(this.form.getRawValue());
  }
}
