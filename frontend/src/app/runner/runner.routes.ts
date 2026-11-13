import { Routes } from '@angular/router';
import { unsavedChangesGuard } from '../shared/forms/unsaved-changes.guard';

export const RUNNER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./runner-shell').then((m) => m.RunnerShell),
    children: [
      { path: 'inicio', loadComponent: () => import('./home.page').then((m) => m.RunnerHomePage) },
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
