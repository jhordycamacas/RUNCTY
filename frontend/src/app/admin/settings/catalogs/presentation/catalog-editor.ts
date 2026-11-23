import { Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonButton, IonIcon, IonSpinner, IonToggle } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowDownOutline, arrowUpOutline, closeOutline } from 'ionicons/icons';
import { CatalogId } from '../../../../core/catalogs/catalog';
import { ApiError } from '../../../../core/errors/api-error';
import { userMessage } from '../../../../core/errors/user-message';
import { Notice } from '../../../../shared/ui/notice';
import { TextField } from '../../../../shared/ui/text-field';
import { ToastService } from '../../../../shared/ui/toast.service';
import { CatalogsStore } from '../application/catalogs.store';
import {
  CatalogErrors,
  CatalogRow,
  hasErrors,
  newRow,
  rowsChanged,
  serverErrors,
  slugifyCode,
  toItems,
  toRows,
  validateRows,
} from '../domain/catalog-editor';

addIcons({ arrowDownOutline, arrowUpOutline, closeOutline });

const NO_ERRORS: CatalogErrors = { rows: {} };

/**
 * The editable list of one catalog: name, code (fixed once saved), position and active switch of
 * each option, one save for the whole list. Nothing is deleted: a stored option is deactivated.
 */
@Component({
  selector: 'app-catalog-editor',
  imports: [FormsModule, IonButton, IonIcon, IonSpinner, IonToggle, Notice, TextField],
  template: `
    <section class="panel" [attr.aria-labelledby]="catalogId() + '-title'">
      <h2 [id]="catalogId() + '-title'">{{ title() }}</h2>
      <p class="description">{{ description() }}</p>
      <p class="description">
        Desactiva una opción para ocultarla; los perfiles que ya la usan la conservan.
      </p>

      <ol class="rows">
        @for (row of rows(); track row.key; let i = $index; let first = $first; let last = $last) {
          <li class="row" [class.inactive]="!row.active">
            <div class="fields">
              <app-text-field
                label="Nombre"
                [ngModel]="row.label"
                (ngModelChange)="setLabel(row.key, $event)"
                [maxlength]="60"
                [error]="rowError(i, 'label')"
              />
              @if (row.existing) {
                <p class="code">
                  <span class="caption">Código</span>
                  <code>{{ row.code }}</code>
                  <small>El código no se puede cambiar</small>
                  @if (rowError(i, 'code'); as problem) {
                    <small class="error" role="alert">{{ problem }}</small>
                  }
                </p>
              } @else {
                <app-text-field
                  label="Código"
                  hint="Se sugiere desde el nombre; puedes cambiarlo."
                  [ngModel]="row.code"
                  (ngModelChange)="setCode(row.key, $event)"
                  [maxlength]="40"
                  [error]="rowError(i, 'code')"
                />
              }
              @if (rowError(i, 'other'); as problem) {
                <p class="error" role="alert">{{ problem }}</p>
              }
            </div>
            <div class="controls">
              <ion-toggle
                [checked]="row.active"
                [attr.aria-label]="'Activa: ' + nameOf(row)"
                (ionChange)="setActive(row.key, $event.detail.checked)"
                >Activa</ion-toggle
              >
              <ion-button
                class="up"
                fill="outline"
                [disabled]="first"
                [attr.aria-label]="'Subir ' + nameOf(row)"
                (click)="move(i, -1)"
              >
                <ion-icon slot="icon-only" name="arrow-up-outline" aria-hidden="true" />
              </ion-button>
              <ion-button
                class="down"
                fill="outline"
                [disabled]="last"
                [attr.aria-label]="'Bajar ' + nameOf(row)"
                (click)="move(i, 1)"
              >
                <ion-icon slot="icon-only" name="arrow-down-outline" aria-hidden="true" />
              </ion-button>
              @if (!row.existing) {
                <ion-button
                  class="remove"
                  fill="outline"
                  color="danger"
                  [attr.aria-label]="'Quitar ' + nameOf(row)"
                  (click)="removeRow(row.key)"
                >
                  <ion-icon slot="icon-only" name="close-outline" aria-hidden="true" />
                </ion-button>
              }
            </div>
          </li>
        }
      </ol>

      @if (listError(); as problem) {
        <p class="error" role="alert">{{ problem }}</p>
      }
      <app-notice [message]="error()" />

      <div class="actions">
        <ion-button fill="outline" [disabled]="saving()" (click)="add()">Agregar opción</ion-button>
        <ion-button [disabled]="!changed() || saving()" (click)="save()">
          @if (saving()) {
            <ion-spinner name="crescent" aria-label="Guardando" />
          } @else {
            Guardar cambios
          }
        </ion-button>
      </div>
    </section>
  `,
  styles: `
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

    .description {
      margin: 0;
      color: var(--rc-text-muted);
      font-size: var(--rc-font-size-label);
    }

    .rows {
      display: flex;
      flex-direction: column;
      gap: var(--rc-space-md);
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .row {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--rc-space-md);
      padding: var(--rc-space-md);
      border: 1px solid var(--rc-border);
      border-radius: var(--rc-radius-md);
      background: var(--rc-surface);
    }

    .row.inactive .fields {
      opacity: 0.7;
    }

    .fields {
      display: grid;
      flex: 1 1 18rem;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr));
      align-items: start;
      gap: var(--rc-space-md);
    }

    .code {
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-height: var(--rc-min-touch-target);
      margin: 0;
    }

    .caption,
    small {
      color: var(--rc-text-muted);
      font-size: var(--rc-font-size-caption);
    }

    .controls {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--rc-space-sm);
    }

    ion-toggle {
      min-height: var(--rc-min-touch-target);
    }

    ion-button {
      min-width: var(--rc-min-touch-target);
      min-height: var(--rc-min-touch-target);
    }

    .error {
      margin: 0;
      color: var(--rc-danger);
      font-size: var(--rc-font-size-caption);
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--rc-space-sm);
    }
  `,
})
export class CatalogEditor {
  readonly catalogId = input.required<CatalogId>();
  readonly title = input.required<string>();
  readonly description = input.required<string>();

