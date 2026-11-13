import { Injectable, computed, inject } from '@angular/core';
import { ProfileStore } from '../../account/application/profile.store';
import { CitiesStore } from '../../cities/application/cities.store';

/**
 * - `loading`: the profile or the city catalogue are still on their way.
 * - `error`: one of them failed, so the city is unknown (not the same as having none).
 * - `no-city`: the profile has no city, or it is no longer in the catalogue.
 * - `ready`: the runner's city is known.
 */
export type RunnerCityStatus = 'loading' | 'error' | 'no-city' | 'ready';

/** The runner's city, taken from the profile and checked against the active catalogue. */
@Injectable({ providedIn: 'root' })
export class RunnerCity {
  private readonly profiles = inject(ProfileStore);
  private readonly catalogue = inject(CitiesStore);

  private readonly city = computed(() => {
    const id = this.profiles.profile()?.cityId;
    return id ? (this.catalogue.byId().get(id) ?? null) : null;
  });

  readonly cityId = computed(() => this.city()?.id ?? null);
  readonly cityName = computed(() => this.city()?.name ?? null);
  readonly error = computed(() =>
    this.profiles.profile()
      ? this.catalogue.error()
      : (this.profiles.error() ?? this.catalogue.error()),
  );
  readonly status = computed<RunnerCityStatus>(() => {
    if (this.city()) return 'ready';
    const profile = this.profiles.profile();
    const catalogueReady = this.catalogue.cities() !== null;
    if (profile && catalogueReady) return 'no-city';
    return this.error() ? 'error' : 'loading';
  });

  /** Loads what is missing: a profile already there or on its way is not requested again. */
  load(): Promise<unknown> {
    const needsProfile = !this.profiles.profile() && !this.profiles.loading();
    return Promise.all([needsProfile ? this.profiles.load() : null, this.catalogue.load()]);
  }
}
