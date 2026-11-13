import { Routes } from '@angular/router';
import { guestGuard, homeGuard, permissionGuard, sessionGuard } from './core/guards/auth.guards';

export const routes: Routes = [
  { path: '', pathMatch: 'full', canActivate: [homeGuard], children: [] },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./auth/presentation/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'registro',
    canActivate: [guestGuard],
    loadComponent: () => import('./auth/presentation/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'recuperar',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./auth/presentation/forgot-password.page').then((m) => m.ForgotPasswordPage),
  },
  // The two areas are independent lazy bundles; `canMatch` keeps them from downloading for
  // someone who cannot use them.
  {
    path: 'app',
    canMatch: [sessionGuard],
    loadChildren: () => import('./runner/runner.routes').then((m) => m.RUNNER_ROUTES),
  },
  {
    path: 'admin',
    canMatch: [permissionGuard('admin.access')],
    loadChildren: () => import('./admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  {
    path: '403',
    loadComponent: () => import('./shared/pages/forbidden.page').then((m) => m.ForbiddenPage),
  },
  {
    path: '**',
    loadComponent: () => import('./shared/pages/not-found.page').then((m) => m.NotFoundPage),
  },
];
