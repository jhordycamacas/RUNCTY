import { Injectable, inject, signal } from '@angular/core';
import { ApiError } from '../../../core/errors/api-error';
import { userMessage } from '../../../core/errors/user-message';
import { UserAdminRepository } from '../domain/managed-user';
import { UserDetail } from '../domain/user-detail';

/** The user the admin detail page shows. Provided by the users routes, so it lives with the section. */
@Injectable()
export class UserDetailStore {
  private readonly repository = inject(UserAdminRepository);

  private readonly current = signal<UserDetail | null>(null);
  private readonly failure = signal<string | null>(null);
  private readonly missing = signal(false);
  private readonly pending = signal(false);
  private uid: string | null = null;
  /** Only the answer of the latest request is kept. */
  private request = 0;

  /** `null` until the user arrives. */
  readonly detail = this.current.asReadonly();
  readonly error = this.failure.asReadonly();
  /** The API says the user does not exist. */
  readonly notFound = this.missing.asReadonly();
  readonly loading = this.pending.asReadonly();

  async load(uid: string): Promise<void> {
    if (uid !== this.uid) this.current.set(null);
    this.uid = uid;
    const request = ++this.request;
    this.pending.set(true);
    this.failure.set(null);
    this.missing.set(false);
    try {
      const detail = await this.repository.get(uid);
      if (request === this.request) this.current.set(detail);
    } catch (error) {
      if (request !== this.request) return;
      if (error instanceof ApiError && (error.status === 404 || error.reason === 'user-not-found')) {
        this.current.set(null);
        this.missing.set(true);
      } else {
        this.failure.set(userMessage(error));
      }
    } finally {
      if (request === this.request) this.pending.set(false);
    }
  }

  reload(): Promise<void> {
    return this.uid === null ? Promise.resolve() : this.load(this.uid);
  }
}
