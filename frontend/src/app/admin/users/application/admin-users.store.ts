import { Injectable, computed, inject, signal } from '@angular/core';
import { ApiError } from '../../../core/errors/api-error';
import { userMessage } from '../../../core/errors/user-message';
import { ManagedUser, UserAdminRepository } from '../domain/managed-user';

/** The admin user search (RF-01-2): the search text, the pages read so far and the cursor of the next. */
@Injectable()
export class AdminUsersStore {
  private readonly repository = inject(UserAdminRepository);

  private readonly list = signal<ManagedUser[] | null>(null);
  private readonly cursor = signal<string | null>(null);
  private readonly failure = signal<string | null>(null);
  private readonly pending = signal(false);
  private readonly pendingMore = signal(false);
  private query = '';
  /** Only the answer of the latest search is kept. */
  private request = 0;

  /** `null` until the first page arrives. */
  readonly users = this.list.asReadonly();
  readonly error = this.failure.asReadonly();
  readonly loading = this.pending.asReadonly();
  readonly loadingMore = this.pendingMore.asReadonly();
  readonly hasMore = computed(() => this.cursor() !== null);

  /** A new search: it starts over from the first page. */
  search(query: string): Promise<void> {
    this.query = query.trim();
    return this.reload();
  }

  /** Reads the first page of the current search; the list on screen stays while it loads. */
  async reload(): Promise<void> {
    const request = ++this.request;
    this.pending.set(true);
    this.failure.set(null);
    try {
      const page = await this.repository.search(this.query, null);
      if (request !== this.request) return;
      this.list.set(page.users);
      this.cursor.set(page.nextCursor);
    } catch (error) {
      if (request === this.request) this.failure.set(userMessage(error));
    } finally {
      if (request === this.request) this.pending.set(false);
    }
  }

  /** Appends the next page. A rejected cursor is dropped: the user has to search again. */
  async loadMore(): Promise<void> {
    const cursor = this.cursor();
    if (cursor === null || this.pendingMore()) return;
    const request = this.request;
    this.pendingMore.set(true);
    this.failure.set(null);
    try {
      const page = await this.repository.search(this.query, cursor);
      if (request !== this.request) return;
      this.list.update((users) => [...(users ?? []), ...page.users]);
      this.cursor.set(page.nextCursor);
    } catch (error) {
      if (request !== this.request) return;
      this.failure.set(userMessage(error));
      if (error instanceof ApiError && error.reason === 'invalid-cursor') this.cursor.set(null);
    } finally {
      this.pendingMore.set(false);
    }
  }

  /** Reflects a role assignment in the list without asking the API again. */
  setRole(uid: string, roleId: string): void {
    this.list.update(
      (users) => users?.map((user) => (user.uid === uid ? { ...user, role: roleId } : user)) ?? null,
    );
  }
}
