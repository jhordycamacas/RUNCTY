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

  readonly detail = this.stored.asReadonly();
  readonly error = this.failure.asReadonly();
  readonly status = computed<RouteDetailStatus>(() => {
    if (this.stored()) return 'ready';
    if (this.gone()) return 'missing';
    return this.failure() ? 'error' : 'loading';
  });

  async load(routeId: string): Promise<void> {
    this.failure.set(null);
    try {
      this.stored.set(await this.repository.get(routeId));
      this.gone.set(false);
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
}
