import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiClient } from '../../core/api/api-client';
import { ApiError } from '../../core/errors/api-error';
import { SportProfile, SportProfileRepository } from '../domain/sport-profile';

/** `GET`, `PUT` and `DELETE /users/me/sport-profile`. */
@Injectable()
export class HttpSportProfileRepository extends SportProfileRepository {
  private readonly api = inject(ApiClient);

  async get(): Promise<SportProfile | null> {
    try {
      return await firstValueFrom(this.api.get<SportProfile>('/users/me/sport-profile'));
    } catch (error) {
      // No profile yet is a normal state, not a failure.
      if (error instanceof ApiError && error.reason === 'sport-profile-not-found') return null;
      throw error;
    }
  }

  save(profile: SportProfile): Promise<SportProfile> {
    return firstValueFrom(this.api.put<SportProfile>('/users/me/sport-profile', profile));
  }

  async remove(): Promise<void> {
    await firstValueFrom(this.api.delete('/users/me/sport-profile'));
  }
}
