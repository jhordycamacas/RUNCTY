import { Routes } from '@angular/router';
import { unsavedChangesGuard } from '../../shared/forms/unsaved-changes.guard';
import { AdminCitiesStore } from './application/admin-cities.store';
import { CityAdminRepository } from './domain/managed-city';
import { HttpCityAdminRepository } from './infrastructure/http-city-admin.repository';

/** The `ciudades` admin section (RF-04). Its providers live only in this lazy bundle. */
export const CITIES_ADMIN_ROUTES: Routes = [
  {
    path: '',
    providers: [{ provide: CityAdminRepository, useClass: HttpCityAdminRepository }, AdminCitiesStore],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./presentation/cities-admin.page').then((m) => m.CitiesAdminPage),
      },
      {
        path: 'nueva',
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () => import('./presentation/city-form.page').then((m) => m.CityFormPage),
      },
      {
        path: ':id/editar',
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () => import('./presentation/city-form.page').then((m) => m.CityFormPage),
      },
    ],
  },
];
