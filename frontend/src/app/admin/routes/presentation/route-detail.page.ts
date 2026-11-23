import {
  Component,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IonButton, IonContent, IonSpinner, ViewWillEnter } from '@ionic/angular';
import { SystemSettingsStore } from '../../../core/settings/system-settings.store';
import { formatDistance } from '../../../preferences/domain/units';
import { routeMapScene } from '../../../routes/presentation/route-map';
import { MapView } from '../../../shared/map/map-view';
import { HasUnsavedChanges } from '../../../shared/forms/unsaved-changes.guard';
import { Notice } from '../../../shared/ui/notice';
import { RouteDetailStore } from '../application/route-detail.store';
import { routeSlotLevels } from '../domain/slot-safety';
import { SafetySummarySection } from './safety-summary-section';
import { SegmentsSection } from './segments-section';
import { SlotSafetyList } from './slot-safety-list';
import { TimeSlotsSection } from './time-slots-section';
import { AdminHeader } from '../../admin-header';

/** The parts of the detail, one tab each; `?seccion=` opens the page on one of them. */
const DETAIL_TABS = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'franjas', label: 'Franjas horarias' },
  { id: 'tramos', label: 'Tramos y factores' },
] as const;

type DetailTab = (typeof DETAIL_TABS)[number]['id'];

const isDetailTab = (value: string | null): value is DetailTab =>
  DETAIL_TABS.some((tab) => tab.id === value);

/**
 * The admin detail of one route (`/admin/rutas/:id`): its header always visible and the parts of
 * the aggregate in tabs (summary, time slots, segments with their risk factors), each reading the
 * page's `RouteDetailStore`. Hidden tabs stay mounted, so a draft survives a tab switch and a
 * section holding one is added to `hasUnsavedChanges`.
 */
