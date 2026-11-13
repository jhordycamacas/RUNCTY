import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '../../core/auth/auth.service';
import { ApiError } from '../../core/errors/api-error';
import { SportProfile, SportProfileRepository } from '../domain/sport-profile';
import { SportProfileStore } from './sport-profile.store';

const PROFILE: SportProfile = {
  level: 'beginner',
  goals: ['health'],
  usualPaceSecPerKm: 420,
  preferredDistanceKm: 5,
};

describe('SportProfileStore', () => {
  let repository: {
    get: ReturnType<typeof vi.fn<SportProfileRepository['get']>>;
    save: ReturnType<typeof vi.fn<SportProfileRepository['save']>>;
    remove: ReturnType<typeof vi.fn<SportProfileRepository['remove']>>;
  };
  let session: ReturnType<typeof signal<{ uid: string } | null>>;
  let store: SportProfileStore;

  beforeEach(() => {
    repository = {
      get: vi.fn<SportProfileRepository['get']>().mockResolvedValue(PROFILE),
      save: vi.fn<SportProfileRepository['save']>().mockImplementation(async (profile) => profile),
      remove: vi.fn<SportProfileRepository['remove']>().mockResolvedValue(),
    };
    session = signal({ uid: 'u1' });
    TestBed.configureTestingModule({
      providers: [
        { provide: SportProfileRepository, useValue: repository },
        { provide: AuthService, useValue: { session } },
      ],
    });
    store = TestBed.inject(SportProfileStore);
  });

  it('is loading until the first answer', () => {
    expect(store.status()).toBe('loading');
  });

  it('is ready with the profile once loaded', async () => {
    await store.load();

    expect(store.status()).toBe('ready');
    expect(store.profile()).toEqual(PROFILE);
  });

  it('treats a user without a sport profile as empty, not as an error', async () => {
    repository.get.mockResolvedValue(null);

    await store.load();

    expect(store.status()).toBe('empty');
    expect(store.error()).toBeNull();
  });

  it('shows the translated error when the first load fails, and recovers on retry', async () => {
    repository.get.mockRejectedValueOnce(
      new ApiError(0, 'network', 'No hay conexión con el servidor.'),
    );

    await store.load();
    expect(store.status()).toBe('error');
    expect(store.error()).toBe('No hay conexión con el servidor.');

    await store.load();
    expect(store.status()).toBe('ready');
  });

  it('keeps the profile on screen when a later reload fails', async () => {
    await store.load();
    repository.get.mockRejectedValueOnce(new ApiError(0, 'network', 'sin conexión'));

    await store.load();

    expect(store.status()).toBe('ready');
    expect(store.error()).toBe('sin conexión');
  });

  it('saves and removes the profile', async () => {
    repository.get.mockResolvedValue(null);
    await store.load();

    await store.save(PROFILE);
    expect(store.status()).toBe('ready');

    await store.remove();
    expect(repository.remove).toHaveBeenCalledOnce();
    expect(store.status()).toBe('empty');
  });

  it('keeps the profile when the delete is rejected', async () => {
    await store.load();
    repository.remove.mockRejectedValueOnce(new ApiError(500, 'internal', 'x'));

    await expect(store.remove()).rejects.toBeInstanceOf(ApiError);

    expect(store.status()).toBe('ready');
  });

  it('forgets the profile of the previous user', async () => {
    await store.load();

    session.set({ uid: 'u2' });

    expect(store.profile()).toBeNull();
    expect(store.status()).toBe('loading');
  });
});
