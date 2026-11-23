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
import { ApiError } from '../../../core/errors/api-error';
import { userMessage } from '../../../core/errors/user-message';
import { IMAGE_CODEC } from '../../../shared/images/browser-image-codec';
import { ImageFileError } from '../../../shared/images/resize-to-square-jpeg';
import { SystemSettingsStore } from '../../../core/settings/system-settings.store';
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
import { MapLine, MapMarker, MapPoint } from '../../../shared/map/map-renderer';
import { MapView } from '../../../shared/map/map-view';
import { parseDecimal } from '../domain/form-parsing';
import {
  RouteImageChange,
  buildRouteImage,
  routeImageReasonMessage,
} from '../domain/route-image';
import { RouteImageField } from './route-image-field';

const LIST_URL = '/admin/rutas';

/** Where the map opens while the route has no points: Loja (the cities carry no coordinates). */
const MAP_VIEW = { center: { lat: -3.99313, lng: -79.20422 }, zoom: 13 };
const COORDINATE_DECIMALS = 6;

const roundCoordinate = (value: number) => Number(value.toFixed(COORDINATE_DECIMALS));

/** The point the form holds, or null while it is blank or not a valid coordinate. */
function markedPoint(lat: string, lng: string): MapPoint | null {
  const point = { lat: parseDecimal(lat), lng: parseDecimal(lng) };
  const valid =
    point.lat !== null && point.lng !== null && Math.abs(point.lat) <= 90 && Math.abs(point.lng) <= 180;
  return valid ? (point as MapPoint) : null;
}

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
    MapView,
    Notice,
    RouteImageField,
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
            [maxlength]="limits().routeNameMaxLength"
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
            [maxlength]="limits().routeDescriptionMaxLength"
            [error]="errorFor('description')"
          />

          <app-route-image-field
            [image]="shownImage()"
            [busy]="preparingImage()"
            [error]="imageError()"
            (picked)="pickImage($event)"
            (removed)="removeImage()"
          />

          <section class="map-section" aria-labelledby="route-map-title">
            <h3 id="route-map-title">Marca el inicio y el fin en el mapa</h3>
            <p class="hint">
              Elige qué punto marcar y haz clic en el mapa; las coordenadas se toman del clic.
            </p>
            <div class="modes" role="group" aria-label="Punto a marcar">
              <button
                type="button"
                class="mode"
                [attr.aria-pressed]="target() === 'start'"
                (click)="target.set('start')"
              >
                Marcar inicio
              </button>
              <button
                type="button"
                class="mode"
                [attr.aria-pressed]="target() === 'end'"
                (click)="target.set('end')"
              >
                Marcar fin
              </button>
              <button
                type="button"
                class="mode clear"
                [disabled]="startPoint() === null && endPoint() === null"
                (click)="clearPoints()"
              >
                Limpiar puntos
              </button>
            </div>
            <app-map-view
              class="point-map"
              label="Mapa para marcar el inicio y el fin de la ruta"
              [interactive]="true"
              [lines]="mapLines()"
              [markers]="mapMarkers()"
              [view]="mapView"
              (mapClick)="markPoint($event)"
            />
          </section>

          <fieldset>
            <legend>Punto de inicio</legend>
            <app-text-field
              formControlName="startLabel"
              label="Nombre del punto"
              [maxlength]="80"
              [error]="errorFor('startLabel')"
            />
            <p class="coords" [class.set]="startPoint() !== null">
              <span class="swatch start" aria-hidden="true"></span>
              Inicio: {{ coordinates(startPoint()) }}
            </p>
            @if (startError(); as failure) {
              <p class="error" role="alert">{{ failure }}</p>
            }
          </fieldset>

          <fieldset>
            <legend>Punto de llegada</legend>
            <app-text-field
              formControlName="endLabel"
              label="Nombre del punto"
              [maxlength]="80"
              [error]="errorFor('endLabel')"
            />
            <p class="coords" [class.set]="endPoint() !== null">
              <span class="swatch end" aria-hidden="true"></span>
              Fin: {{ coordinates(endPoint()) }}
            </p>
            @if (endError(); as failure) {
              <p class="error" role="alert">{{ failure }}</p>
            }
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
            <app-text-field
              formControlName="surface"
              label="Superficie"
              [maxlength]="40"
              [error]="errorFor('surface')"
            />
            <app-text-field
              formControlName="difficulty"
              label="Dificultad"
              [maxlength]="40"
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

    .map-section {
      display: flex;
      flex-direction: column;
      gap: var(--rc-space-sm);
    }

    .map-section h3 {
      margin: 0;
      font-size: var(--rc-font-size-subtitle);
    }

    .hint {
      margin: 0;
      color: var(--rc-text-muted);
      font-size: var(--rc-font-size-label);
    }

    .modes {
      display: flex;
      flex-wrap: wrap;
      gap: var(--rc-space-xs);
    }

    .mode {
      min-height: var(--rc-min-touch-target);
      padding: 0 var(--rc-space-lg);
      border: 1px solid var(--rc-border);
      border-radius: var(--rc-radius-pill);
      background: var(--rc-surface-elevated);
      color: var(--rc-text);
      font: inherit;
      font-weight: 500;
      cursor: pointer;
    }

    .mode[aria-pressed='true'] {
      border-color: var(--rc-primary);
      background: var(--rc-primary);
      color: var(--rc-on-primary);
    }

    .mode:disabled {
      color: var(--rc-text-muted);
      cursor: default;
    }

    .clear {
      margin-inline-start: auto;
    }

    .point-map {
      height: 20rem;
    }

    .coords {
      display: flex;
      align-items: center;
      gap: var(--rc-space-sm);
      margin: 0;
      color: var(--rc-text-muted);
    }

    .coords.set {
      color: var(--rc-text);
    }

    .swatch {
      width: 0.75rem;
      height: 0.75rem;
      border-radius: 50%;
    }

    .swatch.start {
      background: var(--rc-primary);
    }

    .swatch.end {
      background: var(--rc-text);
    }

    .error {
      margin: 0;
      color: var(--rc-danger);
      font-size: var(--rc-font-size-label);
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
  private readonly settings = inject(SystemSettingsStore);
  private readonly injector = inject(Injector);
  private readonly routeId = inject(ActivatedRoute).snapshot.paramMap.get('id');
  private readonly heading = viewChild<ElementRef<HTMLElement>>('heading');

  protected readonly title = this.routeId ? 'Editar ruta' : 'Nueva ruta';
  protected readonly placeOptions = computed(() =>
    (this.store.places() ?? []).map((place) => ({ value: place.id, label: place.name })),
  );

  protected readonly form = inject(FormBuilder).nonNullable.group<RouteForm>({
    ...EMPTY_ROUTE_FORM,
  });
  private readonly values = formValues(this.form);
  protected readonly limits = this.settings.settings;
  private readonly errors = computed(() => parseRouteForm(this.values(), this.limits()).errors ?? {});
  /** What is stored, to tell whether the form holds unsaved changes. */
  private readonly baseline = signal<RouteForm | null>(null);
  private readonly submitted = signal(false);
  protected readonly ready = computed(() => this.baseline() !== null);
  protected readonly loadError = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  private readonly codec = inject(IMAGE_CODEC);
  /** The id once the route exists, so a retry after a failed image upload updates it. */
  private readonly savedId = signal(this.routeId);
  /** The thumbnail the route has stored. */
  private readonly storedThumb = signal<string | null>(null);
  /** What the admin did to the image; applied after the route is saved. */
  private readonly imageChange = signal<RouteImageChange | null>(null);
  protected readonly preparingImage = signal(false);
  protected readonly imageError = signal<string | null>(null);
  protected readonly shownImage = computed(() => {
    const change = this.imageChange();
    if (change === null) return this.storedThumb();
    return change.kind === 'set' ? change.input.thumbnail : null;
  });

  protected readonly errorFor = (name: RouteFormField) =>
    this.submitted() || this.form.controls[name].touched ? (this.errors()[name] ?? null) : null;

  /** Which point the next click on the map sets. */
  protected readonly target = signal<'start' | 'end'>('start');
  protected readonly mapView = MAP_VIEW;
  protected readonly startPoint = computed(() =>
    markedPoint(this.values().startLat, this.values().startLng),
  );
  protected readonly endPoint = computed(() =>
    markedPoint(this.values().endLat, this.values().endLng),
  );
  protected readonly mapMarkers = computed((): MapMarker[] => {
    const start = this.startPoint();
    const end = this.endPoint();
    return [
      ...(start ? [{ kind: 'start' as const, at: start }] : []),
      ...(end ? [{ kind: 'end' as const, at: end }] : []),
    ];
  });
  protected readonly mapLines = computed((): MapLine[] => {
    const start = this.startPoint();
    const end = this.endPoint();
    return start && end ? [{ tone: 'route', points: [start, end] }] : [];
  });
  protected readonly startError = computed(() => this.pointError('startLat', 'startLng'));
  protected readonly endError = computed(() => this.pointError('endLat', 'endLng'));
  protected readonly coordinates = (point: MapPoint | null) =>
    point ? `${point.lat}, ${point.lng}` : 'sin marcar';

  constructor() {
    void this.store.loadPlaces();
    void this.settings.load();
    if (this.routeId) void this.load();
    else this.adopt({ ...EMPTY_ROUTE_FORM, cityId: this.store.cityId() ?? '' });
  }

  hasUnsavedChanges(): boolean {
    const baseline = this.baseline();
    return (
      baseline !== null &&
      (this.imageChange() !== null ||
        JSON.stringify(baseline) !== JSON.stringify(this.form.getRawValue()))
    );
  }

  /** The click sets the chosen point; after the start the map waits for the end. */
  protected markPoint(point: MapPoint): void {
    const kind = this.target();
    const lat = String(roundCoordinate(point.lat));
    const lng = String(roundCoordinate(point.lng));
    this.form.patchValue(kind === 'start' ? { startLat: lat, startLng: lng } : { endLat: lat, endLng: lng });
    for (const name of kind === 'start' ? (['startLat', 'startLng'] as const) : (['endLat', 'endLng'] as const)) {
      this.form.controls[name].markAsTouched();
    }
    if (kind === 'start') this.target.set('end');
  }

  protected clearPoints(): void {
    this.form.patchValue({ startLat: '', startLng: '', endLat: '', endLng: '' });
    this.target.set('start');
  }

  private pointError(lat: RouteFormField, lng: RouteFormField): string | null {
    return this.errorFor(lat) ?? this.errorFor(lng);
  }

  protected async pickImage(file: File): Promise<void> {
    this.imageError.set(null);
    this.preparingImage.set(true);
    try {
      this.imageChange.set({ kind: 'set', input: await buildRouteImage(file, this.codec) });
    } catch (error) {
      this.imageError.set(error instanceof ImageFileError ? error.message : userMessage(error));
    } finally {
      this.preparingImage.set(false);
    }
  }

  protected removeImage(): void {
    this.imageError.set(null);
    // A route that never had an image has nothing to remove: dropping the pick is enough.
    this.imageChange.set(this.storedThumb() === null ? null : { kind: 'remove' });
  }

  protected async load(): Promise<void> {
    if (!this.routeId) return;
    this.loadError.set(null);
    try {
      const route = await this.store.getRoute(this.routeId);
      this.storedThumb.set(route.imageThumb);
      this.adopt(toRouteForm(route));
    } catch (error) {
      this.loadError.set(userMessage(error));
    }
  }

  protected async submit(): Promise<void> {
    if (this.saving()) return;
    this.submitted.set(true);
    this.error.set(null);
    const { input } = parseRouteForm(this.form.getRawValue(), this.limits());
    if (!input) return;

    this.saving.set(true);
    try {
      this.savedId.set(await this.store.saveRoute(this.savedId(), input));
      if (!(await this.saveImage())) return;
      this.baseline.set(this.form.getRawValue());
      await this.toast.success(this.routeId ? 'Ruta actualizada.' : 'Ruta creada.');
      await this.router.navigateByUrl(LIST_URL);
    } catch (error) {
      this.error.set(userMessage(error));
    } finally {
      this.saving.set(false);
    }
  }

  /**
   * Applies the pending image change to the saved route. Resolves to whether the form is done: when
   * the image fails the route stays saved, the error says so and a retry only repeats the image.
   */
  private async saveImage(): Promise<boolean> {
    const change = this.imageChange();
    const routeId = this.savedId();
    if (change === null || routeId === null) return true;
    try {
      await this.store.applyImage(routeId, change);
    } catch (error) {
      const reason =
        error instanceof ApiError ? (error.fields['image'] ?? error.fields['thumbnail']) : undefined;
      const detail = reason ? routeImageReasonMessage(reason) : userMessage(error);
      this.error.set(`La ruta se guardó, pero la imagen no. ${detail}`);
      return false;
    }
    this.storedThumb.set(change.kind === 'set' ? change.input.thumbnail : null);
    this.imageChange.set(null);
    return true;
  }

  private adopt(values: RouteForm): void {
    this.form.reset(values);
    this.baseline.set(this.form.getRawValue());
    this.submitted.set(false);
    // The form replaces the loading state: move the focus to it (keyboard and screen readers).
    afterNextRender(() => this.heading()?.nativeElement.focus(), { injector: this.injector });
  }
}
