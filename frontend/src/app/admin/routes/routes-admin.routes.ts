import { Routes } from '@angular/router';
import { unsavedChangesGuard } from '../../shared/forms/unsaved-changes.guard';
import { AdminRoutesStore } from './application/admin-routes.store';
import { RouteAdminRepository } from './domain/managed-route';
import { HttpRouteAdminRepository } from './infrastructure/http-route-admin.repository';

/** The `rutas` admin section (RF-05, RF-07). Its providers live only in this lazy bundle. */
export const ROUTES_ADMIN_ROUTES: Routes = [
  {
    path: '',
    providers: [
      { provide: RouteAdminRepository, useClass: HttpRouteAdminRepository },
      AdminRoutesStore,
    ],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./presentation/routes-admin.page').then((m) => m.RoutesAdminPage),
      },
      {
        path: 'nueva',
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () => import('./presentation/route-form.page').then((m) => m.RouteFormPage),
      },
      {
        path: ':id/editar',
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () => import('./presentation/route-form.page').then((m) => m.RouteFormPage),
      },
    ],
  },
];
