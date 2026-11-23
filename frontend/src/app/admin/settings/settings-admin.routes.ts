import { Routes } from '@angular/router';
import { unsavedChangesGuard } from '../../shared/forms/unsaved-changes.guard';
import { SettingsStore } from './application/settings.store';
import { SettingsRepository } from './domain/system-settings';
import { HttpSettingsRepository } from './infrastructure/http-settings.repository';

/** The `configuracion` admin section (system parameters). Its providers live only in this lazy bundle. */
export const SETTINGS_ADMIN_ROUTES: Routes = [
  {
    path: '',
    providers: [{ provide: SettingsRepository, useClass: HttpSettingsRepository }, SettingsStore],
    canDeactivate: [unsavedChangesGuard],
    loadComponent: () => import('./presentation/settings.page').then((m) => m.SettingsPage),
  },
];
