import { Injectable, inject, signal } from '@angular/core';
import { userMessage } from '../../../core/errors/user-message';
import { SettingsRepository, SystemSettings } from '../domain/system-settings';

/** The system parameters as the server has them, shared by the page and its actions. */
@Injectable()
export class SettingsStore {
  private readonly repository = inject(SettingsRepository);

  private readonly current = signal<SystemSettings | null>(null);
  private readonly failure = signal<string | null>(null);

  /** `null` until the parameters arrive. */
  readonly settings = this.current.asReadonly();
  readonly error = this.failure.asReadonly();

  async load(): Promise<void> {
    this.failure.set(null);
    try {
      this.current.set(await this.repository.load());
    } catch (error) {
      this.failure.set(userMessage(error));
    }
  }

  /** Saves the changed parameters. Resolves to how many routes were recalculated; throws if rejected. */
  async save(changes: Partial<SystemSettings>): Promise<number> {
    const saved = await this.repository.save(changes);
    this.current.set(saved.settings);
    return saved.recalculated;
  }

  /** Recalculates every route with the saved parameters. Resolves to how many. */
  recalculate(): Promise<number> {
    return this.repository.recalculateRoutes();
  }
}
