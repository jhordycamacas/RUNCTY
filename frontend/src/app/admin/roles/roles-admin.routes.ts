import { Routes } from '@angular/router';
import { unsavedChangesGuard } from '../../shared/forms/unsaved-changes.guard';
import { AdminRolesStore } from './application/admin-roles.store';
import { RoleAdminRepository } from './domain/role';
import { HttpRoleAdminRepository } from './infrastructure/http-role-admin.repository';

/** The `roles` admin section (RF-02). Its providers live only in this lazy bundle. */
export const ROLES_ADMIN_ROUTES: Routes = [
  {
    path: '',
    providers: [
      { provide: RoleAdminRepository, useClass: HttpRoleAdminRepository },
      AdminRolesStore,
    ],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./presentation/roles-admin.page').then((m) => m.RolesAdminPage),
      },
      {
        path: 'nuevo',
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () => import('./presentation/role-form.page').then((m) => m.RoleFormPage),
      },
      {
        path: ':id/editar',
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () => import('./presentation/role-form.page').then((m) => m.RoleFormPage),
      },
    ],
  },
];
