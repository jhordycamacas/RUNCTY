import { Injectable, inject, signal } from '@angular/core';
import { userMessage } from '../../../core/errors/user-message';
import { ManagedRouteDetail, RouteAdminRepository, SegmentInput } from '../domain/managed-route';

/**
 * One route as the admin manages it (RF-05-5 to RF-05-8, RF-07): segments, time slots, risk
 * factors and the safety index. The API recalculates the index on every change and only
 * `GET /routes/{id}` returns it, so every change goes through `mutate`, which reloads the detail.
 * Provided by the detail page, so it lives as long as the screen.
 */
@Injectable()
export class RouteDetailStore {
  private readonly repository = inject(RouteAdminRepository);
  private readonly current = signal<ManagedRouteDetail | null>(null);
  private readonly failure = signal<string | null>(null);
  private readonly pending = signal(false);
  private routeId: string | null = null;
  /** Only the answer of the latest request is kept. */
  private request = 0;

  /** `null` until the route arrives; it stays visible while it reloads or if a reload fails. */
  readonly detail = this.current.asReadonly();
  readonly error = this.failure.asReadonly();
  readonly loading = this.pending.asReadonly();

  async load(routeId: string): Promise<void> {
    if (routeId !== this.routeId) this.current.set(null);
    this.routeId = routeId;
    const request = ++this.request;
    this.pending.set(true);
    this.failure.set(null);
    try {
      const detail = await this.repository.get(routeId);
      if (request === this.request) this.current.set(detail);
    } catch (error) {
      if (request === this.request) this.failure.set(userMessage(error));
    } finally {
      if (request === this.request) this.pending.set(false);
    }
  }

  reload(): Promise<void> {
    return this.routeId ? this.load(this.routeId) : Promise.resolve();
  }

  /** Creates (`segmentId` null) or updates a segment; `order` moves it in the route. */
  saveSegment(segmentId: string | null, input: SegmentInput): Promise<void> {
    return this.mutate((routeId) =>
      segmentId === null
        ? this.repository.createSegment(routeId, input)
        : this.repository.updateSegment(routeId, segmentId, input),
    );
  }

  /** Also deletes the risk factors of the segment. */
  deleteSegment(segmentId: string): Promise<void> {
    return this.mutate((routeId) => this.repository.deleteSegment(routeId, segmentId));
  }

  /**
   * Runs a change of the route aggregate and then shows the recalculated detail. A rejected
   * change rejects with the API error (in Spanish) and reloads nothing; a failed reload keeps the
   * previous detail and sets `error`. Time slot and risk factor changes go through here too.
   */
  private async mutate(change: (routeId: string) => Promise<unknown>): Promise<void> {
    const routeId = this.routeId;
    if (!routeId) throw new Error('The route detail is not loaded.');
    await change(routeId);
    await this.load(routeId);
  }
}
