import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { userMessage } from '../../core/errors/user-message';
import { RunnerCity } from '../../routes/application/runner-city';
import { RiskZoneAlert, RiskZoneAlertRepository } from '../domain/risk-zone-alert';

export type RiskZoneAlertsState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'no-city' }
  | { kind: 'ready'; alerts: RiskZoneAlert[] };

/** The risk-zone alerts in force in the runner's city (the «Alertas» tab). */
@Injectable({ providedIn: 'root' })
export class RiskZoneAlertsStore {
  private readonly city = inject(RunnerCity);
  private readonly repo = inject(RiskZoneAlertRepository);

  private readonly alerts = signal<RiskZoneAlert[] | null>(null);
  private readonly failure = signal<string | null>(null);

  readonly state = computed<RiskZoneAlertsState>(() => {
    const status = this.city.status();
    if (status === 'error') return { kind: 'error', message: this.city.error() ?? '' };
    if (status === 'no-city') return { kind: 'no-city' };
    const failure = this.failure();
    if (failure) return { kind: 'error', message: failure };
    const alerts = this.alerts();
    return status === 'ready' && alerts ? { kind: 'ready', alerts } : { kind: 'loading' };
  });

  constructor() {
    effect(() => {
      const cityId = this.city.cityId();
      if (cityId) untracked(() => void this.fetch(cityId));
    });
  }

  /** Loads the city when it is not known yet; the alerts follow it. */
  load(): Promise<unknown> {
    return this.city.load();
  }

  /** Retry after an error: asks the API again. */
  async reload(): Promise<void> {
    const cityId = this.city.cityId();
    if (cityId) await this.fetch(cityId);
    else await this.city.load();
  }

  private async fetch(cityId: string): Promise<void> {
    this.failure.set(null);
    this.alerts.set(null);
    try {
      this.alerts.set(await this.repo.listActive(cityId));
    } catch (error) {
      this.failure.set(userMessage(error));
    }
  }
}
