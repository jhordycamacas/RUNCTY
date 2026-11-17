import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiClient } from '../../../core/api/api-client';
import {
  UserAdminRepository,
  UserFilters,
  UserPage,
  toManagedUser,
} from '../domain/managed-user';

/** `GET /users`: the admin search (`users.read`), paged with a cursor. */
@Injectable()
export class HttpUserAdminRepository extends UserAdminRepository {
  private readonly api = inject(ApiClient);

  async search(filters: UserFilters, cursor: string | null): Promise<UserPage> {
    const { users, nextCursor } = await firstValueFrom(
      this.api.get<{ users?: unknown; nextCursor?: unknown }>('/users', {
        ...filters,
        ...(cursor === null ? {} : { cursor }),
      }),
    );
    return {
      users: Array.isArray(users) ? users.map(toManagedUser) : [],
      nextCursor: typeof nextCursor === 'string' && nextCursor ? nextCursor : null,
    };
  }
}
