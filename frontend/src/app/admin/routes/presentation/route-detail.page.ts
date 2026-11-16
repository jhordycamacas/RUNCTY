import { Component, computed, inject, viewChild } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IonButton, IonContent, IonSpinner, ViewWillEnter } from '@ionic/angular';
import { formatDistance } from '../../../preferences/domain/units';
import { DIFFICULTY_LABELS, SURFACE_LABELS } from '../../../routes/domain/labels';
import { HasUnsavedChanges } from '../../../shared/forms/unsaved-changes.guard';
import { Notice } from '../../../shared/ui/notice';
import { SubpageHeader } from '../../../shared/ui/subpage-header';
import { RouteDetailStore } from '../application/route-detail.store';
import { routeSlotLevels } from '../domain/slot-safety';
import { SegmentsSection } from './segments-section';
import { SlotSafetyList } from './slot-safety-list';

/**
 * The admin detail of one route (`/admin/rutas/:id`): its summary with the level per time slot
 * and one section per part of the aggregate, each reading the page's `RouteDetailStore`. Time
 * slots (T4) and the safety summary (T5) plug in as sibling sections of `app-segments-section`;
 * a section holding a draft is added to `hasUnsavedChanges`.
 */
@Component({
  selector: 'app-route-detail-admin-page',
  imports: [
    RouterLink,
    IonButton,
    IonContent,
    IonSpinner,
    Notice,
    SegmentsSection,
    SlotSafetyList,
    SubpageHeader,
  ],
  providers: [RouteDetailStore],
  template: `
    <app-subpage-header [title]="title()" backTo="/admin/rutas" />
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
          <app-slot-safety-list
            [levels]="routeLevels()"
            label="Nivel de seguridad de la ruta por franja horaria"
          />
        </section>

        <app-segments-section />
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
    .summary {
      display: flex;
      flex-direction: column;
      gap: var(--rc-space-sm);
      margin-bottom: var(--rc-space-xl);
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
      overflow-wrap: anywhere;
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
  private readonly routeId = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';
  private readonly segments = viewChild(SegmentsSection);

  protected readonly title = computed(() => this.store.detail()?.route.name ?? 'Ruta');
  protected readonly routeLevels = computed(() => {
    const detail = this.store.detail();
    return detail ? routeSlotLevels(detail.route) : [];
  });
  protected readonly meta = computed(() => {
    const route = this.store.detail()?.route;
    if (!route) return '';
    return [
      formatDistance(route.distanceKm, 'metric'),
      `${Math.round(route.elevationGainM)} m de desnivel`,
      route.difficulty ? DIFFICULTY_LABELS[route.difficulty] : null,
      route.surface ? SURFACE_LABELS[route.surface] : null,
    ]
      .filter(Boolean)
      .join(' · ');
  });

  /** Coming back from the route form shows the saved values. */
  ionViewWillEnter(): void {
    void this.store.load(this.routeId);
  }

  hasUnsavedChanges(): boolean {
    return this.segments()?.hasUnsavedChanges() ?? false;
  }
}
