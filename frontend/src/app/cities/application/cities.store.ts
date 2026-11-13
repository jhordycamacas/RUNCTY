import { Injectable, computed, inject, signal } from '@angular/core';
import { userMessage } from '../../core/errors/user-message';
import { City, CityRepository, toPickerCities } from '../domain/city';

/** Active cities for the pickers (sign-up, profile, home). Loaded once and kept for the session. */
@Injectable({ providedIn: 'root' })
export class CitiesStore {
  private readonly repository = inject(CityRepository);
  private readonly list = signal<City[] | null>(null);
  private readonly failure = signal<string | null>(null);
  private readonly pending = signal(false);

  /** `null` until the first successful load. */
  readonly cities = this.list.asReadonly();
  readonly error = this.failure.asReadonly();
  readonly loading = this.pending.asReadonly();
  readonly byId = computed(() => new Map((this.list() ?? []).map((city) => [city.id, city])));

  /** Loads the catalogue unless it is already there; a failed load can be retried. */
  async load(): Promise<void> {
    if (this.list() !== null || this.pending()) return;
    this.pending.set(true);
    this.failure.set(null);
    try {
      this.list.set(toPickerCities(await this.repository.list()));
    } catch (error) {
      this.failure.set(userMessage(error));
    } finally {
      this.pending.set(false);
    }
  }
}
