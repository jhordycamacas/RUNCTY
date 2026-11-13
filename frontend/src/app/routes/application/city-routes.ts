import { Injectable, computed, effect, inject, untracked } from '@angular/core';
import { Route } from '../domain/route';
import { RoutesStore } from './routes.store';
import { RunnerCity } from './runner-city';

/**
 * What a screen shows about the runner's routes. Each situation is its own state so none is
 * mistaken for another: still loading, a failed load (retryable), a profile without a usable city,
 * a city with no active routes, and the normal list.
 */
export type CityRoutesState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'no-city' }
  | { kind: 'empty' }
  | { kind: 'ready' };

const LOAD_FAILED = 'No pudimos cargar las rutas.';

/** The active routes of the runner's city, shared by Home and the Rutas tab. */
@Injectable({ providedIn: 'root' })
export class CityRoutes {
  private readonly city = inject(RunnerCity);
  private readonly store = inject(RoutesStore);

  readonly cityName = this.city.cityName;
  readonly routes = computed<Route[]>(() => this.store.routes() ?? []);
  readonly state = computed<CityRoutesState>(() => {
    const status = this.city.status();
    if (status === 'loading') return { kind: 'loading' };
    if (status === 'error') return { kind: 'error', message: this.city.error() ?? LOAD_FAILED };
    if (status === 'no-city') return { kind: 'no-city' };

    const routes = this.store.routes();
    if (routes === null) {
      const message = this.store.error();
      return message ? { kind: 'error', message } : { kind: 'loading' };
    }
    return routes.length > 0 ? { kind: 'ready' } : { kind: 'empty' };
  });

  constructor() {
    effect(() => {
      const cityId = this.city.cityId();
      if (cityId) untracked(() => void this.store.load(cityId));
    });
  }

  /** Loads the profile, the city catalogue and the routes that are not there yet. */
  load(): Promise<unknown> {
    return this.city.load();
  }

  /** Retry after an error and pull-to-refresh: asks the API again. */
  reload(): Promise<unknown> {
    const cityId = this.city.cityId();
    return cityId ? this.store.load(cityId, true) : this.city.load();
  }
}
