import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '../../core/auth/auth.service';
import { ApiError } from '../../core/errors/api-error';
import { Session } from '../../core/permissions/permissions';
import { FriendRepository, SearchResult } from '../domain/friend';
import { FakeFriendRepository, profile } from '../testing/fake-friend.repository';
import { FriendsStore } from './friends.store';

const ANA = profile('ana-1');

describe('FriendsStore', () => {
  let repository: FakeFriendRepository;
  let session: ReturnType<typeof signal<Pick<Session, 'uid'> | null>>;
  let store: FriendsStore;

  beforeEach(() => {
    repository = new FakeFriendRepository();
    session = signal({ uid: 'me' });
    TestBed.configureTestingModule({
      providers: [
        { provide: FriendRepository, useValue: repository },
        { provide: AuthService, useValue: { session } },
      ],
    });
    store = TestBed.inject(FriendsStore);
  });

  it('starts empty and idle', () => {
    expect(store.friends()).toEqual([]);
    expect(store.incoming()).toEqual([]);
    expect(store.outgoing()).toEqual([]);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('loads the friends and both lists of pending requests', async () => {
    repository.friends = [{ profile: ANA, since: '2026-11-23T09:00:00' }];
    repository.requests = {
      incoming: [{ id: 'r1', profile: profile('b') }],
      outgoing: [{ id: 'r2', profile: profile('c') }],
    };

    await store.load();

    expect(store.friends()).toHaveLength(1);
    expect(store.incoming().map((r) => r.id)).toEqual(['r1']);
    expect(store.outgoing().map((r) => r.id)).toEqual(['r2']);
    expect(store.loading()).toBe(false);
  });

  it('keeps a failure as Spanish text', async () => {
    repository.failure = new ApiError(0, 'network', 'Sin conexión.');

    await store.load();

    expect(store.error()).toBe('Sin conexión.');
    expect(store.friends()).toEqual([]);
  });

  it('never shows what was loaded for another user', async () => {
    repository.friends = [{ profile: ANA, since: '' }];
    await store.load();

    session.set({ uid: 'someone-else' });

    expect(store.friends()).toEqual([]);
  });

  describe('actions', () => {
    it.each([
      ['send', 'send:ana-1', () => store.send('ana-1')],
      ['accept', 'accept:r1', () => store.accept('r1')],
      ['reject', 'reject:r1', () => store.reject('r1')],
      ['cancel', 'cancel:r1', () => store.cancel('r1')],
      ['remove', 'remove:ana-1', () => store.remove('ana-1')],
    ])('%s calls the API and reloads the lists', async (_name, call, run) => {
      expect(await run()).toBe(true);

      expect(repository.calls).toEqual([call, 'list', 'pending']);
      expect(store.working()).toBe(false);
    });

    it('a failed action keeps the message, resolves false and reloads nothing', async () => {
      repository.failure = new ApiError(409, 'request-pending', 'Ya hay una solicitud pendiente.');

      expect(await store.send('ana-1')).toBe(false);

      expect(store.error()).toBe('Ya hay una solicitud pendiente.');
      expect(repository.calls).toEqual(['send:ana-1']);
      expect(store.working()).toBe(false);
    });

    it('runs the last search again so the relations stay current', async () => {
      repository.results = [{ profile: ANA, relation: 'none' }];
      await store.search('ana');
      repository.calls.length = 0;

      await store.send('ana-1');

      expect(repository.calls).toEqual(['send:ana-1', 'list', 'pending', 'search:ana']);
    });
  });

  describe('search', () => {
    it('trims the text and keeps the results', async () => {
      repository.results = [{ profile: ANA, relation: 'friend' }];

      await store.search('  ana ');

      expect(repository.calls).toEqual(['search:ana']);
      expect(store.results()).toEqual(repository.results);
      expect(store.searchedText()).toBe('ana');
      expect(store.searching()).toBe(false);
    });

    it('does not call the API for text shorter than three characters and clears the results', async () => {
      repository.results = [{ profile: ANA, relation: 'none' }];
      await store.search('ana');
      repository.calls.length = 0;

      await store.search('an');

      expect(repository.calls).toEqual([]);
      expect(store.results()).toEqual([]);
      expect(store.searchedText()).toBe('');
    });

    it('drops the answer of an older search', async () => {
      const release: Array<(value: SearchResult[]) => void> = [];
      repository.search = () => new Promise((resolve) => release.push(resolve));

      const first = store.search('ana');
      const second = store.search('anabel');
      release[1]([{ profile: profile('b', 'Anabel'), relation: 'none' }]);
      await second;
      release[0]([{ profile: ANA, relation: 'none' }]);
      await first;

      expect(store.results().map((r) => r.profile.uid)).toEqual(['b']);
      expect(store.searchedText()).toBe('anabel');
    });

    it('keeps a search failure as text', async () => {
      repository.failure = new ApiError(429, 'rate-limited', 'Demasiados intentos.');

      await store.search('ana');

      expect(store.error()).toBe('Demasiados intentos.');
      expect(store.searching()).toBe(false);
    });
  });
});
