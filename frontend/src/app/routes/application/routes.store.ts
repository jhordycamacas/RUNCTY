import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { userMessage } from '../../core/errors/user-message';
import { Route, RouteRepository } from '../domain/route';

/**
 * The active routes of the runner's city, shared by the Home section and the Rutas tab. The list
 * belongs to one user and one city: it is dropped when either changes.
 */
@Injectable({ providedIn: 'root' })
export class RoutesStore {
  private readonly repository = inject(RouteRepository);
  private readonly auth = inject(AuthService);
  private readonly stored = signal<{ uid: string; cityId: string; routes: Route[] } | null>(null);
  private readonly requested = signal<string | null>(null);
  private readonly failure = signal<string | null>(null);
  private readonly pending = signal(false);

  /** `null` until the routes of the requested city arrive. */
  readonly routes = computed(() => {
    const stored = this.stored();
    return stored && stored.uid === this.auth.session()?.uid && stored.cityId === this.requested()
      ? stored.routes
      : null;
  });
  readonly error = this.failure.asReadonly();
  readonly loading = this.pending.asReadonly();

  /**
   * Loads the routes of a city unless they are already there. `force` reloads (pull-to-refresh,
   * retry); the previous list stays visible while it loads or if the reload fails.
   */
  async load(cityId: string, force = false): Promise<void> {
    this.requested.set(cityId);
    if (this.pending()) return;
    if (!force && this.routes() !== null) return;
    this.pending.set(true);
    this.failure.set(null);
    try {
      const routes = await this.repository.listByCity(cityId);
      const uid = this.auth.session()?.uid;
      if (uid) this.stored.set({ uid, cityId, routes });
    } catch (error) {
      this.failure.set(userMessage(error));
    } finally {
      this.pending.set(false);
    }
    // The city changed while loading: fetch the one now requested.
    const latest = this.requested();
    if (latest && latest !== cityId) await this.load(latest);
  }
}
