import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonSpinner } from '@ionic/angular';
import { Notice } from '../../shared/ui/notice';
import { CityRoutes } from '../application/city-routes';
import { listTimeSlots, resolveSlotKey, sortRoutesForSlot } from '../domain/catalog';
import { RouteCard } from './route-card';

/** How many routes the Home section shows. */
const LIMIT = 3;

/**
 * Home section: the routes of the runner's city with the best safety level for the current or
 * next time slot. Loading, a failed load, a missing city and a city without routes are
 * different states, so a failure is never presented as "no routes". With `featured` the routes
 * show as the brand-gradient cards of the home's dark band.
 */
@Component({
  selector: 'app-recommended-routes',
  imports: [RouterLink, Notice, RouteCard, IonButton, IonSpinner],
  template: `
    <section aria-labelledby="recommended-title">
      <h2 id="recommended-title">Rutas recomendadas</h2>

      @switch (data.state().kind) {
        @case ('loading') {
          <p class="state" role="status"><ion-spinner name="crescent" /> Cargando rutas…</p>
        }
        @case ('error') {
          <app-notice [message]="errorMessage()" />
          <ion-button fill="outline" (click)="retry()">Reintentar</ion-button>
        }
        @case ('no-city') {
          <div class="card">
            <h3>Elige tu ciudad</h3>
            <p>No encontramos tu ciudad en el catálogo. Elígela para ver las rutas cerca de ti.</p>
            <ion-button routerLink="/app/cuenta/datos">Elegir ciudad</ion-button>
          </div>
        }
        @case ('empty') {
          <div class="card">
            <h3>Aún no hay rutas en {{ data.cityName() }}</h3>
            <p>
              Pronto verás aquí las rutas recomendadas de tu ciudad con su nivel de seguridad por
              horario.
            </p>
          </div>
        }
        @default {
          @if (slotLabel(); as label) {
            <p class="slot">Nivel de seguridad para la franja de {{ label }}</p>
          }
          @for (route of top(); track route.id) {
            <app-route-card [route]="route" [slotKey]="slotKey()" [featured]="featured()" />
          }
          <ion-button fill="clear" routerLink="/app/rutas">Ver todas las rutas</ion-button>
        }
      }
    </section>
  `,
  styles: `
    h2 {
      margin: var(--rc-space-xl) 0 var(--rc-space-sm);
      font-size: var(--rc-font-size-title);
      font-weight: 400;
    }

    h3 {
      margin: 0 0 var(--rc-space-sm);
      font-size: var(--rc-font-size-body);
    }

    .card {
      padding: var(--rc-space-lg);
      border-radius: var(--rc-radius-lg);
      background: var(--rc-surface-elevated);
    }

    .card p {
      margin: 0 0 var(--rc-space-md);
    }

    .slot {
      margin: 0 0 var(--rc-space-sm);
      color: var(--rc-text-muted);
      font-size: var(--rc-font-size-label);
    }

    .state {
      display: flex;
      align-items: center;
      gap: var(--rc-space-sm);
      color: var(--rc-text-muted);
    }
  `,
})
export class RecommendedRoutes {
  /** Shows the routes as featured cards, for a dark band. */
  readonly featured = input(false);

  protected readonly data = inject(CityRoutes);

  private readonly now = new Date();
  private readonly slots = computed(() => listTimeSlots(this.data.routes()));
  /** The window in progress or the next one to start. */
  protected readonly slotKey = computed(() => resolveSlotKey(this.slots(), null, this.now));
  protected readonly top = computed(() =>
    sortRoutesForSlot(this.data.routes(), this.slotKey()).slice(0, LIMIT),
  );
  protected readonly slotLabel = computed(
    () => this.slots().find((slot) => slot.key === this.slotKey())?.label ?? null,
  );
  protected readonly errorMessage = computed(() => {
    const state = this.data.state();
    return state.kind === 'error' ? state.message : null;
  });

  constructor() {
    void this.data.load();
  }

  protected retry(): void {
    void this.data.reload();
  }
}
