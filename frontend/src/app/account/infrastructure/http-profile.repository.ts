import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { PersonalData } from '../../auth/domain/personal-data';
import { ApiClient } from '../../core/api/api-client';
import { Profile, ProfileRepository } from '../domain/profile';

/** `GET` and `PATCH /users/me`. */
@Injectable()
export class HttpProfileRepository extends ProfileRepository {
  private readonly api = inject(ApiClient);

  get(): Promise<Profile> {
    return firstValueFrom(this.api.get<Profile>('/users/me'));
  }

  update(data: PersonalData): Promise<Profile> {
    return firstValueFrom(this.api.patch<Profile>('/users/me', data));
  }
}
