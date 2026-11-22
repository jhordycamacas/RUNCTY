import { Routes } from '@angular/router';
import { unsavedChangesGuard } from '../shared/forms/unsaved-changes.guard';

export const RUNNER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./runner-shell').then((m) => m.RunnerShell),
    children: [
      { path: 'inicio', loadComponent: () => import('./home.page').then((m) => m.RunnerHomePage) },
      {
        path: 'rutas',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('../routes/presentation/routes-list.page').then((m) => m.RoutesListPage),
          },
          {
            path: ':id',
            loadComponent: () =>
              import('../routes/presentation/route-detail.page').then((m) => m.RouteDetailPage),
          },
        ],
      },
      {
        path: 'correr',
        loadComponent: () => import('../run/presentation/run.page').then((m) => m.RunPage),
      },
      {
        path: 'clubes',
        loadComponent: () => import('../clubs/presentation/clubs.page').then((m) => m.ClubsPage),
      },
      {
        path: 'alertas',
        loadComponent: () =>
          import('../alerts/presentation/alerts.page').then((m) => m.AlertsPage),
      },
      {
        path: 'cuenta',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('../account/presentation/profile-home.page').then((m) => m.ProfileHomePage),
          },
          {
            path: 'datos',
            canDeactivate: [unsavedChangesGuard],
            loadComponent: () =>
              import('../account/presentation/edit-personal-data.page').then(
                (m) => m.EditPersonalDataPage,
              ),
          },
          {
            path: 'deportivo',
            canDeactivate: [unsavedChangesGuard],
            loadComponent: () =>
              import('../sport-profile/presentation/sport-profile.page').then(
                (m) => m.SportProfilePage,
              ),
          },
          {
            path: 'preferencias',
            canDeactivate: [unsavedChangesGuard],
            loadComponent: () =>
              import('../preferences/presentation/preferences.page').then((m) => m.PreferencesPage),
          },
          {
            path: 'eliminar',
            loadComponent: () =>
              import('../account/presentation/delete-account.page').then(
                (m) => m.DeleteAccountPage,
              ),
          },
          {
            path: 'contrasena',
            loadComponent: () =>
              import('../account/presentation/change-password.page').then(
                (m) => m.ChangePasswordPage,
              ),
          },
        ],
      },
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
    ],
  },
];
