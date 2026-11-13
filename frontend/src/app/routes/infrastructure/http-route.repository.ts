import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiClient } from '../../core/api/api-client';
import { toRoute, toRouteDetail } from '../domain/mappers';
import { Route, RouteDetail, RouteRepository } from '../domain/route';

/** `GET /routes?cityId=` and `GET /routes/{id}`: active routes with their safety per time slot. */
@Injectable()
export class HttpRouteRepository extends RouteRepository {
  private readonly api = inject(ApiClient);

  async listByCity(cityId: string): Promise<Route[]> {
    const { routes } = await firstValueFrom(
      this.api.get<{ routes: unknown[] }>('/routes', { cityId }),
    );
    return Array.isArray(routes) ? routes.map(toRoute) : [];
  }

  async get(routeId: string): Promise<RouteDetail> {
    return toRouteDetail(
      await firstValueFrom(this.api.get<unknown>(`/routes/${encodeURIComponent(routeId)}`)),
    );
  }
}
