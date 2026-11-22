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
import { IonButton, IonContent, IonSpinner, IonToggle } from '@ionic/angular';
import { userMessage } from '../../../core/errors/user-message';
import { DIFFICULTY_LABELS, SURFACE_LABELS } from '../../../routes/domain/labels';
import { DIFFICULTIES, SURFACES } from '../../../routes/domain/route';
import { formValues } from '../../../shared/forms/form-values';
import { HasUnsavedChanges } from '../../../shared/forms/unsaved-changes.guard';
import { Notice } from '../../../shared/ui/notice';
import { SelectField } from '../../../shared/ui/select-field';
import { TextField } from '../../../shared/ui/text-field';
import { TextareaField } from '../../../shared/ui/textarea-field';
import { ToastService } from '../../../shared/ui/toast.service';
import { AdminRoutesStore } from '../application/admin-routes.store';
import {
  EMPTY_ROUTE_FORM,
  RouteForm,
  RouteFormField,
  parseRouteForm,
  toRouteForm,
} from '../domain/route-form';
import { AdminHeader } from '../../admin-header';

const LIST_URL = '/admin/rutas';

/** RF-05-1 and RF-05-3: one form creates a route (`/nueva`) or edits it (`/:id/editar`). */
@Component({
  selector: 'app-route-form-page',
  imports: [
    AdminHeader,
    ReactiveFormsModule,
    RouterLink,
    IonButton,
    IonContent,
    IonSpinner,
    IonToggle,
    Notice,
    SelectField,
    TextField,
    TextareaField,
  ],
  template: `
    <app-admin-header [title]="title" backTo="/admin/rutas" />
    <ion-content class="ion-padding">
      @if (!ready()) {
        @if (loadError(); as failure) {
          <div class="state">
            <app-notice [message]="failure" />
            <ion-button fill="outline" (click)="load()">Reintentar</ion-button>
          </div>
        } @else {
          <p class="state muted" role="status"><ion-spinner name="crescent" /> Cargando ruta…</p>
        }
      } @else {
        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <h2 #heading tabindex="-1">{{ title }}</h2>

          <app-text-field
            formControlName="name"
            label="Nombre"
            [maxlength]="80"
            [error]="errorFor('name')"
          />

          <div class="field">
            <app-select-field
              formControlName="cityId"
              label="Ciudad o zona"
              placeholder="Elige la ciudad o zona"
              [options]="placeOptions()"
              [error]="errorFor('cityId')"
            />
            @if (store.placesError(); as failure) {
              <app-notice [message]="'No pudimos cargar las ciudades. ' + failure" />
              <ion-button fill="outline" (click)="store.loadPlaces()">Reintentar</ion-button>
            }
          </div>

          <app-textarea-field
            formControlName="description"
            label="Descripción (opcional)"
            [maxlength]="500"
            [error]="errorFor('description')"
          />

          <fieldset>
            <legend>Punto de inicio</legend>
            <app-text-field
              formControlName="startLabel"
              label="Nombre del punto"
              [maxlength]="80"
              [error]="errorFor('startLabel')"
            />
            <div class="pair">
              <app-text-field
                formControlName="startLat"
                label="Latitud"
                inputmode="decimal"
                placeholder="-3.99313"
                [error]="errorFor('startLat')"
              />
              <app-text-field
                formControlName="startLng"
                label="Longitud"
                inputmode="decimal"
                placeholder="-79.20422"
                [error]="errorFor('startLng')"
              />
            </div>
          </fieldset>

          <fieldset>
            <legend>Punto de llegada</legend>
            <app-text-field
              formControlName="endLabel"
              label="Nombre del punto"
              [maxlength]="80"
              [error]="errorFor('endLabel')"
            />
            <div class="pair">
              <app-text-field
                formControlName="endLat"
                label="Latitud"
                inputmode="decimal"
                placeholder="-3.99313"
                [error]="errorFor('endLat')"
              />
              <app-text-field
                formControlName="endLng"
                label="Longitud"
                inputmode="decimal"
                placeholder="-79.20422"
                [error]="errorFor('endLng')"
              />
            </div>
          </fieldset>

          <div class="pair">
            <app-text-field
              formControlName="distanceKm"
              label="Distancia (km)"
              inputmode="decimal"
              [error]="errorFor('distanceKm')"
            />
            <app-text-field
              formControlName="elevationGainM"
              label="Desnivel (m)"
              inputmode="decimal"
              [error]="errorFor('elevationGainM')"
            />
          </div>

          <div class="pair">
            <app-select-field
              formControlName="surface"
              label="Superficie"
              placeholder="Elige la superficie"
              [options]="surfaces"
              [error]="errorFor('surface')"
            />
            <app-select-field
              formControlName="difficulty"
              label="Dificultad"
              placeholder="Elige la dificultad"
              [options]="difficulties"
              [error]="errorFor('difficulty')"
            />
          </div>

          <ion-toggle formControlName="active" justify="space-between"
            >Ruta activa (visible para los corredores)</ion-toggle
          >

          <app-notice [message]="error()" />

          <div class="buttons">
            <ion-button type="submit" [disabled]="saving()">
              @if (saving()) {
                <ion-spinner name="crescent" aria-label="Guardando" />
              } @else {
                Guardar ruta
              }
            </ion-button>
            <ion-button fill="outline" routerLink="/admin/rutas">Cancelar</ion-button>
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
      display: flex;
      flex-direction: column;
      gap: var(--rc-space-md);
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

    ion-toggle {
      min-height: var(--rc-min-touch-target);
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: var(--rc-space-sm);
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
export class RouteFormPage implements HasUnsavedChanges {
  protected readonly store = inject(AdminRoutesStore);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly injector = inject(Injector);
  private readonly routeId = inject(ActivatedRoute).snapshot.paramMap.get('id');
  private readonly heading = viewChild<ElementRef<HTMLElement>>('heading');

  protected readonly title = this.routeId ? 'Editar ruta' : 'Nueva ruta';
  protected readonly placeOptions = computed(() =>
    (this.store.places() ?? []).map((place) => ({ value: place.id, label: place.name })),
  );
  protected readonly surfaces = SURFACES.map((value) => ({ value, label: SURFACE_LABELS[value] }));
  protected readonly difficulties = DIFFICULTIES.map((value) => ({
    value,
    label: DIFFICULTY_LABELS[value],
  }));

  protected readonly form = inject(FormBuilder).nonNullable.group<RouteForm>({
    ...EMPTY_ROUTE_FORM,
  });
  private readonly values = formValues(this.form);
  private readonly errors = computed(() => parseRouteForm(this.values()).errors ?? {});
  /** What is stored, to tell whether the form holds unsaved changes. */
  private readonly baseline = signal<RouteForm | null>(null);
  private readonly submitted = signal(false);
  protected readonly ready = computed(() => this.baseline() !== null);
  protected readonly loadError = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly errorFor = (name: RouteFormField) =>
    this.submitted() || this.form.controls[name].touched ? (this.errors()[name] ?? null) : null;

  constructor() {
    void this.store.loadPlaces();
    if (this.routeId) void this.load();
    else this.adopt({ ...EMPTY_ROUTE_FORM, cityId: this.store.cityId() ?? '' });
  }

  hasUnsavedChanges(): boolean {
    const baseline = this.baseline();
    return (
      baseline !== null && JSON.stringify(baseline) !== JSON.stringify(this.form.getRawValue())
    );
  }

  protected async load(): Promise<void> {
    if (!this.routeId) return;
    this.loadError.set(null);
    try {
      this.adopt(toRouteForm(await this.store.getRoute(this.routeId)));
    } catch (error) {
      this.loadError.set(userMessage(error));
    }
  }

  protected async submit(): Promise<void> {
    if (this.saving()) return;
    this.submitted.set(true);
    this.error.set(null);
    const { input } = parseRouteForm(this.form.getRawValue());
    if (!input) return;

    this.saving.set(true);
    try {
      await this.store.saveRoute(this.routeId, input);
      this.baseline.set(this.form.getRawValue());
      await this.toast.success(this.routeId ? 'Ruta actualizada.' : 'Ruta creada.');
      await this.router.navigateByUrl(LIST_URL);
    } catch (error) {
      this.error.set(userMessage(error));
    } finally {
      this.saving.set(false);
    }
  }

  private adopt(values: RouteForm): void {
    this.form.reset(values);
    this.baseline.set(this.form.getRawValue());
    this.submitted.set(false);
    // The form replaces the loading state: move the focus to it (keyboard and screen readers).
    afterNextRender(() => this.heading()?.nativeElement.focus(), { injector: this.injector });
  }
}
