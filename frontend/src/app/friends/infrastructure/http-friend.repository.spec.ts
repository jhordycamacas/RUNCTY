import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiClient } from '../../core/api/api-client';
import { HttpFriendRepository } from './http-friend.repository';

const ANA = { uid: 'ana-1', firstName: 'Ana', lastName: 'Paz', cityId: 'loja' };

describe('HttpFriendRepository', () => {
  let api: Record<'get' | 'post' | 'delete', ReturnType<typeof vi.fn>>;
  let repository: HttpFriendRepository;

  beforeEach(() => {
    api = { get: vi.fn(), post: vi.fn().mockReturnValue(of(null)), delete: vi.fn().mockReturnValue(of(null)) };
    TestBed.configureTestingModule({
      providers: [HttpFriendRepository, { provide: ApiClient, useValue: api }],
    });
    repository = TestBed.inject(HttpFriendRepository);
  });

  it('lists the friends with their public profile', async () => {
    api.get.mockReturnValue(of({ friends: [{ profile: ANA, since: '2026-11-23T09:00:00' }] }));

    expect(await repository.list()).toEqual([{ profile: ANA, since: '2026-11-23T09:00:00' }]);
    expect(api.get).toHaveBeenCalledWith('/friends');
  });

  it('reads the pending requests of both directions', async () => {
    api.get.mockReturnValue(
      of({
        incoming: [{ id: 'r1', createdAt: '2026-11-23T09:00:00', profile: ANA }],
        outgoing: [{ id: 'r2', createdAt: '2026-11-23T09:00:00', profile: { ...ANA, uid: 'b' } }],
      }),
    );

    const pending = await repository.pending();

    expect(api.get).toHaveBeenCalledWith('/friends/requests');
    expect(pending.incoming).toEqual([{ id: 'r1', profile: ANA }]);
    expect(pending.outgoing[0]).toEqual({ id: 'r2', profile: { ...ANA, uid: 'b' } });
  });

  it('sends, accepts, rejects and cancels requests, and removes friends', async () => {
    await repository.send('ana-1');
    await repository.accept('r1');
    await repository.reject('r2');
    await repository.cancel('r3');
    await repository.remove('ana 1');

    expect(api.post.mock.calls).toEqual([
      ['/friends/requests', { toUid: 'ana-1' }],
      ['/friends/requests/r1/accept'],
      ['/friends/requests/r2/reject'],
    ]);
    expect(api.delete.mock.calls).toEqual([['/friends/requests/r3'], ['/friends/ana%201']]);
  });

  it('searches by name and reads the relation, an unknown one as none', async () => {
    api.get.mockReturnValue(
      of({
        results: [
          { profile: ANA, relation: 'friend' },
          { profile: { ...ANA, uid: 'b' }, relation: 'strange' },
        ],
      }),
    );

    const results = await repository.search('ana');

    expect(api.get).toHaveBeenCalledWith('/friends/search', { q: 'ana' });
    expect(results.map((r) => r.relation)).toEqual(['friend', 'none']);
  });

  it('tolerates malformed answers', async () => {
    api.get.mockReturnValue(of({ friends: 'x', results: [null] }));

    expect(await repository.list()).toEqual([]);
    expect(await repository.search('ana')).toEqual([
      { profile: { uid: '', firstName: '', lastName: '', cityId: '' }, relation: 'none' },
    ]);
  });
});
