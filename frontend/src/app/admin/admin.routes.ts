import { Route, Routes } from '@angular/router';
import { permissionGuard } from '../core/guards/auth.guards';
import { adminLandingGuard } from './admin-landing.guard';
import { ADMIN_SECTIONS } from './admin-sections';

/** The lazy screens of every admin section, by path. */
const SECTION_SCREENS: Record<string, Pick<Route, 'loadChildren'>> = {
  resumen: {
    loadChildren: () => import('./summary/summary-admin.routes').then((m) => m.SUMMARY_ADMIN_ROUTES),
  },
  usuarios: {
    loadChildren: () => import('./users/users-admin.routes').then((m) => m.USERS_ADMIN_ROUTES),
  },
  ciudades: {
    loadChildren: () =>
      import('./cities/cities-admin.routes').then((m) => m.CITIES_ADMIN_ROUTES),
  },
  roles: {
    loadChildren: () => import('./roles/roles-admin.routes').then((m) => m.ROLES_ADMIN_ROUTES),
  },
  rutas: {
    loadChildren: () => import('./routes/routes-admin.routes').then((m) => m.ROUTES_ADMIN_ROUTES),
  },
  configuracion: {
    loadChildren: () =>
      import('./settings/settings-admin.routes').then((m) => m.SETTINGS_ADMIN_ROUTES),
  },
};

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./admin-shell').then((m) => m.AdminShell),
    children: [
      {
        path: '',
        pathMatch: 'full',
        canActivate: [adminLandingGuard],
        loadComponent: () => import('./no-sections.page').then((m) => m.NoSectionsPage),
      },
      ...ADMIN_SECTIONS.map((section): Route => ({
        path: section.path,
        canActivate: [permissionGuard(section.permission)],
        data: { title: section.label },
        ...SECTION_SCREENS[section.path],
      })),
    ],
  },
];
