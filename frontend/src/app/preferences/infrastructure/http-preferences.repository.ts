import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiClient } from '../../core/api/api-client';
import { ApiError } from '../../core/errors/api-error';
import { Preferences, PreferencesRepository, parsePreferences } from '../domain/preferences';

/** `GET`, `PUT` and `DELETE /users/me/preferences`. */
@Injectable()
export class HttpPreferencesRepository extends PreferencesRepository {
  private readonly api = inject(ApiClient);

  async get(): Promise<Preferences | null> {
    try {
      return parsePreferences(await firstValueFrom(this.api.get('/users/me/preferences')));
    } catch (error) {
      // Never saved any: the clients apply their defaults without writing them.
      if (error instanceof ApiError && error.reason === 'preferences-not-found') return null;
      throw error;
    }
  }

  async save(preferences: Preferences): Promise<Preferences> {
    return parsePreferences(
      await firstValueFrom(this.api.put('/users/me/preferences', preferences)),
    );
  }

  async remove(): Promise<void> {
    await firstValueFrom(this.api.delete('/users/me/preferences'));
  }
}
