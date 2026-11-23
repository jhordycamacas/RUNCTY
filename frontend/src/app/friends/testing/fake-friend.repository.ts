import {
  Friend,
  FriendRepository,
  PendingRequests,
  PublicProfile,
  SearchResult,
} from '../domain/friend';

export const profile = (uid: string, firstName = 'Ana', lastName = 'Paz'): PublicProfile => ({
  uid,
  firstName,
  lastName,
  cityId: 'loja',
});

/** Answers what the test puts in its fields and records every call; `failure` makes calls fail. */
export class FakeFriendRepository extends FriendRepository {
  friends: Friend[] = [];
  requests: PendingRequests = { incoming: [], outgoing: [] };
  results: SearchResult[] = [];
  failure: Error | null = null;
  readonly calls: string[] = [];

  private async answer<T>(call: string, value: T): Promise<T> {
    this.calls.push(call);
    if (this.failure) throw this.failure;
    return value;
  }

  list(): Promise<Friend[]> {
    return this.answer('list', this.friends);
  }

  remove(uid: string): Promise<void> {
    return this.answer(`remove:${uid}`, undefined);
  }

  pending(): Promise<PendingRequests> {
    return this.answer('pending', this.requests);
  }

  send(toUid: string): Promise<void> {
    return this.answer(`send:${toUid}`, undefined);
  }

  accept(requestId: string): Promise<void> {
    return this.answer(`accept:${requestId}`, undefined);
  }

  reject(requestId: string): Promise<void> {
    return this.answer(`reject:${requestId}`, undefined);
  }

  cancel(requestId: string): Promise<void> {
    return this.answer(`cancel:${requestId}`, undefined);
  }

  search(text: string): Promise<SearchResult[]> {
    return this.answer(`search:${text}`, this.results);
  }
}
