import { Injectable, inject } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { ApiClient } from '../../../core/api/api-client';
import { toRoute } from '../../../routes/domain/mappers';
import { Route } from '../../../routes/domain/route';
import { toManagedRouteDetail } from '../domain/mappers';
import {
  ManagedRouteDetail,
  RiskFactorInput,
  RouteAdminRepository,
  RouteInput,
  SegmentInput,
  TimeSlotInput,
} from '../domain/managed-route';
import { RouteImageInput } from '../domain/route-image';

const encode = encodeURIComponent;
const routePath = (routeId: string) => `/routes/${encode(routeId)}`;
const segmentsPath = (routeId: string) => `${routePath(routeId)}/segments`;
const slotsPath = (routeId: string) => `${routePath(routeId)}/time-slots`;
const factorsPath = (routeId: string, segmentId: string) =>
  `${segmentsPath(routeId)}/${encode(segmentId)}/risk-factors`;

/**
 * The route aggregate endpoints for `routes.manage` (RF-05, RF-07). Creates answer 201 `{id}`,
 * updates and deletes 204; every change also recalculates the safety index on the server.
 */
@Injectable()
export class HttpRouteAdminRepository extends RouteAdminRepository {
  private readonly api = inject(ApiClient);

  async list(cityId: string | null): Promise<Route[]> {
    const { routes } = await firstValueFrom(
      this.api.get<{ routes?: unknown }>('/routes', cityId === null ? {} : { cityId }),
    );
    return Array.isArray(routes) ? routes.map(toRoute) : [];
  }

  async get(routeId: string): Promise<ManagedRouteDetail> {
    return toManagedRouteDetail(await firstValueFrom(this.api.get<unknown>(routePath(routeId))));
  }

  createRoute(input: RouteInput): Promise<string> {
    return this.create('/routes', input);
  }

  updateRoute(routeId: string, input: RouteInput): Promise<void> {
    return this.done(this.api.put(routePath(routeId), input));
  }

  deleteRoute(routeId: string): Promise<void> {
    return this.done(this.api.delete(routePath(routeId)));
  }

  setImage(routeId: string, input: RouteImageInput): Promise<void> {
    return this.done(this.api.put(`${routePath(routeId)}/image`, input));
  }

  removeImage(routeId: string): Promise<void> {
    return this.done(this.api.delete(`${routePath(routeId)}/image`));
  }

  createSegment(routeId: string, input: SegmentInput): Promise<string> {
    return this.create(segmentsPath(routeId), input);
  }

  updateSegment(routeId: string, segmentId: string, input: SegmentInput): Promise<void> {
    return this.done(this.api.put(`${segmentsPath(routeId)}/${encode(segmentId)}`, input));
  }

  deleteSegment(routeId: string, segmentId: string): Promise<void> {
    return this.done(this.api.delete(`${segmentsPath(routeId)}/${encode(segmentId)}`));
  }

  createTimeSlot(routeId: string, input: TimeSlotInput): Promise<string> {
    return this.create(slotsPath(routeId), input);
  }

  updateTimeSlot(routeId: string, slotId: string, input: TimeSlotInput): Promise<void> {
    return this.done(this.api.put(`${slotsPath(routeId)}/${encode(slotId)}`, input));
  }

  deleteTimeSlot(routeId: string, slotId: string): Promise<void> {
    return this.done(this.api.delete(`${slotsPath(routeId)}/${encode(slotId)}`));
  }

  createRiskFactor(routeId: string, segmentId: string, input: RiskFactorInput): Promise<string> {
    return this.create(factorsPath(routeId, segmentId), input);
  }

  updateRiskFactor(
    routeId: string,
    segmentId: string,
    factorId: string,
    input: RiskFactorInput,
  ): Promise<void> {
    return this.done(this.api.put(`${factorsPath(routeId, segmentId)}/${encode(factorId)}`, input));
  }

  deleteRiskFactor(routeId: string, segmentId: string, factorId: string): Promise<void> {
    return this.done(this.api.delete(`${factorsPath(routeId, segmentId)}/${encode(factorId)}`));
  }

  private async create(url: string, input: unknown): Promise<string> {
    const { id } = await firstValueFrom(this.api.post<{ id: string }>(url, input));
    return id;
  }

  private async done(request: Observable<unknown>): Promise<void> {
    await firstValueFrom(request);
  }
}
