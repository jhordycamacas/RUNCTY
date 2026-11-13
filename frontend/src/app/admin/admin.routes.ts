import { Routes } from '@angular/router';
import { permissionGuard } from '../core/guards/auth.guards';
import { adminLandingGuard } from './admin-landing.guard';
import { ADMIN_SECTIONS } from './admin-sections';

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
      ...ADMIN_SECTIONS.map((section) => ({
        path: section.path,
        canActivate: [permissionGuard(section.permission)],
        data: { title: section.label },
        loadComponent: () => import('./section-placeholder.page').then((m) => m.SectionPlaceholderPage),
      })),
    ],
  },
];
