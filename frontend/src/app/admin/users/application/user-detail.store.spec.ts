import { TestBed } from '@angular/core/testing';
import { ApiError } from '../../../core/errors/api-error';
import { UserAdminRepository } from '../domain/managed-user';
import {
  FakeUserAdminRepository,
  fakeUserAdminRepository,
  userDetail,
} from '../testing/fake-user-admin.repository';
import { UserDetailStore } from './user-detail.store';

describe('UserDetailStore', () => {
  let repository: FakeUserAdminRepository;
  let store: UserDetailStore;

  beforeEach(() => {
    repository = fakeUserAdminRepository();
    TestBed.configureTestingModule({
      providers: [UserDetailStore, { provide: UserAdminRepository, useValue: repository }],
    });
    store = TestBed.inject(UserDetailStore);
  });

  it('has nothing until the user arrives', async () => {
    expect(store.detail()).toBeNull();

    await store.load('u1');

    expect(repository.get).toHaveBeenCalledWith('u1');
    expect(store.detail()?.user.uid).toBe('u1');
    expect(store.error()).toBeNull();
    expect(store.notFound()).toBe(false);
    expect(store.loading()).toBe(false);
  });

  it('flags a user that does not exist', async () => {
    repository.get.mockRejectedValueOnce(
      new ApiError(404, 'user-not-found', 'No encontramos a este usuario.'),
    );

    await store.load('ghost');

    expect(store.notFound()).toBe(true);
    expect(store.detail()).toBeNull();
    expect(store.error()).toBeNull();
  });

  it('reports any other failure and retries with the same user', async () => {
    repository.get.mockRejectedValueOnce(new ApiError(0, 'network', 'Sin conexión.'));

    await store.load('u1');
    expect(store.error()).toBe('Sin conexión.');
    expect(store.notFound()).toBe(false);

    await store.reload();

    expect(repository.get).toHaveBeenLastCalledWith('u1');
    expect(store.error()).toBeNull();
    expect(store.detail()?.user.uid).toBe('u1');
  });

  it('forgets the previous user when it loads another one', async () => {
    await store.load('u1');
    repository.get.mockReturnValueOnce(new Promise<never>(() => undefined));

    void store.load('u2');

    expect(store.detail()).toBeNull();
    expect(store.loading()).toBe(true);
  });

  it('keeps only the answer of the latest request', async () => {
    let finishSlow: (value: ReturnType<typeof userDetail>) => void = () => undefined;
    repository.get.mockReturnValueOnce(new Promise((resolve) => (finishSlow = resolve)));
    const slow = store.load('slow');
    repository.get.mockResolvedValueOnce(userDetail('fast'));
    await store.load('fast');

    finishSlow(userDetail('slow'));
    await slow;

    expect(store.detail()?.user.uid).toBe('fast');
  });
});