@Component({
  selector: 'app-route-detail-admin-page',
  imports: [
    AdminHeader,
    RouterLink,
    IonButton,
    IonContent,
    IonSpinner,
    MapView,
    Notice,
    SafetySummarySection,
    SegmentsSection,
    SlotSafetyList,
    TimeSlotsSection,
  ],
  providers: [RouteDetailStore],
  template: `
    <app-admin-header [title]="title()" backTo="/admin/rutas" />
    <ion-content class="ion-padding">
      @if (store.detail(); as detail) {
        @if (store.error(); as failure) {
          <div class="state">
            <app-notice [message]="failure" />
            <ion-button fill="outline" (click)="store.reload()">Reintentar</ion-button>
          </div>
        }

        <section class="summary" aria-labelledby="summary-title">
          <div class="section-header">
            <h2 id="summary-title">{{ detail.route.name }}</h2>
            <ion-button fill="outline" [routerLink]="['/admin/rutas', detail.route.id, 'editar']"
              >Editar ruta</ion-button
            >
          </div>
          <p class="meta">
            <span>{{ meta() }}</span>
            <span class="status" [class.inactive]="!detail.route.active">{{
              detail.route.active ? 'Activa' : 'Inactiva'
            }}</span>
          </p>
          @if (detail.route.description) {
            <p class="description">{{ detail.route.description }}</p>
          }
        </section>

        @if (routeMap(); as scene) {
          <app-map-view
            class="route-map"
            label="Mapa de la ruta"
            [lines]="scene.lines"
            [markers]="scene.markers"
          />
        } @else {
          <p class="no-map muted">Esta ruta aún no tiene puntos para mostrar en el mapa.</p>
        }

        <div class="tabs" role="tablist" aria-label="Partes de la ruta">
          @for (tab of tabs; track tab.id) {
            <button
              #tabButton
              type="button"
              role="tab"
              class="tab"
              [id]="'route-tab-' + tab.id"
              [attr.aria-selected]="tab.id === activeTab()"
              [attr.aria-controls]="'route-panel-' + tab.id"
              [tabIndex]="tab.id === activeTab() ? 0 : -1"
              (click)="activeTab.set(tab.id)"
              (keydown)="moveFocus($event)"
            >
              {{ tab.label }}
              @if (tab.id === 'tramos') {
                <span class="count">{{ detail.segments.length }}</span>
              }
            </button>
          }
        </div>

        <div
          role="tabpanel"
          id="route-panel-resumen"
          aria-labelledby="route-tab-resumen"
          [hidden]="activeTab() !== 'resumen'"
        >
          <section class="levels" aria-labelledby="levels-title">
            <h2 id="levels-title">Nivel por franja horaria</h2>
            <app-slot-safety-list
              [levels]="routeLevels()"
              label="Nivel de seguridad de la ruta por franja horaria"
            />
          </section>
          <app-safety-summary-section />
        </div>
        <div
          role="tabpanel"
          id="route-panel-franjas"
          aria-labelledby="route-tab-franjas"
          [hidden]="activeTab() !== 'franjas'"
        >
          <app-time-slots-section />
        </div>
        <div
          role="tabpanel"
          id="route-panel-tramos"
          aria-labelledby="route-tab-tramos"
          [hidden]="activeTab() !== 'tramos'"
        >
          <app-segments-section />
        </div>
      } @else if (store.error(); as failure) {
        <div class="state">
          <app-notice [message]="failure" />
          <ion-button fill="outline" (click)="store.reload()">Reintentar</ion-button>
        </div>
      } @else {
        <p class="state muted" role="status"><ion-spinner name="crescent" /> Cargando ruta…</p>
      }
    </ion-content>
  `,
  styles: `
    .summary,
    .levels {
      display: flex;
      flex-direction: column;
      gap: var(--rc-space-sm);
      margin-bottom: var(--rc-space-lg);
      padding: var(--rc-space-xl);
      border-radius: var(--rc-radius-lg);
      background: var(--rc-surface-elevated);
    }

    .section-header {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--rc-space-sm);
    }

    h2 {
      margin: 0;
      font-size: var(--rc-font-size-title);
      font-weight: 500;
      overflow-wrap: anywhere;
    }

    .levels h2 {
      font-size: var(--rc-font-size-subtitle);
    }

    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: var(--rc-space-xs) var(--rc-space-md);
      margin: 0;
      color: var(--rc-text-muted);
      font-size: var(--rc-font-size-label);
    }

    .status {
      font-weight: 600;
      color: var(--rc-success);
    }

    .status.inactive {
      color: var(--rc-text-muted);
    }

    .description {
      margin: 0;
      overflow-wrap: anywhere;
    }

    // A segmented control: a white track with the active tab as a dark pill.
    .tabs {
      display: flex;
      flex-wrap: wrap;
      gap: var(--rc-space-xs);
      width: fit-content;
      max-width: 100%;
      margin-bottom: var(--rc-space-lg);
      padding: var(--rc-space-xs);
      border-radius: var(--rc-radius-lg);
      background: var(--rc-surface-elevated);
    }

    .tab {
      display: inline-flex;
      align-items: center;
      gap: var(--rc-space-sm);
      min-height: var(--rc-min-touch-target);
      padding: 0 var(--rc-space-lg);
      border: 0;
      border-radius: var(--rc-radius-pill);
      background: transparent;
      color: var(--rc-text);
      font: inherit;
      font-weight: 500;
      cursor: pointer;
    }

    .tab:hover {
      background: var(--rc-surface);
    }

    .tab[aria-selected='true'] {
      background: var(--rc-text);
      color: var(--rc-surface-elevated);
    }

    .count {
      min-width: 1.5rem;
      padding: 0 var(--rc-space-xs);
      border-radius: var(--rc-radius-pill);
      background: var(--rc-surface);
      color: var(--rc-text);
      font-size: var(--rc-font-size-caption);
      font-weight: 600;
      text-align: center;
    }

    .route-map {
      height: 18rem;
      margin-bottom: var(--rc-space-lg);
    }

    .no-map {
      margin: 0 0 var(--rc-space-lg);
    }

    app-safety-summary-section,
    app-time-slots-section,
    app-segments-section {
      display: block;
      margin-bottom: var(--rc-space-xl);
    }

    .state {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--rc-space-sm);
      margin: 0 0 var(--rc-space-lg);
    }

    .muted {
      color: var(--rc-text-muted);
    }
  `,
})
export class RouteDetailPage implements ViewWillEnter, HasUnsavedChanges {
  protected readonly store = inject(RouteDetailStore);
  private readonly settings = inject(SystemSettingsStore);
  private readonly snapshot = inject(ActivatedRoute).snapshot;
  private readonly routeId = this.snapshot.paramMap.get('id') ?? '';
  private readonly segments = viewChild(SegmentsSection);
  private readonly timeSlots = viewChild(TimeSlotsSection);
  private readonly tabButtons = viewChildren<ElementRef<HTMLButtonElement>>('tabButton');

