import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiClient } from '../api/api-client';
import { CatalogId, CatalogItem, CatalogRepository, toCatalogItems } from './catalog';

/** `GET` and `PUT /catalogs/<id>`. Reading needs a session; saving needs `settings.manage`. */
@Injectable()
export class HttpCatalogRepository extends CatalogRepository {
  private readonly api = inject(ApiClient);

  async list(id: CatalogId): Promise<CatalogItem[]> {
    return toCatalogItems(await firstValueFrom(this.api.get(`/catalogs/${id}`)));
  }

  async save(id: CatalogId, items: readonly CatalogItem[]): Promise<CatalogItem[]> {
    return toCatalogItems(await firstValueFrom(this.api.put(`/catalogs/${id}`, { items })));
  }
}
