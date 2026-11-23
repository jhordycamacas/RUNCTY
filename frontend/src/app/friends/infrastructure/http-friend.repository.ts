import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiClient } from '../../core/api/api-client';
import {
  Friend,
  FriendRelation,
  FriendRepository,
  FriendRequest,
  PendingRequests,
  PublicProfile,
  SearchResult,
} from '../domain/friend';

const RELATIONS: readonly FriendRelation[] = ['none', 'friend', 'request-sent', 'request-received'];

type Raw = Record<string, unknown> | null | undefined;

const text = (value: unknown): string => (typeof value === 'string' ? value : '');
const list = (value: unknown): Raw[] => (Array.isArray(value) ? value : []);

function toProfile(raw: Raw): PublicProfile {
  return {
    uid: text(raw?.['uid']),
    firstName: text(raw?.['firstName']),
    lastName: text(raw?.['lastName']),
    cityId: text(raw?.['cityId']),
  };
}

function toRequest(raw: Raw): FriendRequest {
  return { id: text(raw?.['id']), profile: toProfile(raw?.['profile'] as Raw) };
}

function toRelation(value: unknown): FriendRelation {
  return RELATIONS.find((relation) => relation === value) ?? 'none';
}

const requestPath = (id: string) => `/friends/requests/${encodeURIComponent(id)}`;

/** `/friends`, `/friends/requests` and `/friends/search` of the Django API. */
@Injectable()
export class HttpFriendRepository extends FriendRepository {
  private readonly api = inject(ApiClient);

  async list(): Promise<Friend[]> {
    const { friends } = await firstValueFrom(this.api.get<{ friends: unknown }>('/friends'));
    return list(friends).map((raw) => ({
      profile: toProfile(raw?.['profile'] as Raw),
      since: text(raw?.['since']),
    }));
  }

  async remove(uid: string): Promise<void> {
    await firstValueFrom(this.api.delete(`/friends/${encodeURIComponent(uid)}`));
  }

  async pending(): Promise<PendingRequests> {
    const { incoming, outgoing } = await firstValueFrom(
      this.api.get<{ incoming: unknown; outgoing: unknown }>('/friends/requests'),
    );
    return { incoming: list(incoming).map(toRequest), outgoing: list(outgoing).map(toRequest) };
  }

  async send(toUid: string): Promise<void> {
    await firstValueFrom(this.api.post('/friends/requests', { toUid }));
  }

  async accept(requestId: string): Promise<void> {
    await firstValueFrom(this.api.post(`${requestPath(requestId)}/accept`));
  }

  async reject(requestId: string): Promise<void> {
    await firstValueFrom(this.api.post(`${requestPath(requestId)}/reject`));
  }

  async cancel(requestId: string): Promise<void> {
    await firstValueFrom(this.api.delete(requestPath(requestId)));
  }

  async search(query: string): Promise<SearchResult[]> {
    const { results } = await firstValueFrom(
      this.api.get<{ results: unknown }>('/friends/search', { q: query }),
    );
    return list(results).map((raw) => ({
      profile: toProfile(raw?.['profile'] as Raw),
      relation: toRelation(raw?.['relation']),
    }));
  }
}
