import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IonButton, IonContent, IonIcon, IonSpinner } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { helpCircleOutline, mapOutline } from 'ionicons/icons';
import { PreferencesStore } from '../../preferences/application/preferences.store';
import { formatDistance } from '../../preferences/domain/units';
import { ChoiceChips, ChipOption } from '../../shared/ui/choice-chips';
import { Notice } from '../../shared/ui/notice';
import { SubpageHeader } from '../../shared/ui/subpage-header';
import { RouteDetailStore } from '../application/route-detail.store';
import {
  listTimeSlots,
  resolveSlotKey,
  routeSafetyForSlot,
  segmentSafetyForSlot,
} from '../domain/catalog';
import {
  SAFETY_DISCLAIMER,
  formatElevation,
  formatSegmentLength,
} from '../domain/labels';
import { googleMapsUrl } from '../domain/maps';
import { MapView } from '../../shared/map/map-view';
import { FactorList } from './factor-list';
import { routeMapScene } from './route-map';
import { SafetyBadge } from './safety-badge';

addIcons({ helpCircleOutline, mapOutline });

/** Route detail: key stats, the safety level of the selected slot and the segments behind it. */
@Component({
  selector: 'app-route-detail-page',
  imports: [
    RouterLink,
    ChoiceChips,
    FactorList,
    MapView,
    Notice,
    SafetyBadge,
    SubpageHeader,
    IonButton,
    IonContent,
    IonIcon,
    IonSpinner,
  ],
  providers: [RouteDetailStore],
  template: `
    <app-subpage-header title="Ruta" backTo="/app/rutas" />
    <ion-content class="ion-padding">
      @switch (store.status()) {
        @case ('loading') {
          <p class="state" role="status"><ion-spinner name="crescent" /> Cargando ruta…</p>
        }
        @case ('missing') {
          <section class="card" aria-labelledby="missing-title">
            <h2 id="missing-title">Esta ruta ya no está disponible</h2>
            <p>Puede que se haya retirado del catálogo.</p>
            <ion-button routerLink="/app/rutas">Ver todas las rutas</ion-button>
          </section>
        }
        @case ('error') {
          <app-notice [message]="store.error()" />
          <ion-button fill="outline" (click)="reload()">Reintentar</ion-button>
        }
        @default {
          @if (store.detail(); as detail) {
            <h1>{{ detail.route.name }}</h1>
            @if (detail.route.description) {
              <p class="muted">{{ detail.route.description }}</p>
            }

            <dl class="stats">
              <div class="stat">
                <dt>Distancia</dt>
                <dd class="figure">{{ distance() }}</dd>
              </div>
              <div class="stat">
                <dt>Desnivel</dt>
                <dd class="figure">{{ elevation() }}</dd>
              </div>
              <div class="stat">
                <dt>Dificultad</dt>
                <dd>{{ difficulty() }}</dd>
              </div>
              <div class="stat">
                <dt>Superficie</dt>
                <dd>{{ surface() }}</dd>
              </div>
            </dl>

            @if (routeMap(); as scene) {
              <app-map-view
                class="route-map"
                label="Mapa de la ruta"
                [lines]="scene.lines"
                [markers]="scene.markers"
              />
            }

            @if (detail.route.start || detail.route.end) {
              <dl class="places">
                @if (detail.route.start; as start) {
                  <div>
                    <dt>Inicio</dt>
                    <dd>{{ start.label || 'Sin nombre' }}</dd>
                  </div>
                }
                @if (detail.route.end; as end) {
                  <div>
                    <dt>Fin</dt>
                    <dd>{{ end.label || 'Sin nombre' }}</dd>
                  </div>
                }
              </dl>
            }
            @if (mapsUrl(); as url) {
              <a class="maps" [href]="url" target="_blank" rel="noopener noreferrer">
                <ion-icon name="map-outline" aria-hidden="true" />
                Abrir en Google Maps
              </a>
            }

            <h2>Seguridad por franja</h2>
            <app-choice-chips
              label="Franja horaria"
              [options]="slotOptions()"
              [value]="slotKey()"
              (selected)="chosenSlot.set($event)"
            />
            <section class="card" aria-label="Nivel de seguridad de la franja">
              @if (safety(); as slot) {
                <app-safety-badge [level]="slot.level" />
                <p class="score">Puntaje {{ slot.score }} de 100</p>
                @if (slot.factors.length > 0) {
                  <h3>Por qué este nivel</h3>
                  <app-factor-list [factors]="slot.factors" />
                } @else {
                  <p>No hay factores de riesgo registrados para esta franja</p>
                }
              } @else {
                <p class="unrated">
                  <ion-icon name="help-circle-outline" aria-hidden="true" /> Sin evaluar
                </p>
                <p class="muted">
                  {{
                    slotOptions().length > 0
                      ? 'Esta ruta no tiene una evaluación de seguridad para esta franja.'
                      : 'Esta ruta aún no tiene una evaluación de seguridad.'
                  }}
                </p>
              }
            </section>

            <h2>Tramos</h2>
            <p class="muted">Nivel de cada tramo en la franja elegida.</p>
            @for (segment of segments(); track segment.id; let index = $index) {
              <section class="card segment">
                <div class="segment-header">
                  <div>
                    <strong>{{ index + 1 }}. {{ segment.name }}</strong>
                    <div class="muted">{{ segment.length }} · {{ segment.points }}</div>
                  </div>
                  @if (segment.safety; as level) {
                    <app-safety-badge [level]="level.level" [compact]="true" />
                  } @else {
                    <span class="unrated">Sin evaluar</span>
                  }
                </div>
                @if (segment.safety && segment.safety.factors.length > 0) {
                  <app-factor-list [factors]="segment.safety.factors" />
                }
              </section>
            } @empty {
              <p class="muted">Esta ruta aún no tiene tramos registrados.</p>
            }

            <app-notice class="disclaimer" tone="info" [message]="disclaimer" />
          }
        }
      }
    </ion-content>
  `,
  styles: `
    h1 {
      margin: var(--rc-space-md) 0 var(--rc-space-xs);
      font-size: var(--rc-font-size-display);
      font-weight: 600;
      letter-spacing: -0.02em;
      line-height: 1.15;
    }

    h2 {
      margin: var(--rc-space-xl) 0 var(--rc-space-sm);
      font-size: var(--rc-font-size-subtitle);
      font-weight: 500;
    }

    h3 {
      margin: var(--rc-space-lg) 0 0;
      font-size: var(--rc-font-size-body);
    }

    p {
      margin: 0 0 var(--rc-space-sm);
    }

    .muted,
    dt {
      color: var(--rc-text-muted);
      font-size: var(--rc-font-size-label);
    }

    dd {
      margin: 0;
    }

    .stats {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--rc-space-md);
      margin: var(--rc-space-lg) 0;
    }

    // Dark rounded cards on the near-black page (raised white cards in the light theme).
    .stat,
    .card {
      padding: var(--rc-space-lg);
      border: 1px solid var(--rc-border);
      border-radius: var(--rc-radius-lg);
      background: var(--rc-surface-elevated);
    }

    .stat dd {
      margin-top: var(--rc-space-xs);
      font-size: var(--rc-font-size-subtitle);
      font-weight: 600;
      line-height: 1.2;
      overflow-wrap: anywhere;
    }

    // Distance and elevation in big condensed numerals, distance in neon.
    .stat dd.figure {
      font-family: var(--rc-font-family-display);
      font-size: calc(var(--rc-font-size-display) * 1.5);
      font-weight: 500;
      line-height: 1;
    }

    .stat:first-child dd.figure {
      color: var(--rc-primary-text);
    }

    .route-map {
      margin: 0 0 var(--rc-space-lg);
    }

    .places {
      margin: 0 0 var(--rc-space-md);
    }

    .places div {
      display: flex;
      gap: var(--rc-space-md);
      padding: var(--rc-space-xs) 0;
    }

    .places dt {
      min-width: 3.5rem;
    }

    .maps {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--rc-space-sm);
      min-height: var(--rc-min-touch-target);
      padding: 0 var(--rc-space-lg);
      border: 1px solid var(--rc-primary-text);
      border-radius: var(--rc-radius-pill);
      color: var(--rc-primary-text);
      font-weight: 600;
      text-decoration: none;
    }

    .score {
      margin-top: var(--rc-space-sm);
      color: var(--rc-text-muted);
      font-size: var(--rc-font-size-label);
    }

    .segment {
      margin-bottom: var(--rc-space-md);
    }

    .segment-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--rc-space-sm);
    }

    .unrated {
      display: inline-flex;
      align-items: center;
      gap: var(--rc-space-xs);
      color: var(--rc-text-muted);
      font-size: var(--rc-font-size-label);
    }

    .disclaimer {
      margin-top: var(--rc-space-xl);
    }

    .state {
      display: flex;
      align-items: center;
      gap: var(--rc-space-sm);
      color: var(--rc-text-muted);
    }
  `,
})
export class RouteDetailPage {
  protected readonly store = inject(RouteDetailStore);
  private readonly preferences = inject(PreferencesStore);
  private readonly snapshot = inject(ActivatedRoute).snapshot;

