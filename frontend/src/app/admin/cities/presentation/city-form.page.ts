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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonButton, IonContent, IonSpinner } from '@ionic/angular';
import { userMessage } from '../../../core/errors/user-message';
import { formValues } from '../../../shared/forms/form-values';
import { HasUnsavedChanges } from '../../../shared/forms/unsaved-changes.guard';
import { Notice } from '../../../shared/ui/notice';
import { SelectField, SelectOption } from '../../../shared/ui/select-field';
import { TextField } from '../../../shared/ui/text-field';
import { ToastService } from '../../../shared/ui/toast.service';
import { AdminCitiesStore } from '../application/admin-cities.store';
import {
  CityForm,
  CityFormField,
  EMPTY_CITY_FORM,
  parseCityForm,
  toCityForm,
} from '../domain/city-form';
import { CITY_TYPES, CITY_TYPE_LABELS, COVERAGES, COVERAGE_LABELS } from '../domain/managed-city';
import { AdminHeader } from '../../admin-header';

const LIST_URL = '/admin/ciudades';

/**
 * RF-04-1 and RF-04-3: one form creates a city or zone (`/nueva`, optionally `?ciudad=` to start
 * a zone of that city) or edits it (`/:id/editar`).
 */
@Component({
  selector: 'app-city-form-page',
  imports: [
    AdminHeader,
    ReactiveFormsModule,
    RouterLink,
    IonButton,
    IonContent,
    IonSpinner,
    Notice,
    SelectField,
    TextField,
  ],
  template: `
    <app-admin-header [title]="title()" backTo="/admin/ciudades" />
    <ion-content class="ion-padding">
      @if (!ready()) {
        @if (loadError(); as failure) {
          <div class="state">
            <app-notice [message]="failure" />
            <ion-button fill="outline" (click)="load()">Reintentar</ion-button>
          </div>
        } @else {
          <p class="state muted" role="status"><ion-spinner name="crescent" /> Cargando…</p>
        }
      } @else {
        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <h2 #heading tabindex="-1">{{ title() }}</h2>

          <app-select-field
            formControlName="type"
            label="Tipo"
            placeholder="Elige el tipo"
            [options]="types"
            [error]="errorFor('type')"
          />
          @if (isZone()) {
            <app-select-field
              formControlName="parentCityId"
              label="Ciudad a la que pertenece"
              placeholder="Elige la ciudad"
              [options]="parentOptions()"
              [error]="errorFor('parentCityId')"
            />
          }
          <app-text-field
            formControlName="id"
            label="Identificador"
            hint="Minúsculas, números y guion, por ejemplo loja-centro. No se puede cambiar después."
            [maxlength]="64"
            [error]="errorFor('id')"
          />
          <app-text-field
            formControlName="name"
            label="Nombre"
            [maxlength]="80"
            [error]="errorFor('name')"
          />
          <app-text-field
            formControlName="province"
            label="Provincia"
            [maxlength]="80"
            [error]="errorFor('province')"
          />

          <fieldset>
            <legend>Ubicación</legend>
            <div class="pair">
              <app-text-field
                formControlName="lat"
                label="Latitud"
                inputmode="decimal"
                placeholder="-3.99313"
                [error]="errorFor('lat')"
              />
              <app-text-field
                formControlName="lng"
                label="Longitud"
                inputmode="decimal"
                placeholder="-79.20422"
                [error]="errorFor('lng')"
              />
            </div>
          </fieldset>

          <app-select-field
            formControlName="coverage"
            label="Cobertura"
            placeholder="Elige la cobertura"
            [options]="coverages"
            [error]="errorFor('coverage')"
          />

          <app-notice [message]="error()" />

          <div class="buttons">
            <ion-button type="submit" [disabled]="saving()">
              @if (saving()) {
                <ion-spinner name="crescent" aria-label="Guardando" />
              } @else {
                Guardar
              }
            </ion-button>
            <ion-button fill="outline" routerLink="/admin/ciudades">Cancelar</ion-button>
          </div>
        </form>
      }
    </ion-content>
  `,
  styles: `
    form {
      display: flex;
      flex-direction: column;
      gap: var(--rc-space-lg);
      max-width: 48rem;
    }

    h2 {
      margin: 0;
      font-size: var(--rc-font-size-subtitle);
    }

    fieldset {
      min-width: 0;
      margin: 0;
      padding: var(--rc-space-md);
      border: 1px solid var(--rc-border);
      border-radius: var(--rc-radius-md);
    }

    legend {
      padding: 0 var(--rc-space-xs);
      font-weight: 600;
    }

    .pair {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr));
      gap: var(--rc-space-md);
    }

    .buttons {
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
export class CityFormPage implements HasUnsavedChanges {
  private readonly store = inject(AdminCitiesStore);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly injector = inject(Injector);
  private readonly snapshot = inject(ActivatedRoute).snapshot;
  private readonly cityId = this.snapshot.paramMap.get('id');
  private readonly heading = viewChild<ElementRef<HTMLElement>>('heading');

  protected readonly types: SelectOption[] = CITY_TYPES.map((value) => ({
    value,
    label: CITY_TYPE_LABELS[value],
  }));
  protected readonly coverages: SelectOption[] = COVERAGES.map((value) => ({
    value,
    label: COVERAGE_LABELS[value],
  }));
  protected readonly parentOptions = computed<SelectOption[]>(() =>
    this.store.parentOptions().map((parent) => ({ value: parent.id, label: parent.name })),
  );

  protected readonly form = inject(FormBuilder).nonNullable.group<CityForm>({
    ...EMPTY_CITY_FORM,
  });
  private readonly values = formValues(this.form);
  private readonly errors = computed(
    () => parseCityForm(this.values(), this.cityId !== null).errors ?? {},
  );
  protected readonly isZone = computed(() => this.values().type === 'zone');
  protected readonly title = computed(() => {
    if (!this.cityId) return 'Nueva ciudad o zona';
    return this.isZone() ? 'Editar zona' : 'Editar ciudad';
  });
  /** What is stored, to tell whether the form holds unsaved changes. */
  private readonly baseline = signal<CityForm | null>(null);
  private readonly submitted = signal(false);
  protected readonly ready = computed(() => this.baseline() !== null);
  protected readonly loadError = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly errorFor = (name: CityFormField) =>
    this.submitted() || this.form.controls[name].touched ? (this.errors()[name] ?? null) : null;

  constructor() {
    if (this.cityId) {
      void this.load();
      return;
    }
    void this.store.load();
    const parent = this.snapshot.queryParamMap.get('ciudad');
    this.adopt(parent ? { ...EMPTY_CITY_FORM, type: 'zone', parentCityId: parent } : EMPTY_CITY_FORM);
  }

  hasUnsavedChanges(): boolean {
    const baseline = this.baseline();
    return (
      baseline !== null && JSON.stringify(baseline) !== JSON.stringify(this.form.getRawValue())
    );
  }

  protected async load(): Promise<void> {
    if (!this.cityId) return;
    this.loadError.set(null);
    try {
      const found = await this.store.find(this.cityId);
      if (found) this.adopt(toCityForm(found));
      else this.loadError.set('La ciudad o zona ya no existe.');
    } catch (error) {
      this.loadError.set(userMessage(error));
    }
  }

  protected async submit(): Promise<void> {
    if (this.saving()) return;
    this.submitted.set(true);
    this.error.set(null);
    const { input } = parseCityForm(this.form.getRawValue(), this.cityId !== null);
    if (!input) return;

    this.saving.set(true);
    try {
      await this.store.save(this.cityId, input);
      this.baseline.set(this.form.getRawValue());
      await this.toast.success(this.savedMessage(input.type === 'zone'));
      await this.router.navigateByUrl(LIST_URL);
    } catch (error) {
      this.error.set(userMessage(error));
    } finally {
      this.saving.set(false);
    }
  }

  private savedMessage(zone: boolean): string {
    const noun = zone ? 'Zona' : 'Ciudad';
    return `${noun} ${this.cityId ? 'actualizada' : 'creada'}.`;
  }

  private adopt(values: CityForm): void {
    this.form.reset(values);
    if (this.cityId) {
      this.form.controls.id.disable();
      this.form.controls.type.disable();
    }
    this.baseline.set(this.form.getRawValue());
    this.submitted.set(false);
    // The form replaces the loading state: move the focus to it (keyboard and screen readers).
    afterNextRender(() => this.heading()?.nativeElement.focus(), { injector: this.injector });
  }
}
