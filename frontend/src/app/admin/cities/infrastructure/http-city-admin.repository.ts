import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiClient } from '../../../core/api/api-client';
import {
  CityAdminRepository,
  CityCreateInput,
  CityInput,
  ManagedCity,
  toManagedCity,
} from '../domain/managed-city';

const cityPath = (cityId: string) => `/cities/${encodeURIComponent(cityId)}`;

/** The city endpoints (RF-04). Listing is public; the changes need `cities.manage`. */
@Injectable()
export class HttpCityAdminRepository extends CityAdminRepository {
  private readonly api = inject(ApiClient);

  async list(): Promise<ManagedCity[]> {
    const { cities } = await firstValueFrom(this.api.get<{ cities?: unknown }>('/cities'));
    return Array.isArray(cities) ? cities.map(toManagedCity) : [];
  }

  async create(input: CityCreateInput): Promise<void> {
    await firstValueFrom(this.api.post('/cities', input));
  }

  async update(cityId: string, input: CityInput): Promise<void> {
    await firstValueFrom(this.api.patch(cityPath(cityId), input));
  }

  async delete(cityId: string): Promise<void> {
    await firstValueFrom(this.api.delete(cityPath(cityId)));
  }
}
