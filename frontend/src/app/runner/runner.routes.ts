import { Routes } from '@angular/router';

export const RUNNER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./runner-shell').then((m) => m.RunnerShell),
    children: [
      { path: 'inicio', loadComponent: () => import('./home.page').then((m) => m.RunnerHomePage) },
      { path: 'cuenta', loadComponent: () => import('./account.page').then((m) => m.RunnerAccountPage) },
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
    ],
  },
];
