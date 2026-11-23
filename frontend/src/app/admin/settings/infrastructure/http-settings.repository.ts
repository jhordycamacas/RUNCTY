import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiClient } from '../../../core/api/api-client';
import {
  SettingsRepository,
  SettingsSaved,
  SystemSettings,
  toSystemSettings,
} from '../domain/system-settings';

const count = (value: unknown): number => (typeof value === 'number' ? value : 0);

/** The settings endpoints. Reading needs a session; saving and recalculating need `settings.manage`. */
@Injectable()
export class HttpSettingsRepository extends SettingsRepository {
  private readonly api = inject(ApiClient);

  async load(): Promise<SystemSettings> {
    const { settings } = await firstValueFrom(this.api.get<{ settings?: unknown }>('/settings'));
    return toSystemSettings(settings);
  }

  async save(changes: Partial<SystemSettings>): Promise<SettingsSaved> {
    const body = await firstValueFrom(
      this.api.put<{ settings?: unknown; recalculated?: unknown }>('/settings', changes),
    );
    return { settings: toSystemSettings(body.settings), recalculated: count(body.recalculated) };
  }

  async recalculateRoutes(): Promise<number> {
    const body = await firstValueFrom(
      this.api.post<{ recalculated?: unknown }>('/admin/recalculate-routes', {}),
    );
    return count(body.recalculated);
  }
}
