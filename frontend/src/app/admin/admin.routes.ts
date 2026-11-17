import { Route, Routes } from '@angular/router';
import { permissionGuard } from '../core/guards/auth.guards';
import { adminLandingGuard } from './admin-landing.guard';
import { ADMIN_SECTIONS } from './admin-sections';

/** The screens of the sections that are built; the rest show the placeholder. */
const SECTION_SCREENS: Partial<Record<string, Pick<Route, 'loadChildren'>>> = {
  roles: {
    loadChildren: () => import('./roles/roles-admin.routes').then((m) => m.ROLES_ADMIN_ROUTES),
  },
  rutas: {
    loadChildren: () => import('./routes/routes-admin.routes').then((m) => m.ROUTES_ADMIN_ROUTES),
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
        ...(SECTION_SCREENS[section.path] ?? {
          loadComponent: () =>
            import('./section-placeholder.page').then((m) => m.SectionPlaceholderPage),
        }),
      })),
    ],
  },
];
