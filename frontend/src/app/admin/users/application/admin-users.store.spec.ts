import { TestBed } from '@angular/core/testing';
import { ApiError } from '../../../core/errors/api-error';
import { UserAdminRepository } from '../domain/managed-user';
import {
  FakeUserAdminRepository,
  fakeUserAdminRepository,
  user,
} from '../testing/fake-user-admin.repository';
import { AdminUsersStore } from './admin-users.store';

describe('AdminUsersStore', () => {
  let repository: FakeUserAdminRepository;
  let store: AdminUsersStore;

  beforeEach(() => {
    repository = fakeUserAdminRepository();
    repository.search.mockResolvedValue({ users: [user('a'), user('b')], nextCursor: 'b' });
    TestBed.configureTestingModule({
      providers: [AdminUsersStore, { provide: UserAdminRepository, useValue: repository }],
    });
    store = TestBed.inject(AdminUsersStore);
  });

  it('has no users until the first page arrives', async () => {
    expect(store.users()).toBeNull();

    await store.search('');

    expect(store.users()?.map((u) => u.uid)).toEqual(['a', 'b']);
    expect(store.hasMore()).toBe(true);
    expect(repository.search).toHaveBeenCalledWith('', null);
  });

  it('searches with the text and starts over from the first page', async () => {
    await store.search('');

    repository.search.mockResolvedValue({ users: [user('c')], nextCursor: null });
    await store.search('Ana');

    expect(repository.search).toHaveBeenLastCalledWith('Ana', null);
    expect(store.users()?.map((u) => u.uid)).toEqual(['c']);
    expect(store.hasMore()).toBe(false);
  });

  it('appends the next page with the cursor and the same text', async () => {
    await store.search('loja');
    repository.search.mockResolvedValue({ users: [user('c')], nextCursor: null });

    await store.loadMore();

    expect(repository.search).toHaveBeenLastCalledWith('loja', 'b');
    expect(store.users()?.map((u) => u.uid)).toEqual(['a', 'b', 'c']);
    expect(store.hasMore()).toBe(false);
  });

  it('does nothing when there is no next page', async () => {
    repository.search.mockResolvedValue({ users: [user('a')], nextCursor: null });
    await store.search('');

    await store.loadMore();

    expect(repository.search).toHaveBeenCalledTimes(1);
  });

  it('keeps the users and reports the failure of a search', async () => {
    await store.search('');
    repository.search.mockRejectedValueOnce(new ApiError(0, 'network', 'Sin conexión.'));

    await store.reload();

    expect(store.users()).toHaveLength(2);
    expect(store.error()).toBe('Sin conexión.');
    expect(store.loading()).toBe(false);
  });

  it('drops the cursor when the API rejects it, so the user searches again', async () => {
    await store.search('');
    repository.search.mockRejectedValueOnce(
      new ApiError(400, 'invalid-cursor', 'No se pudo cargar la página siguiente. Vuelve a buscar.'),
    );

    await store.loadMore();

    expect(store.error()).toBe('No se pudo cargar la página siguiente. Vuelve a buscar.');
    expect(store.hasMore()).toBe(false);
    expect(store.users()).toHaveLength(2);
  });

  it('keeps the cursor when the next page fails for another reason', async () => {
    await store.search('');
    repository.search.mockRejectedValueOnce(new ApiError(0, 'network', 'Sin conexión.'));

    await store.loadMore();

    expect(store.hasMore()).toBe(true);
    expect(store.error()).toBe('Sin conexión.');
  });

  it('reloads the first page with the current text', async () => {
    await store.search('a@b.c');

    await store.reload();

    expect(repository.search).toHaveBeenLastCalledWith('a@b.c', null);
  });

  it('keeps only the answer of the latest search', async () => {
    let finishSlow: (page: { users: ReturnType<typeof user>[]; nextCursor: null }) => void = () => undefined;
    repository.search.mockReturnValueOnce(new Promise((resolve) => (finishSlow = resolve)));
    const slow = store.search('x');
    repository.search.mockResolvedValueOnce({ users: [user('fast')], nextCursor: null });
    await store.search('y');

    finishSlow({ users: [user('slow')], nextCursor: null });
    await slow;

    expect(store.users()?.map((u) => u.uid)).toEqual(['fast']);
  });

  it('updates the role of a listed user', async () => {
    await store.search('');

    store.setRole('a', 'admin');

    expect(store.users()?.find((u) => u.uid === 'a')?.role).toBe('admin');
    expect(store.users()?.find((u) => u.uid === 'b')?.role).toBe('runner');
  });
});
