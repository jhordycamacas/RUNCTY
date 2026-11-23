import { Injectable, computed, inject, signal } from '@angular/core';
import { CatalogItem, CatalogRepository, catalogLabel } from '../../../core/catalogs/catalog';
import { userMessage } from '../../../core/errors/user-message';
import { Summary, SummaryRepository } from '../domain/summary';

/** The admin summary: loaded on demand, keeping the last figures when a refresh fails. */
@Injectable()
export class SummaryStore {
  private readonly repository = inject(SummaryRepository);
  private readonly catalogs = inject(CatalogRepository);

  private readonly data = signal<Summary | null>(null);
  private readonly failure = signal<string | null>(null);
  private readonly pending = signal(false);
  private readonly levelItems = signal<CatalogItem[]>([]);

  readonly summary = this.data.asReadonly();
  readonly error = this.failure.asReadonly();
  readonly loading = this.pending.asReadonly();
  /** Loaded, but the caller may see no block. */
  readonly isEmpty = computed(() => {
    const summary = this.data();
    return summary !== null && !summary.users && !summary.routes && !summary.cities;
  });

  /** The catalog label of a sport level code, inactive ones included; the raw code if unknown. */
  levelLabel(code: string): string {
    return catalogLabel(this.levelItems(), code);
  }

  async load(): Promise<void> {
    this.pending.set(true);
    this.failure.set(null);
    try {
      // Labels are a nicety: without the catalog the raw codes are shown, never an error.
      const levels = this.catalogs.list('sportLevels').catch(() => []);
      const summary = await this.repository.get();
      this.levelItems.set(await levels);
      this.data.set(summary);
    } catch (error) {
      this.failure.set(userMessage(error));
    } finally {
      this.pending.set(false);
    }
  }
}
