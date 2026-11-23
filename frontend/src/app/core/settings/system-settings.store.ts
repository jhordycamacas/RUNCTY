import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiClient } from '../api/api-client';
import { DEFAULT_SETTINGS, SystemSettings, toSystemSettings } from './system-settings';

/**
 * The system parameters any signed-in user may read (ranges the forms validate against). They
 * start as the defaults and stay so when the call fails: the server validates again anyway.
 */
@Injectable({ providedIn: 'root' })
export class SystemSettingsStore {
  private readonly api = inject(ApiClient);
  private readonly current = signal<SystemSettings>({ ...DEFAULT_SETTINGS });

  readonly settings = this.current.asReadonly();

  async load(): Promise<void> {
    try {
      const body = await firstValueFrom(this.api.get<{ settings?: unknown }>('/settings'));
      this.current.set(toSystemSettings(body.settings));
    } catch {
      this.current.set({ ...DEFAULT_SETTINGS });
    }
  }
}