  protected readonly tabs = DETAIL_TABS;
  /** `?seccion=tramos` (from the "Tramos" action of the list) opens on the segments. */
  protected readonly activeTab = signal<DetailTab>(this.initialTab());

  protected readonly title = computed(() => this.store.detail()?.route.name ?? 'Ruta');
  protected readonly routeLevels = computed(() => {
    const detail = this.store.detail();
    return detail ? routeSlotLevels(detail.route) : [];
  });
  /**
   * The route on the map: its start and end points (the segment ends when it has none) and the
   * segments in order, in neon; the levels per slot are listed below. Null when there is nothing
   * to draw.
   */
  protected readonly routeMap = computed(() => {
    const detail = this.store.detail();
    if (!detail) return null;
    const { start, end } = detail.route;
    const scene = routeMapScene(
      detail.segments.map((segment) => ({ coordinates: segment.coordinates, level: null })),
    );
    const markers = start || end
      ? [
          ...(start ? [{ kind: 'start' as const, at: { lat: start.lat, lng: start.lng } }] : []),
          ...(end ? [{ kind: 'end' as const, at: { lat: end.lat, lng: end.lng } }] : []),
        ]
      : scene.markers;
    return scene.lines.length > 0 || markers.length > 0 ? { lines: scene.lines, markers } : null;
  });
  protected readonly meta = computed(() => {
    const route = this.store.detail()?.route;
    if (!route) return '';
    return [
      formatDistance(route.distanceKm, 'metric'),
      `${Math.round(route.elevationGainM)} m de desnivel`,
      route.difficulty,
      route.surface,
    ]
      .filter(Boolean)
      .join(' · ');
  });

  /** Coming back from the route form shows the saved values. */
  ionViewWillEnter(): void {
    void this.store.load(this.routeId);
    void this.settings.load();
  }

  hasUnsavedChanges(): boolean {
    return [this.timeSlots(), this.segments()].some((section) => section?.hasUnsavedChanges());
  }

  /** Arrow keys, Home and End move between the tabs and open the one they reach. */
  protected moveFocus(event: KeyboardEvent): void {
    const last = DETAIL_TABS.length - 1;
    const current = DETAIL_TABS.findIndex((tab) => tab.id === this.activeTab());
    const targets: Record<string, number> = {
      ArrowRight: current === last ? 0 : current + 1,
      ArrowLeft: current === 0 ? last : current - 1,
      Home: 0,
      End: last,
    };
    const next = targets[event.key];
    if (next === undefined) return;
    event.preventDefault();
    this.activeTab.set(DETAIL_TABS[next].id);
    this.tabButtons()[next]?.nativeElement.focus();
  }

  private initialTab(): DetailTab {
    const requested = this.snapshot.queryParamMap.get('seccion');
    return isDetailTab(requested) ? requested : 'resumen';
  }
}
