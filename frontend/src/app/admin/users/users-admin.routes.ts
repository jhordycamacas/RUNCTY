import { Routes } from '@angular/router';
import { AdminRolesStore } from '../roles/application/admin-roles.store';
import { RoleAdminRepository } from '../roles/domain/role';
import { HttpRoleAdminRepository } from '../roles/infrastructure/http-role-admin.repository';
import { AdminUsersStore } from './application/admin-users.store';
import { UserAdminRepository } from './domain/managed-user';
import { HttpUserAdminRepository } from './infrastructure/http-user-admin.repository';

/** The `usuarios` admin section (RF-01-2, RF-02-3): the user search and the role assignment. */
export const USERS_ADMIN_ROUTES: Routes = [
  {
    path: '',
    providers: [
      { provide: UserAdminRepository, useClass: HttpUserAdminRepository },
      { provide: RoleAdminRepository, useClass: HttpRoleAdminRepository },
      AdminUsersStore,
      AdminRolesStore,
    ],
    loadComponent: () =>
      import('./presentation/users-admin.page').then((m) => m.UsersAdminPage),
  },
];
