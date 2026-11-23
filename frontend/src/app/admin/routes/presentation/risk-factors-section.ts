import {
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { IonButton, IonSpinner } from '@ionic/angular';
import { userMessage } from '../../../core/errors/user-message';
import { SEVERITY_LABELS } from '../../../routes/domain/labels';
import { SEVERITIES } from '../../../routes/domain/route';
import { HasUnsavedChanges } from '../../../shared/forms/unsaved-changes.guard';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog';
import { DateTimeField } from '../../../shared/ui/date-time-field';
import { Notice } from '../../../shared/ui/notice';
import { SelectField, SelectOption } from '../../../shared/ui/select-field';
import { TextareaField } from '../../../shared/ui/textarea-field';
import { TextField } from '../../../shared/ui/text-field';
import { ToastService } from '../../../shared/ui/toast.service';
import { RouteDetailStore } from '../application/route-detail.store';
import { ManagedSegment, RiskFactor } from '../domain/managed-route';
import {
  EMPTY_RISK_FACTOR_FORM,
  RiskFactorForm,
  RiskFactorFormField,
  parseRiskFactorForm,
  toRiskFactorForm,
} from '../domain/risk-factor-form';
import { formatWindow } from '../domain/time-slot-form';

/** What the form edits: a new factor or an existing one. */
type Editing = { kind: 'new' } | { kind: 'edit'; factor: RiskFactor };

const SEVERITY_OPTIONS: readonly SelectOption[] = SEVERITIES.map((severity) => ({
  value: severity,
  label: SEVERITY_LABELS[severity],
}));

let nextId = 0;

/**
 * RF-07-5 to RF-07-8: the risk factors of one segment (type, severity and an optional daily
 * window) and one form at a time to add or edit them. Lives inside each segment of
 * `app-segments-section`; the `RouteDetailStore` reloads the recalculated index after a change.
 */
@Component({
  selector: 'app-risk-factors',
  imports: [
    ReactiveFormsModule,
    IonButton,
    IonSpinner,
    DateTimeField,
    Notice,
    SelectField,
    TextareaField,
    TextField,
  ],
  template: `
    <div class="header">
      <h4 [id]="id + '-title'">Factores de riesgo</h4>
      <ion-button
        fill="outline"
        [disabled]="editing() !== null"
        [attr.aria-label]="'Agregar factor de riesgo a ' + segment().name"
        (click)="startCreate()"
        >Agregar factor</ion-button
      >
    </div>

    @if (editing(); as current) {
      <form
        class="factor-form"
        [formGroup]="form"
        (ngSubmit)="submit()"
        novalidate
        [attr.aria-labelledby]="id + '-form-title'"
      >
        <h5 [id]="id + '-form-title'" #formHeading tabindex="-1">
          {{ current.kind === 'new' ? 'Nuevo factor de riesgo' : 'Editar factor de riesgo' }}
        </h5>
        <div class="pair">
          <app-text-field
            formControlName="type"
            label="Tipo"
            placeholder="Iluminación deficiente"
            [maxlength]="40"
            [error]="errorFor('type')"
          />
          <app-select-field
            formControlName="severity"
            label="Severidad"
            placeholder="Elige la severidad"
            [options]="severityOptions"
            [error]="errorFor('severity')"
          />
        </div>
        <app-textarea-field
          formControlName="description"
          label="Descripción"
          [maxlength]="200"
          [error]="errorFor('description')"
        />
        <div class="pair">
          <app-date-time-field
            formControlName="startTime"
            type="time"
            label="Desde (opcional)"
            hint="Sin horas aplica todo el día."
            [error]="errorFor('startTime')"
          />
          <app-date-time-field
            formControlName="endTime"
            type="time"
            label="Hasta (opcional)"
            hint="00:00 significa medianoche."
            [error]="errorFor('endTime')"
          />
        </div>
        <app-notice [message]="formError()" />
        <div class="buttons">
          <ion-button type="submit" [disabled]="saving()">
            @if (saving()) {
              <ion-spinner name="crescent" aria-label="Guardando" />
            } @else {
              Guardar factor
            }
          </ion-button>
          <ion-button fill="outline" [disabled]="saving()" (click)="cancel()">Cancelar</ion-button>
        </div>
      </form>
    }

    @if (segment().riskFactors.length === 0) {
      <p class="muted">Sin factores de riesgo registrados.</p>
    } @else {
      <ul class="factors" [attr.aria-labelledby]="id + '-title'">
        @for (factor of segment().riskFactors; track factor.id) {
          <li class="factor">
            <div class="summary">
              <p class="title">
                <span class="type">{{ factor.type }}</span>
                <span class="severity" [class]="factor.severity"
                  >Severidad {{ severityLabel(factor) }}</span
                >
                <span class="window">{{ window(factor) }}</span>
              </p>
              <p class="description">{{ factor.description }}</p>
            </div>
            <div class="actions">
              <ion-button
                fill="outline"
                [disabled]="editing() !== null"
                [attr.aria-label]="'Editar factor ' + factor.type"
                (click)="startEdit(factor)"
                >Editar</ion-button
              >
              <ion-button
                fill="clear"
                color="danger"
                [attr.aria-label]="'Eliminar factor ' + factor.type"
                (click)="remove(factor)"
                >Eliminar</ion-button
              >
            </div>
          </li>
        }
      </ul>
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--rc-space-sm);
    }

    .header {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--rc-space-sm);
    }

    h4,
    h5 {
      margin: 0;
      font-size: var(--rc-font-size-label);
    }

    .factor-form {
      display: flex;
      flex-direction: column;
      gap: var(--rc-space-md);
      padding: var(--rc-space-md);
      border: 1px solid var(--rc-primary-text);
      border-radius: var(--rc-radius-lg);
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
      align-items: center;
      gap: var(--rc-space-xs);
    }

    .factors {
      display: flex;
      flex-direction: column;
      gap: var(--rc-space-sm);
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .factor {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--rc-space-xs) var(--rc-space-md);
      padding-top: var(--rc-space-sm);
      border-top: 1px solid var(--rc-border);
    }

    .summary {
      flex: 1 1 14rem;
      min-width: 0;
    }

    .title {
      display: flex;
      flex-wrap: wrap;
      gap: var(--rc-space-xs) var(--rc-space-md);
      margin: 0;
      font-size: var(--rc-font-size-label);
    }

    .type,
    .severity {
      font-weight: 600;
    }

    .severity.high {
      color: var(--rc-danger);
    }

    .window {
      color: var(--rc-text-muted);
      font-variant-numeric: tabular-nums;
    }

    .description,
    .muted {
      margin: 0;
      overflow-wrap: anywhere;
      font-size: var(--rc-font-size-label);
    }

    .muted {
      color: var(--rc-text-muted);
    }
  `,
})
export class RiskFactorsSection implements HasUnsavedChanges {
  private readonly store = inject(RouteDetailStore);
  private readonly dialog = inject(ConfirmDialog);
  private readonly toast = inject(ToastService);
  private readonly injector = inject(Injector);
  private readonly formHeading = viewChild<ElementRef<HTMLElement>>('formHeading');

  readonly segment = input.required<ManagedSegment>();

  protected readonly id = `risk-factors-${nextId++}`;
  protected readonly severityOptions = SEVERITY_OPTIONS;
  protected readonly form = inject(FormBuilder).nonNullable.group<RiskFactorForm>({
    ...EMPTY_RISK_FACTOR_FORM,
  });
  protected readonly editing = signal<Editing | null>(null);
  private readonly baseline = signal<RiskFactorForm>(EMPTY_RISK_FACTOR_FORM);
  private readonly submitted = signal(false);
  protected readonly saving = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected severityLabel(factor: RiskFactor): string {
    return SEVERITY_LABELS[factor.severity];
  }

  protected window(factor: RiskFactor): string {
    return formatWindow(factor.startTime, factor.endTime);
  }

  /** Errors are read when shown, so they follow the current values. */
  protected errorFor(name: RiskFactorFormField): string | null {
    if (!this.submitted() && !this.form.controls[name].touched) return null;
    return parseRiskFactorForm(this.form.getRawValue()).errors?.[name] ?? null;
  }

  hasUnsavedChanges(): boolean {
    return (
      this.editing() !== null &&
      JSON.stringify(this.baseline()) !== JSON.stringify(this.form.getRawValue())
    );
  }

  protected startCreate(): void {
    this.open({ kind: 'new' }, EMPTY_RISK_FACTOR_FORM);
  }

  protected startEdit(factor: RiskFactor): void {
    this.open({ kind: 'edit', factor }, toRiskFactorForm(factor));
  }

  protected async cancel(): Promise<void> {
    if (this.hasUnsavedChanges()) {
      const discard = await this.dialog.confirm({
        header: 'Cambios sin guardar',
        message: 'Si cierras el formulario perderás los cambios del factor de riesgo.',
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
    const { input } = parseRiskFactorForm(this.form.getRawValue());
    if (!input) return;

    this.saving.set(true);
    try {
      await this.store.saveRiskFactor(
        this.segment().id,
        current.kind === 'edit' ? current.factor.id : null,
        input,
      );
      this.close();
      await this.toast.success(
        current.kind === 'new' ? 'Factor de riesgo agregado.' : 'Factor de riesgo actualizado.',
      );
    } catch (error) {
      this.formError.set(userMessage(error));
    } finally {
      this.saving.set(false);
    }
  }

  protected async remove(factor: RiskFactor): Promise<void> {
    const deleted = await this.dialog.confirmAction({
      header: 'Eliminar factor de riesgo',
      message: `Se eliminará "${factor.type}" de ${this.segment().name} y se recalculará la seguridad de la ruta. Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      destructive: true,
      run: () => this.store.deleteRiskFactor(this.segment().id, factor.id),
    });
    if (!deleted) return;
    const current = this.editing();
    if (current?.kind === 'edit' && current.factor.id === factor.id) this.close();
    await this.toast.success('Factor de riesgo eliminado.');
  }

  private open(editing: Editing, values: RiskFactorForm): void {
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
    this.form.reset(EMPTY_RISK_FACTOR_FORM);
    this.baseline.set(this.form.getRawValue());
  }
}
