import { Injectable, computed, inject, signal } from '@angular/core';
import { CatalogItem, CatalogRepository, activeItems, catalogLabel } from '../../core/catalogs/catalog';
import { userMessage } from '../../core/errors/user-message';
import { SystemSettingsStore } from '../../core/settings/system-settings.store';
import { sportProfileRules } from '../domain/sport-profile';

/**
 * What the sport profile form chooses from: the options the admin keeps active and the ranges set in
 * the system parameters. Inactive options stay known so a stored code can still be labelled.
 */
@Injectable({ providedIn: 'root' })
export class SportOptionsStore {
  private readonly catalogs = inject(CatalogRepository);
  private readonly systemSettings = inject(SystemSettingsStore);

  private readonly levelItems = signal<CatalogItem[] | null>(null);
  private readonly goalItems = signal<CatalogItem[] | null>(null);
  private readonly failure = signal<string | null>(null);

  readonly levels = computed(() => activeItems(this.levelItems() ?? []));
  readonly goals = computed(() => activeItems(this.goalItems() ?? []));
  readonly ready = computed(() => this.levelItems() !== null && this.goalItems() !== null);
  readonly error = this.failure.asReadonly();
  readonly rules = computed(() =>
    sportProfileRules(this.levelItems() ?? [], this.goalItems() ?? [], this.systemSettings.settings()),
  );

  async load(): Promise<void> {
    this.failure.set(null);
    try {
      const [levels, goals] = await Promise.all([
        this.catalogs.list('sportLevels'),
        this.catalogs.list('sportGoals'),
        this.systemSettings.load(),
      ]);
      this.levelItems.set(levels);
      this.goalItems.set(goals);
    } catch (error) {
      this.failure.set(userMessage(error));
    }
  }

  levelLabel(code: string): string {
    return catalogLabel(this.levelItems() ?? [], code);
  }

  goalLabel(code: string): string {
    return catalogLabel(this.goalItems() ?? [], code);
  }
}
