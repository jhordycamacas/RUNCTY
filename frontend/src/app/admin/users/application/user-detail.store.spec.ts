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

  describe('edits', () => {
    const personal = {
      firstName: 'Anita',
      lastName: 'Pérez',
      birthDate: '1995-04-23',
      cityId: 'loja',
      idNumber: '',
    };
    const sport = {
      level: 'advanced',
      goals: ['pace'],
      usualPaceSecPerKm: 300,
      preferredDistanceKm: 21,
    };

    it('saves the personal data and shows the answer without reloading', async () => {
      await store.load('u1');
      repository.updatePersonalData.mockResolvedValueOnce({
        ...userDetail('u1').user,
        ...personal,
        idNumber: null,
      });

      await store.savePersonalData(personal);

      expect(repository.updatePersonalData).toHaveBeenCalledWith('u1', personal);
      expect(store.detail()?.user.firstName).toBe('Anita');
      expect(store.detail()?.user.idNumber).toBeNull();
      expect(store.detail()?.sportProfile).not.toBeNull();
      expect(repository.get).toHaveBeenCalledTimes(1);
    });

    it('rejects a failed save and keeps what was shown', async () => {
      await store.load('u1');
      repository.updatePersonalData.mockRejectedValueOnce(
        new ApiError(400, 'invalid-argument', 'Los datos enviados no son válidos.', {
          firstName: 'required',
        }),
      );

      await expect(store.savePersonalData(personal)).rejects.toMatchObject({
        fields: { firstName: 'required' },
      });

      expect(store.detail()?.user.firstName).toBe('Ana');
    });

    it('saves and clears the sport profile', async () => {
      await store.load('u1');

      await store.saveSportProfile(sport);
      expect(repository.saveSportProfile).toHaveBeenCalledWith('u1', sport);
      expect(store.detail()?.sportProfile).toEqual(sport);

      await store.clearSportProfile();
      expect(repository.clearSportProfile).toHaveBeenCalledWith('u1');
      expect(store.detail()?.sportProfile).toBeNull();
      expect(store.detail()?.user.uid).toBe('u1');
    });

    it('keeps the sport profile when clearing it fails', async () => {
      await store.load('u1');
      repository.clearSportProfile.mockRejectedValueOnce(
        new ApiError(0, 'network', 'Sin conexión.'),
      );

      await expect(store.clearSportProfile()).rejects.toBeInstanceOf(ApiError);

      expect(store.detail()?.sportProfile).not.toBeNull();
    });

    it('deletes the user and forgets the detail', async () => {
      await store.load('u1');

      await store.remove();

      expect(repository.remove).toHaveBeenCalledWith('u1');
      expect(store.detail()).toBeNull();
    });

    it('keeps the user when the deletion is refused', async () => {
      await store.load('u1');
      repository.remove.mockRejectedValueOnce(
        new ApiError(
          409,
          'cannot-delete-self',
          'No puedes eliminar tu propia cuenta desde el panel.',
        ),
      );

      await expect(store.remove()).rejects.toMatchObject({ reason: 'cannot-delete-self' });

      expect(store.detail()?.user.uid).toBe('u1');
    });

    it('does nothing without a loaded user', async () => {
      await expect(store.remove()).rejects.toThrow();
      expect(repository.remove).not.toHaveBeenCalled();
    });
  });
});
