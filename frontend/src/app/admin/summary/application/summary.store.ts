import { Injectable, computed, inject, signal } from '@angular/core';
import { userMessage } from '../../../core/errors/user-message';
import { Summary, SummaryRepository } from '../domain/summary';

/** The admin summary: loaded on demand, keeping the last figures when a refresh fails. */
@Injectable()
export class SummaryStore {
  private readonly repository = inject(SummaryRepository);

  private readonly data = signal<Summary | null>(null);
  private readonly failure = signal<string | null>(null);
  private readonly pending = signal(false);

  readonly summary = this.data.asReadonly();
  readonly error = this.failure.asReadonly();
  readonly loading = this.pending.asReadonly();
  /** Loaded, but the caller may see no block. */
  readonly isEmpty = computed(() => {
    const summary = this.data();
    return summary !== null && !summary.users && !summary.routes && !summary.cities;
  });

  async load(): Promise<void> {
    this.pending.set(true);
    this.failure.set(null);
    try {
      this.data.set(await this.repository.get());
    } catch (error) {
      this.failure.set(userMessage(error));
    } finally {
      this.pending.set(false);
    }
  }
}