  private readonly store = inject(CatalogsStore);
  private readonly toast = inject(ToastService);

  /** Follows the store: a save (or a reload) puts the server's list back on screen. */
  protected readonly rows = linkedSignal<CatalogRow[]>(() =>
    toRows(this.store.items(this.catalogId()) ?? []),
  );
  protected readonly changed = computed(() =>
    rowsChanged(this.store.items(this.catalogId()) ?? [], this.rows()),
  );

  private readonly submitted = signal(false);
  /** What the API rejected; stays until the list is edited again. */
  private readonly rejected = signal<CatalogErrors | null>(null);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  private readonly validation = computed(() =>
    this.submitted() ? validateRows(this.rows()) : NO_ERRORS,
  );
  protected readonly listError = computed(
    () => this.rejected()?.list ?? this.validation().list ?? null,
  );

  hasUnsavedChanges(): boolean {
    return this.changed();
  }

  protected nameOf(row: CatalogRow): string {
    return row.label.trim() || 'la opción nueva';
  }

  protected rowError(index: number, field: 'code' | 'label' | 'other'): string | null {
    const own = field === 'other' ? undefined : this.validation().rows[index]?.[field];
    return this.rejected()?.rows[index]?.[field] ?? own ?? null;
  }

  protected add(): void {
    const key = Math.max(-1, ...this.rows().map((row) => row.key)) + 1;
    this.edit((rows) => [...rows, newRow(key)]);
  }

  protected removeRow(key: number): void {
    this.edit((rows) => rows.filter((row) => row.key !== key));
  }

  protected move(index: number, step: -1 | 1): void {
    this.edit((rows) => {
      const next = [...rows];
      [next[index], next[index + step]] = [next[index + step], next[index]];
      return next;
    });
  }

  protected setLabel(key: number, label: string): void {
    this.update(key, (row) => ({
      ...row,
      label,
      code: row.existing || row.codeEdited ? row.code : slugifyCode(label),
    }));
  }

  protected setCode(key: number, code: string): void {
    this.update(key, (row) => ({ ...row, code, codeEdited: true }));
  }

  protected setActive(key: number, active: boolean): void {
    if (this.rows().find((row) => row.key === key)?.active === active) return;
    this.update(key, (row) => ({ ...row, active }));
  }

  protected async save(): Promise<void> {
    if (this.saving() || !this.changed()) return;
    this.submitted.set(true);
    this.error.set(null);
    this.rejected.set(null);
    if (hasErrors(validateRows(this.rows()))) return;

    this.saving.set(true);
    try {
      await this.store.save(this.catalogId(), toItems(this.rows()));
      this.submitted.set(false);
      await this.toast.success('Opciones guardadas.');
    } catch (error) {
      this.error.set(userMessage(error));
      if (error instanceof ApiError) this.rejected.set(serverErrors(error.fields));
    } finally {
      this.saving.set(false);
    }
  }

  private update(key: number, change: (row: CatalogRow) => CatalogRow): void {
    this.edit((rows) => rows.map((row) => (row.key === key ? change(row) : row)));
  }

  private edit(change: (rows: CatalogRow[]) => CatalogRow[]): void {
    this.rejected.set(null);
    this.error.set(null);
    this.rows.update(change);
  }
}
