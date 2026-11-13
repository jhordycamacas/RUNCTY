import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiClient } from '../../core/api/api-client';
import { AccountRepository } from '../domain/profile';

/** `DELETE /users/me`: answers `recent-sign-in-required` (412) when the token is old. */
@Injectable()
export class HttpAccountRepository extends AccountRepository {
  private readonly api = inject(ApiClient);

  async delete(): Promise<void> {
    await firstValueFrom(this.api.delete('/users/me'));
  }
}
