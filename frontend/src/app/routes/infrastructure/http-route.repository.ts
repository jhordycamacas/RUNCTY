import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiClient } from '../../core/api/api-client';
import { ApiError } from '../../core/errors/api-error';
import { toImageUrl, toRoute, toRouteDetail } from '../domain/mappers';
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

  /** `GET /routes/{id}/image`: 404 `route-image-not-found` means the route has no image. */
  async getImage(routeId: string): Promise<string | null> {
    try {
      const { image } = await firstValueFrom(
        this.api.get<{ image?: unknown }>(`/routes/${encodeURIComponent(routeId)}/image`),
      );
      return toImageUrl(image);
    } catch (error) {
      if (error instanceof ApiError && error.reason === 'route-image-not-found') return null;
      throw error;
    }
  }
}
