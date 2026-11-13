import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '../../core/auth/auth.service';
import { ApiError } from '../../core/errors/api-error';
import { Session } from '../../core/permissions/permissions';
import { Profile, ProfileRepository } from '../domain/profile';
import { ProfileStore } from './profile.store';

const PROFILE: Profile = {
  uid: 'u1',
  email: 'ana@runcty.dev',
  firstName: 'Ana',
  lastName: 'Torres',
  birthDate: '1998-07-14',
  cityId: 'loja',
  idNumber: null,
  role: 'runner',
};

describe('ProfileStore', () => {
  let get: ReturnType<typeof vi.fn<() => Promise<Profile>>>;
  let update: ReturnType<typeof vi.fn<ProfileRepository['update']>>;
  let session: ReturnType<typeof signal<Pick<Session, 'uid'> | null>>;
  let store: ProfileStore;

  beforeEach(() => {
    get = vi.fn<() => Promise<Profile>>().mockResolvedValue(PROFILE);
    update = vi
      .fn<ProfileRepository['update']>()
      .mockResolvedValue({ ...PROFILE, firstName: 'Anita' });
    session = signal({ uid: 'u1' });
    TestBed.configureTestingModule({
      providers: [
        { provide: ProfileRepository, useValue: { get, update } },
        { provide: AuthService, useValue: { session } },
      ],
    });
    store = TestBed.inject(ProfileStore);
  });

  it('loads the profile', async () => {
    await store.load();

    expect(store.profile()).toEqual(PROFILE);
    expect(store.error()).toBeNull();
  });

  it('keeps the translated error and the previous copy when a reload fails', async () => {
    await store.load();
    get.mockRejectedValueOnce(new ApiError(0, 'network', 'No hay conexión con el servidor.'));

    await store.load();

    expect(store.error()).toBe('No hay conexión con el servidor.');
    expect(store.profile()).toEqual(PROFILE);
  });

  it('does not show a profile that belongs to another user', async () => {
    await store.load();

    session.set({ uid: 'u2' });

    expect(store.profile()).toBeNull();
  });

  it('saves trimmed personal data and keeps the answer of the server', async () => {
    await store.save({
      firstName: ' Anita ',
      lastName: 'Torres',
      birthDate: '1998-07-14',
      cityId: 'loja',
      idNumber: ' ',
    });

    expect(update).toHaveBeenCalledWith({
      firstName: 'Anita',
      lastName: 'Torres',
      birthDate: '1998-07-14',
      cityId: 'loja',
      idNumber: '',
    });
    expect(store.profile()?.firstName).toBe('Anita');
  });

  it('lets the caller handle a rejected save', async () => {
    update.mockRejectedValueOnce(
      new ApiError(400, 'invalid-argument', 'Los datos enviados no son válidos.'),
    );

    await expect(
      store.save({
        firstName: 'A',
        lastName: 'B',
        birthDate: '1998-07-14',
        cityId: 'loja',
        idNumber: '',
      }),
    ).rejects.toBeInstanceOf(ApiError);
  });
});
