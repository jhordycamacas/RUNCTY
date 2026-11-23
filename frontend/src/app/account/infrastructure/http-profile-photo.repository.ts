import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiClient } from '../../core/api/api-client';
import { ProfilePhotoRepository } from '../domain/profile-photo';

/** `GET`, `PUT` and `DELETE /users/me/photo`. */
@Injectable()
export class HttpProfilePhotoRepository extends ProfilePhotoRepository {
  private readonly api = inject(ApiClient);

  async get(): Promise<string | null> {
    return (await firstValueFrom(this.api.get<{ photo: string | null }>('/users/me/photo'))).photo;
  }

  async save(photo: string): Promise<string> {
    const body = await firstValueFrom(this.api.put<{ photo: string }>('/users/me/photo', { photo }));
    return body.photo;
  }

  async remove(): Promise<void> {
    await firstValueFrom(this.api.delete<void>('/users/me/photo'));
  }
}
