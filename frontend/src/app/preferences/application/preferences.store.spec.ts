import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '../../core/auth/auth.service';
import { ApiError } from '../../core/errors/api-error';
import {
  Preferences,
  PreferencesCache,
  PreferencesDisplay,
  PreferencesRepository,
  defaultPreferences,
} from '../domain/preferences';
import { PreferencesStore } from './preferences.store';

const DARK_LARGE: Preferences = { ...defaultPreferences(), appearance: 'dark', fontScale: 'large' };

describe('PreferencesStore', () => {
  let remote: Preferences | null;
  let repo: {
    get: ReturnType<typeof vi.fn<PreferencesRepository['get']>>;
    save: ReturnType<typeof vi.fn<PreferencesRepository['save']>>;
    remove: ReturnType<typeof vi.fn<PreferencesRepository['remove']>>;
  };
  let cached: Record<string, Preferences>;
  let applied: Preferences[];
  let session: ReturnType<typeof signal<{ uid: string } | null>>;
  let store: PreferencesStore;

  const flush = async () => {
    TestBed.tick();
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();
  };

  beforeEach(() => {
    remote = DARK_LARGE;
    cached = {};
    applied = [];
    session = signal<{ uid: string } | null>(null);
    repo = {
      get: vi.fn<PreferencesRepository['get']>().mockImplementation(async () => remote),
      save: vi.fn<PreferencesRepository['save']>().mockImplementation(async (value) => value),
      remove: vi.fn<PreferencesRepository['remove']>().mockResolvedValue(),
    };
    const cache: PreferencesCache = {
      read: (uid) => cached[uid] ?? null,
      write: (uid, value) => {
        cached[uid] = value;
      },
      clear: (uid) => {
        delete cached[uid];
      },
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { session } },
        { provide: PreferencesRepository, useValue: repo },
        { provide: PreferencesCache, useValue: cache },
        {
          provide: PreferencesDisplay,
          useValue: { apply: (value: Preferences) => applied.push(value) },
        },
      ],
    });
    store = TestBed.inject(PreferencesStore);
  });

  it('applies the defaults while nobody is signed in', async () => {
    await flush();

    expect(applied.at(-1)).toEqual(defaultPreferences());
    expect(repo.get).not.toHaveBeenCalled();
  });

  it('applies the device copy first, then what the API answers', async () => {
    cached['u1'] = { ...defaultPreferences(), appearance: 'light' };
    remote = DARK_LARGE;

    session.set({ uid: 'u1' });
    TestBed.tick();
    expect(applied.at(-1)?.appearance).toBe('light');
    expect(store.loaded()).toBe(false);

    await flush();
    expect(applied.at(-1)).toEqual(DARK_LARGE);
    expect(store.loaded()).toBe(true);
    expect(cached['u1']).toEqual(DARK_LARGE);
  });

  it('applies the defaults for a user who never saved preferences, without saving them', async () => {
    remote = null;

    session.set({ uid: 'u1' });
    await flush();

    expect(store.preferences()).toEqual(defaultPreferences());
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('keeps the device copy and reports the error when the API fails', async () => {
    cached['u1'] = DARK_LARGE;
    repo.get.mockRejectedValueOnce(new ApiError(0, 'network', 'No hay conexión con el servidor.'));

    session.set({ uid: 'u1' });
    await flush();

    expect(store.preferences()).toEqual(DARK_LARGE);
    expect(store.error()).toBe('No hay conexión con el servidor.');
    expect(store.loaded()).toBe(false);
  });

  it('applies a saved change at once', async () => {
    session.set({ uid: 'u1' });
    await flush();

    await store.save({ ...DARK_LARGE, appearance: 'light', fontScale: 'xlarge' });
    await flush();

    expect(applied.at(-1)).toMatchObject({ appearance: 'light', fontScale: 'xlarge' });
  });

  it('goes back to the defaults on reset and on sign-out', async () => {
    session.set({ uid: 'u1' });
    await flush();

    await store.reset();
    await flush();
    expect(repo.remove).toHaveBeenCalledOnce();
    expect(applied.at(-1)).toEqual(defaultPreferences());

    await store.save(DARK_LARGE);
    session.set(null);
    await flush();
    expect(applied.at(-1)).toEqual(defaultPreferences());
    expect(store.loaded()).toBe(false);
  });

  it("never applies another user's cached preferences", async () => {
    cached['u1'] = DARK_LARGE;

    session.set({ uid: 'u2' });
    TestBed.tick();

    expect(applied.at(-1)).toEqual(defaultPreferences());
  });
});
