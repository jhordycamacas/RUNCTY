import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiClient } from '../../../core/api/api-client';
import { Role, RoleAdminRepository, RoleCreateInput, RoleInput, toRole } from '../domain/role';

const encode = encodeURIComponent;

/**
 * The role endpoints for `roles.manage` (RF-02). Listing only needs `admin.access`; a role update
 * answers how many users got their claims re-issued.
 */
@Injectable()
export class HttpRoleAdminRepository extends RoleAdminRepository {
  private readonly api = inject(ApiClient);

  async list(): Promise<Role[]> {
    const { roles } = await firstValueFrom(this.api.get<{ roles?: unknown }>('/roles'));
    return Array.isArray(roles) ? roles.map(toRole) : [];
  }

  async create(input: RoleCreateInput): Promise<void> {
    await firstValueFrom(this.api.post('/roles', input));
  }

  async update(roleId: string, input: RoleInput): Promise<number> {
    const { syncedUsers } = await firstValueFrom(
      this.api.put<{ syncedUsers?: number }>(`/roles/${encode(roleId)}`, input),
    );
    return syncedUsers ?? 0;
  }

  async delete(roleId: string): Promise<void> {
    await firstValueFrom(this.api.delete(`/roles/${encode(roleId)}`));
  }

  async setUserRole(uid: string, roleId: string): Promise<void> {
    await firstValueFrom(this.api.put(`/users/${encode(uid)}/role`, { roleId }));
  }
}
