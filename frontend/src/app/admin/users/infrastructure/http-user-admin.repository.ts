import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiClient } from '../../../core/api/api-client';
import { UserAdminRepository, UserPage, toManagedUser } from '../domain/managed-user';
import { PersonalData } from '../../../auth/domain/personal-data';
import { SportProfile } from '../../../sport-profile/domain/sport-profile';
import {
  UserDetail,
  UserProfile,
  UserSportProfile,
  toSportProfile,
  toUserDetail,
  toUserProfile,
} from '../domain/user-detail';

const userPath = (uid: string): string => `/users/${encodeURIComponent(uid)}`;

/** `GET /users` (the admin search, paged with a cursor) and `GET /users/{uid}` (both need `users.read`), and
 * the edits and the deletion of one user (`users.manage`). */
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
    return toUserDetail(await firstValueFrom(this.api.get<unknown>(userPath(uid))));
  }

  async updatePersonalData(uid: string, data: PersonalData): Promise<UserProfile> {
    const body = await firstValueFrom(this.api.patch<{ user?: unknown }>(userPath(uid), data));
    return toUserProfile(body.user);
  }

  async saveSportProfile(uid: string, profile: SportProfile): Promise<UserSportProfile> {
    const body = await firstValueFrom(
      this.api.put<{ sportProfile?: unknown }>(`${userPath(uid)}/sport-profile`, profile),
    );
    return toSportProfile(body.sportProfile) ?? { ...profile };
  }

  async clearSportProfile(uid: string): Promise<void> {
    await firstValueFrom(this.api.delete(`${userPath(uid)}/sport-profile`));
  }

  async remove(uid: string): Promise<void> {
    await firstValueFrom(this.api.delete(userPath(uid)));
  }
}
