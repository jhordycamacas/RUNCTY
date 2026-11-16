import {
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { IonButton, IonSpinner } from '@ionic/angular';
import { userMessage } from '../../../core/errors/user-message';
import { formatSegmentLength } from '../../../routes/domain/labels';
import { HasUnsavedChanges } from '../../../shared/forms/unsaved-changes.guard';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog';
import { Notice } from '../../../shared/ui/notice';
import { TextField } from '../../../shared/ui/text-field';
import { TextareaField } from '../../../shared/ui/textarea-field';
import { ToastService } from '../../../shared/ui/toast.service';
import { RouteDetailStore } from '../application/route-detail.store';
import { ManagedSegment } from '../domain/managed-route';
import {
  EMPTY_SEGMENT_FORM,
  SegmentForm,
  SegmentFormField,
  parseSegmentForm,
  toSegmentForm,
} from '../domain/segment-form';
import { segmentSlotLevels } from '../domain/slot-safety';
import { RiskFactorsSection } from './risk-factors-section';
import { SlotSafetyList } from './slot-safety-list';

/** What the form edits: a new segment or an existing one. */
type Editing = { kind: 'new' } | { kind: 'edit'; segment: ManagedSegment };

/**
 * RF-05-5 to RF-05-8: the segments of the route in order, each with its level per time slot
 * and its risk factors, and one form at a time to add or edit them. Lives inside the detail page, which provides the
 * `RouteDetailStore`.
 */
@Component({
  selector: 'app-segments-section',
  imports: [
    ReactiveFormsModule,
    IonButton,
    IonSpinner,
    Notice,
    RiskFactorsSection,
    SlotSafetyList,
    TextField,
    TextareaField,
  ],
  template: `
    <section aria-labelledby="segments-title">
      <div class="section-header">
        <h2 id="segments-title">Tramos</h2>
        <ion-button fill="outline" [disabled]="editing() !== null" (click)="startCreate()"
          >Agregar tramo</ion-button
        >
      </div>

      @if (editing(); as current) {
        <form
          class="segment-form"
          [formGroup]="form"
          (ngSubmit)="submit()"
          novalidate
          aria-labelledby="segment-form-title"
        >
          <h3 id="segment-form-title" #formHeading tabindex="-1">
            {{ current.kind === 'new' ? 'Nuevo tramo' : 'Editar tramo' }}
          </h3>
          <app-text-field
            formControlName="name"
            label="Nombre del tramo"
            [maxlength]="80"
            [error]="errorFor('name')"
          />
          <app-text-field
            formControlName="position"
            label="Posición en la ruta (opcional)"
            inputmode="numeric"
            [hint]="
              current.kind === 'new' ? 'Vacío: se agrega al final.' : 'Vacío: conserva su posición.'
            "
            [error]="errorFor('position')"
          />
          <app-textarea-field
            formControlName="coordinates"
            label="Puntos del tramo"
            placeholder="-3.99313, -79.20422"
            hint="Un punto por línea: latitud, longitud. Mínimo 2 puntos."
            [rows]="6"
            [error]="errorFor('coordinates')"
          />
          <app-notice [message]="formError()" />
          <div class="buttons">
            <ion-button type="submit" [disabled]="saving()">
              @if (saving()) {
                <ion-spinner name="crescent" aria-label="Guardando" />
              } @else {
                Guardar tramo
              }
            </ion-button>
            <ion-button fill="outline" [disabled]="saving()" (click)="cancel()"
              >Cancelar</ion-button
            >
          </div>
        </form>
      }

      @if (segments().length === 0) {
        <p class="muted">Esta ruta aún no tiene tramos.</p>
      } @else {
        <ol class="segments">
          @for (segment of segments(); track segment.id) {
            <li class="segment">
              <div class="summary">
                <h3 class="segment-name">{{ segment.order + 1 }}. {{ segment.name }}</h3>
                <p class="meta">{{ length(segment) }} · {{ segment.coordinates.length }} puntos</p>
                <app-slot-safety-list
                  [levels]="levels(segment)"
                  [label]="'Nivel de seguridad de ' + segment.name + ' por franja horaria'"
                />
              </div>
              <div class="actions">
                <ion-button
                  fill="outline"
                  [disabled]="editing() !== null"
                  [attr.aria-label]="'Editar ' + segment.name"
                  (click)="startEdit(segment)"
                  >Editar</ion-button
                >
                <ion-button
                  fill="clear"
                  color="danger"
                  [attr.aria-label]="'Eliminar ' + segment.name"
                  (click)="remove(segment)"
                  >Eliminar</ion-button
                >
              </div>
              <app-risk-factors class="risk-factors" [segment]="segment" />
            </li>
          }
        </ol>
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
      overflow-wrap: anywhere;
    }

    .segment-form {
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

    .buttons,
    .actions {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      gap: var(--rc-space-sm);
    }

    .segments {
      display: flex;
      flex-direction: column;
      gap: var(--rc-space-md);
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .segment {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: var(--rc-space-md);
      padding: var(--rc-space-lg);
      border: 1px solid var(--rc-border);
      border-radius: var(--rc-radius-lg);
      background: var(--rc-surface-elevated);
    }

    .summary {
      display: flex;
      flex: 1 1 18rem;
      flex-direction: column;
      gap: var(--rc-space-sm);
      min-width: 0;
    }

    .risk-factors {
      flex: 1 1 100%;
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
export class SegmentsSection implements HasUnsavedChanges {
  private readonly store = inject(RouteDetailStore);
  private readonly dialog = inject(ConfirmDialog);
  private readonly toast = inject(ToastService);
  private readonly injector = inject(Injector);
  private readonly formHeading = viewChild<ElementRef<HTMLElement>>('formHeading');
  private readonly riskFactors = viewChildren(RiskFactorsSection);

  protected readonly segments = computed(() => this.store.detail()?.segments ?? []);
  private readonly timeSlots = computed(() => this.store.detail()?.timeSlots ?? []);

  protected readonly form = inject(FormBuilder).nonNullable.group<SegmentForm>({
    ...EMPTY_SEGMENT_FORM,
  });
  protected readonly editing = signal<Editing | null>(null);
  private readonly baseline = signal<SegmentForm>(EMPTY_SEGMENT_FORM);
  private readonly submitted = signal(false);
  protected readonly saving = signal(false);
  protected readonly formError = signal<string | null>(null);

  /** Errors are read when shown, so they follow the current values. */
  protected errorFor(name: SegmentFormField): string | null {
    if (!this.submitted() && !this.form.controls[name].touched) return null;
    return parseSegmentForm(this.form.getRawValue()).errors?.[name] ?? null;
  }

  /** The segment draft or a risk factor draft of any segment. */
  hasUnsavedChanges(): boolean {
    const segmentDraft =
      this.editing() !== null &&
      JSON.stringify(this.baseline()) !== JSON.stringify(this.form.getRawValue());
    return segmentDraft || this.riskFactors().some((factors) => factors.hasUnsavedChanges());
  }

  protected length(segment: ManagedSegment): string {
    return formatSegmentLength(segment.lengthM, 'metric');
  }

  protected levels(segment: ManagedSegment) {
    return segmentSlotLevels(segment, this.timeSlots());
  }

  protected startCreate(): void {
    this.open({ kind: 'new' }, EMPTY_SEGMENT_FORM);
  }

  protected startEdit(segment: ManagedSegment): void {
    this.open({ kind: 'edit', segment }, toSegmentForm(segment));
  }

  protected async cancel(): Promise<void> {
    if (this.hasUnsavedChanges()) {
      const discard = await this.dialog.confirm({
        header: 'Cambios sin guardar',
        message: 'Si cierras el formulario perderás los cambios del tramo.',
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
    const { input } = parseSegmentForm(this.form.getRawValue());
    if (!input) return;

    this.saving.set(true);
    try {
      await this.store.saveSegment(current.kind === 'edit' ? current.segment.id : null, input);
      this.close();
      await this.toast.success(current.kind === 'new' ? 'Tramo agregado.' : 'Tramo actualizado.');
    } catch (error) {
      this.formError.set(userMessage(error));
    } finally {
      this.saving.set(false);
    }
  }

  protected async remove(segment: ManagedSegment): Promise<void> {
    const deleted = await this.dialog.confirmAction({
      header: 'Eliminar tramo',
      message: `Se eliminará "${segment.name}" con sus factores de riesgo y se recalculará la seguridad de la ruta. Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      destructive: true,
      run: () => this.store.deleteSegment(segment.id),
    });
    if (!deleted) return;
    const current = this.editing();
    if (current?.kind === 'edit' && current.segment.id === segment.id) this.close();
    await this.toast.success('Tramo eliminado.');
  }

  private open(editing: Editing, values: SegmentForm): void {
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
    this.form.reset(EMPTY_SEGMENT_FORM);
    this.baseline.set(this.form.getRawValue());
  }
}
