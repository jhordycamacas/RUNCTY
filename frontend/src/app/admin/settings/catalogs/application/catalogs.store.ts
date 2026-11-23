import { Injectable, inject, signal } from '@angular/core';
import { CatalogId, CatalogItem, CatalogRepository } from '../../../../core/catalogs/catalog';
import { userMessage } from '../../../../core/errors/user-message';

/** The catalogs the admin edits, as the server has them. */
@Injectable()
export class CatalogsStore {
  private readonly repository = inject(CatalogRepository);
  private readonly stored = signal<Partial<Record<CatalogId, CatalogItem[]>>>({});
  private readonly failure = signal<string | null>(null);

  readonly error = this.failure.asReadonly();

  /** `null` until that catalog arrives. */
  items(id: CatalogId): CatalogItem[] | null {
    return this.stored()[id] ?? null;
  }

  async load(): Promise<void> {
    this.failure.set(null);
    try {
      const [sportLevels, sportGoals] = await Promise.all([
        this.repository.list('sportLevels'),
        this.repository.list('sportGoals'),
      ]);
      this.stored.set({ sportLevels, sportGoals });
    } catch (error) {
      this.failure.set(userMessage(error));
    }
  }

  /** Replaces one catalog; throws the translated error if the API rejects it. */
  async save(id: CatalogId, items: readonly CatalogItem[]): Promise<void> {
    const saved = await this.repository.save(id, items);
    this.stored.update((current) => ({ ...current, [id]: saved }));
  }
}
