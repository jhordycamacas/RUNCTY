import { SystemSettings } from '../../../core/settings/system-settings';

/** The answer of `PUT /settings`: every parameter and how many routes were recalculated. */
export interface SettingsSaved {
  settings: SystemSettings;
  recalculated: number;
}

export abstract class SettingsRepository {
  abstract load(): Promise<SystemSettings>;
  /** Sends only the changed parameters; the server keeps the rest. */
  abstract save(changes: Partial<SystemSettings>): Promise<SettingsSaved>;
  /** Resolves to how many routes got their index recalculated. */
  abstract recalculateRoutes(): Promise<number>;
}

/** "Se recalculó el índice de 3 rutas" (singular for one). */
export function recalculatedMessage(count: number): string {
  return `Se recalculó el índice de ${count} ${count === 1 ? 'ruta' : 'rutas'}`;
}
