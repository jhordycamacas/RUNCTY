import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiClient } from '../../../core/api/api-client';
import { UserAdminRepository, UserPage, toManagedUser } from '../domain/managed-user';
import { UserDetail, toUserDetail } from '../domain/user-detail';

/** `GET /users` (the admin search, paged with a cursor) and `GET /users/{uid}`; both need `users.read`. */
@Injectable()
export class HttpUserAdminRepository extends UserAdminRepository {
  private readonly api = inject(ApiClient);

  async search(query: string, cursor: string | null): Promise<UserPage> {
    const text = query.trim();
    const { users, nextCursor } = await firstValueFrom(
      this.api.get<{ users?: unknown; nextCursor?: unknown }>('/users', {
        ...(text === '' ? {} : { q: text }),
        ...(cursor === null ? {} : { cursor }),
      }),
    );
    return {
      users: Array.isArray(users) ? users.map(toManagedUser) : [],
      nextCursor: typeof nextCursor === 'string' && nextCursor ? nextCursor : null,
    };
  }

  async get(uid: string): Promise<UserDetail> {
    return toUserDetail(await firstValueFrom(this.api.get<unknown>(`/users/${encodeURIComponent(uid)}`)));
  }
}
