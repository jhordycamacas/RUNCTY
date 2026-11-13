import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiClient } from '../../core/api/api-client';
import { NewUserProfile, UsersRepository } from '../domain/ports';

/** `POST /users`: the sign-up of the caller's own profile (LOPDP consent is explicit in the body). */
@Injectable()
export class HttpUsersRepository extends UsersRepository {
  private readonly api = inject(ApiClient);

  async create(profile: NewUserProfile): Promise<void> {
    await firstValueFrom(this.api.post('/users', { ...profile, consent: { lopdp: true } }));
  }
}
