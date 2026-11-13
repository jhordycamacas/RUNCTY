import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiClient } from '../../core/api/api-client';
import { CityRecord, CityRepository } from '../domain/city';

/** `GET /cities`: public catalogue, no token needed. */
@Injectable()
export class HttpCityRepository extends CityRepository {
  private readonly api = inject(ApiClient);

  async list(): Promise<CityRecord[]> {
    const { cities } = await firstValueFrom(this.api.get<{ cities: CityRecord[] }>('/cities'));
    return cities;
  }
}