  protected readonly disclaimer = SAFETY_DISCLAIMER;
  protected readonly chosenSlot = signal<string | null>(this.snapshot.queryParamMap.get('franja'));

  private readonly units = computed(() => this.preferences.preferences().units);
  private readonly route = computed(() => this.store.detail()?.route ?? null);
  private readonly slots = computed(() => {
    const route = this.route();
    return route ? listTimeSlots([route]) : [];
  });

  protected readonly slotOptions = computed<ChipOption[]>(() =>
    this.slots().map((slot) => ({ value: slot.key, label: slot.label })),
  );
  protected readonly slotKey = computed(() =>
    resolveSlotKey(this.slots(), this.chosenSlot(), new Date()),
  );
  protected readonly safety = computed(() => {
    const route = this.route();
    return route ? routeSafetyForSlot(route, this.slotKey()) : null;
  });

  protected readonly distance = computed(() =>
    formatDistance(this.route()?.distanceKm ?? 0, this.units()),
  );
  protected readonly elevation = computed(() =>
    formatElevation(this.route()?.elevationGainM ?? 0, this.units()),
  );
  protected readonly difficulty = computed(() => this.route()?.difficulty ?? 'Sin dato');
  protected readonly surface = computed(() => this.route()?.surface ?? 'Sin dato');
  protected readonly mapsUrl = computed(() => {
    const start = this.route()?.start;
    return start ? googleMapsUrl(start) : null;
  });

  /** Segments with the text and the level of the selected slot already resolved. */
  protected readonly segments = computed(() => {
    const detail = this.store.detail();
    if (!detail) return [];
    return detail.segments.map((segment) => {
      const points = segment.coordinates.length;
      return {
        id: segment.id,
        name: segment.name,
        length: formatSegmentLength(segment.lengthM, this.units()),
        points: `${points} ${points === 1 ? 'punto' : 'puntos'}`,
        safety: segmentSafetyForSlot(segment, detail.route, this.slotKey()),
      };
    });
  });

  /** The route drawn on the map, each segment in the color of its level in the selected slot. */
  protected readonly routeMap = computed(() => {
    const detail = this.store.detail();
    if (!detail) return null;
    const scene = routeMapScene(
      detail.segments.map((segment) => ({
        coordinates: segment.coordinates,
        level: segmentSafetyForSlot(segment, detail.route, this.slotKey())?.level ?? null,
      })),
    );
    return scene.lines.length > 0 ? scene : null;
  });

  constructor() {
    this.reload();
  }

  protected reload(): void {
    void this.store.load(this.snapshot.paramMap.get('id') ?? '');
  }
}
