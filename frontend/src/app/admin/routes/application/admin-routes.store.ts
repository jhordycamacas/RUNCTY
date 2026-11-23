import { Injectable, computed, inject, signal } from '@angular/core';
import { CityRepository } from '../../../cities/domain/city';
import { userMessage } from '../../../core/errors/user-message';
import { Route } from '../../../routes/domain/route';
import { RouteAdminRepository, RouteInput } from '../domain/managed-route';
import { filterRoutesByText } from '../domain/route-form';
import { RouteImageChange } from '../domain/route-image';
import { RoutePlace, toRoutePlaces } from '../domain/route-places';

/**
 * The admin route list (RF-05-2): every route of the selected city or zone, inactive ones
 * included, with a text filter. Provided by the `rutas` section, so the list and the form share
 * the selected city.
 */
@Injectable()
export class AdminRoutesStore {
  private readonly repository = inject(RouteAdminRepository);
  private readonly cityRepository = inject(CityRepository);

  private readonly placeList = signal<RoutePlace[] | null>(null);
  private readonly placesFailure = signal<string | null>(null);
  private readonly list = signal<Route[] | null>(null);
  private readonly failure = signal<string | null>(null);
  private readonly pending = signal(false);
  /** Only the answer of the latest request is kept. */
  private request = 0;

  /** The selected city or zone; `null` lists every route. */
  readonly cityId = signal<string | null>(null);
  readonly query = signal('');

  readonly places = this.placeList.asReadonly();
  readonly placesError = this.placesFailure.asReadonly();
  /** `null` until the routes of the selected city arrive. */
  readonly routes = this.list.asReadonly();
  readonly error = this.failure.asReadonly();
  readonly loading = this.pending.asReadonly();
  readonly visibleRoutes = computed(() => filterRoutesByText(this.list() ?? [], this.query()));

  private readonly placeNames = computed(
    () => new Map((this.placeList() ?? []).map((place) => [place.id, place.name])),
  );

  placeName(id: string): string {
    return this.placeNames().get(id) ?? id;
  }

  /** The city and zone catalogue, loaded once; a failed load can be retried. */
  async loadPlaces(): Promise<void> {
    if (this.placeList() !== null) return;
    this.placesFailure.set(null);
    try {
      this.placeList.set(toRoutePlaces(await this.cityRepository.list()));
    } catch (error) {
      this.placesFailure.set(userMessage(error));
    }
  }

  selectCity(cityId: string | null): Promise<void> {
    this.cityId.set(cityId);
    this.list.set(null);
    return this.load();
  }

  /** Asks the API again; the current list stays visible while it loads or if it fails. */
  async load(): Promise<void> {
    const request = ++this.request;
    this.pending.set(true);
    this.failure.set(null);
    try {
      const routes = await this.repository.list(this.cityId());
      if (request === this.request) this.list.set(routes);
    } catch (error) {
      if (request === this.request) this.failure.set(userMessage(error));
    } finally {
      if (request === this.request) this.pending.set(false);
    }
  }

  async getRoute(routeId: string): Promise<Route> {
    return (await this.repository.get(routeId)).route;
  }

  /**
   * Creates (`routeId` null) or updates a route and resolves to its id. When a city is selected
   * and the route belongs to another one, the list switches to it so the route is visible.
   */
  async saveRoute(routeId: string | null, input: RouteInput): Promise<string> {
    let id = routeId;
    if (id === null) id = await this.repository.createRoute(input);
    else await this.repository.updateRoute(id, input);
    const selected = this.cityId();
    if (selected !== null && selected !== input.cityId) {
      this.cityId.set(input.cityId);
      this.list.set(null);
    }
    return id;
  }

  /** Sets or removes the custom image of an existing route. */
  async applyImage(routeId: string, change: RouteImageChange): Promise<void> {
    if (change.kind === 'set') await this.repository.setImage(routeId, change.input);
    else await this.repository.removeImage(routeId);
  }

  /** Deletes a route (cascading to its segments, slots and factors) and drops it from the list. */
  async deleteRoute(routeId: string): Promise<void> {
    await this.repository.deleteRoute(routeId);
    this.list.update((routes) => routes?.filter((route) => route.id !== routeId) ?? null);
  }
}
