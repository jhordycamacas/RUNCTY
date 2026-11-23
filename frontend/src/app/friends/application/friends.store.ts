import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { userMessage } from '../../core/errors/user-message';
import {
  Friend,
  FriendRepository,
  FriendRequest,
  MIN_SEARCH_CHARS,
  SearchResult,
} from '../domain/friend';

interface Snapshot {
  uid: string;
  friends: Friend[];
  incoming: FriendRequest[];
  outgoing: FriendRequest[];
}

/**
 * The friends, the pending requests and the name search of the signed-in user. Every action
 * reloads what it changed (no optimistic updates). What was loaded for another user is never
 * shown. Failures are kept as Spanish text in `error`.
 */
@Injectable({ providedIn: 'root' })
export class FriendsStore {
  private readonly repository = inject(FriendRepository);
  private readonly auth = inject(AuthService);

  private readonly snapshot = signal<Snapshot | null>(null);
  private readonly found = signal<SearchResult[]>([]);
  private readonly lastSearch = signal('');
  private readonly reading = signal(false);
  private readonly looking = signal(false);
  private readonly writing = signal(false);
  private readonly failure = signal<string | null>(null);
  /** Identifies the latest search, so a slow answer to an older one is dropped. */
  private ticket = 0;

  private readonly current = computed(() => {
    const snapshot = this.snapshot();
    return snapshot && snapshot.uid === this.auth.session()?.uid ? snapshot : null;
  });

  readonly friends = computed(() => this.current()?.friends ?? []);
  readonly incoming = computed(() => this.current()?.incoming ?? []);
  readonly outgoing = computed(() => this.current()?.outgoing ?? []);
  /** Results of the last search that ran. */
  readonly results = this.found.asReadonly();
  /** The text the `results` answer; empty before any search ran. */
  readonly searchedText = this.lastSearch.asReadonly();
  readonly loading = this.reading.asReadonly();
  readonly searching = this.looking.asReadonly();
  /** An action (send, accept, reject, cancel, remove) is running. */
  readonly working = this.writing.asReadonly();
  readonly error = this.failure.asReadonly();

  /** Loads the friends and both lists of pending requests. */
  async load(): Promise<void> {
    this.reading.set(true);
    this.failure.set(null);
    await this.fetch();
    this.reading.set(false);
  }

  /** Searches accounts by name; text shorter than the minimum clears the results instead. */
  async search(text: string): Promise<void> {
    const trimmed = text.trim();
    const ticket = ++this.ticket;
    if (trimmed.length < MIN_SEARCH_CHARS) {
      this.clearSearch();
      return;
    }
    this.looking.set(true);
    this.failure.set(null);
    try {
      const results = await this.repository.search(trimmed);
      if (ticket !== this.ticket) return;
      this.found.set(results);
      this.lastSearch.set(trimmed);
    } catch (error) {
      if (ticket === this.ticket) this.failure.set(userMessage(error));
    } finally {
      if (ticket === this.ticket) this.looking.set(false);
    }
  }

  clearSearch(): void {
    this.ticket++;
    this.found.set([]);
    this.lastSearch.set('');
    this.looking.set(false);
  }

  send(uid: string): Promise<boolean> {
    return this.act(() => this.repository.send(uid));
  }

  accept(requestId: string): Promise<boolean> {
    return this.act(() => this.repository.accept(requestId));
  }

  reject(requestId: string): Promise<boolean> {
    return this.act(() => this.repository.reject(requestId));
  }

  cancel(requestId: string): Promise<boolean> {
    return this.act(() => this.repository.cancel(requestId));
  }

  remove(uid: string): Promise<boolean> {
    return this.act(() => this.repository.remove(uid));
  }

  /** Runs a change, then reloads the lists and the last search. Resolves to whether it worked. */
  private async act(change: () => Promise<void>): Promise<boolean> {
    this.writing.set(true);
    this.failure.set(null);
    try {
      await change();
    } catch (error) {
      this.failure.set(userMessage(error));
      return false;
    } finally {
      this.writing.set(false);
    }
    await this.fetch();
    const text = this.lastSearch();
    if (text) await this.search(text);
    return true;
  }

  private async fetch(): Promise<void> {
    const uid = this.auth.session()?.uid;
    try {
      const [friends, pending] = await Promise.all([
        this.repository.list(),
        this.repository.pending(),
      ]);
      this.snapshot.set(uid ? { uid, friends, ...pending } : null);
    } catch (error) {
      this.failure.set(userMessage(error));
    }
  }
}
