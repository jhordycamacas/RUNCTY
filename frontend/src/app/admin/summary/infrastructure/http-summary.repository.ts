import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiClient } from '../../../core/api/api-client';
import { toSummary } from '../domain/mappers';
import { Summary, SummaryRepository } from '../domain/summary';

/** `GET /admin/summary`: aggregates only, each block by the caller's permissions. */
@Injectable()
export class HttpSummaryRepository extends SummaryRepository {
  private readonly api = inject(ApiClient);

  async get(): Promise<Summary> {
    return toSummary(await firstValueFrom(this.api.get<unknown>('/admin/summary')));
  }
}
