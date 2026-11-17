import { Injectable, computed, inject, signal } from '@angular/core';
import { userMessage } from '../../../core/errors/user-message';
import {
  CityAdminRepository,
  CityCreateInput,
  CityGroup,
  ManagedCity,
  groupCities,
} from '../domain/managed-city';

/** The catalogue of cities and zones (RF-04), shared by the list and the form. */
@Injectable()
export class AdminCitiesStore {
  private readonly repository = inject(CityAdminRepository);

  private readonly list = signal<ManagedCity[] | null>(null);
  private readonly failure = signal<string | null>(null);
  private readonly pending = signal(false);

  readonly error = this.failure.asReadonly();
  readonly loading = this.pending.asReadonly();
  /** `null` until the catalogue arrives. */
  readonly groups = computed<CityGroup[] | null>(() => {
    const cities = this.list();
    return cities === null ? null : groupCities(cities);
  });
  /** The cities a zone can belong to. */
  readonly parentOptions = computed(() =>
    (this.list() ?? []).filter((city) => city.type === 'city'),
  );

  private readonly names = computed(
    () => new Map((this.list() ?? []).map((city) => [city.id, city.name])),
  );

  cityName(cityId: string): string {
    return this.names().get(cityId) ?? cityId;
  }

  /** Asks the API again; the current catalogue stays visible while it loads or if it fails. */
  async load(): Promise<void> {
    this.pending.set(true);
    this.failure.set(null);
    try {
      this.list.set(await this.repository.list());
    } catch (error) {
      this.failure.set(userMessage(error));
    } finally {
      this.pending.set(false);
    }
  }

  /** A city read fresh from the API, or `null` when it no longer exists. Throws if the API fails. */
  async find(cityId: string): Promise<ManagedCity | null> {
    const cities = await this.repository.list();
    this.list.set(cities);
    return cities.find((city) => city.id === cityId) ?? null;
  }

  /** Creates (`cityId` null) or updates a city or zone; its id and type never change. */
  async save(cityId: string | null, input: CityCreateInput): Promise<void> {
    if (cityId === null) {
      await this.repository.create(input);
      return;
    }
    await this.repository.update(cityId, {
      name: input.name,
      province: input.province,
      location: input.location,
      coverage: input.coverage,
      ...(input.parentCityId === undefined ? {} : { parentCityId: input.parentCityId }),
    });
  }

  async remove(cityId: string): Promise<void> {
    await this.repository.delete(cityId);
    this.list.update((cities) => cities?.filter((city) => city.id !== cityId) ?? null);
  }
}
