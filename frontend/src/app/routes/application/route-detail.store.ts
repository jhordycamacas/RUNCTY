import { Injectable, computed, inject, signal } from '@angular/core';
import { ApiError } from '../../core/errors/api-error';
import { userMessage } from '../../core/errors/user-message';
import { RouteDetail, RouteRepository } from '../domain/route';

/** `loading` until the first answer; `missing` is a route that does not exist or is inactive. */
export type RouteDetailStatus = 'loading' | 'ready' | 'missing' | 'error';

/** One route with its segments. Provided per detail page, so it never outlives the screen. */
@Injectable()
export class RouteDetailStore {
  private readonly repository = inject(RouteRepository);
  private readonly stored = signal<RouteDetail | null>(null);
  private readonly failure = signal<string | null>(null);
  private readonly gone = signal(false);

  private readonly full = signal<string | null>(null);

  readonly detail = this.stored.asReadonly();
  /** The full custom image of the route; null until it arrives, or when it cannot be loaded. */
  readonly fullImage = this.full.asReadonly();
  readonly error = this.failure.asReadonly();
  readonly status = computed<RouteDetailStatus>(() => {
    if (this.stored()) return 'ready';
    if (this.gone()) return 'missing';
    return this.failure() ? 'error' : 'loading';
  });

  async load(routeId: string): Promise<void> {
    this.failure.set(null);
    try {
      const detail = await this.repository.get(routeId);
      this.stored.set(detail);
      this.gone.set(false);
      // Not awaited: the page shows the thumbnail meanwhile and keeps it if this fails.
      void this.loadImage(detail);
    } catch (error) {
      if (error instanceof ApiError && error.reason === 'route-not-found') {
        this.stored.set(null);
        this.gone.set(true);
      } else {
        this.gone.set(false);
        this.failure.set(userMessage(error));
      }
    }
  }

  private async loadImage(detail: RouteDetail): Promise<void> {
    this.full.set(null);
    if (!detail.route.imageThumb) return;
    try {
      const image = await this.repository.getImage(detail.route.id);
      // A later load of another route may have replaced the detail meanwhile.
      if (this.stored() === detail) this.full.set(image);
    } catch {
      // The thumbnail already on screen is a good enough fallback.
    }
  }
}
