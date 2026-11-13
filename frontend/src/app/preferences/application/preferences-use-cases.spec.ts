import {
  Preferences,
  PreferencesCache,
  PreferencesRepository,
  defaultPreferences,
} from '../domain/preferences';
import {
  getPreferences,
  readCachedPreferences,
  resetPreferences,
  savePreferences,
} from './preferences-use-cases';

const UID = 'uid-1';

const custom: Preferences = {
  ...defaultPreferences(),
  fontScale: 'xlarge',
  appearance: 'dark',
  notifications: { enabled: false, safetyAlerts: true, events: false },
};

function fakeRepo(stored: Preferences | null = null) {
  return {
    get: vi.fn<PreferencesRepository['get']>().mockResolvedValue(stored),
    save: vi.fn<PreferencesRepository['save']>().mockImplementation(async (value) => value),
    remove: vi.fn<PreferencesRepository['remove']>().mockResolvedValue(),
  };
}

function fakeCache(cached: Preferences | null = null) {
  return {
    read: vi.fn<PreferencesCache['read']>().mockReturnValue(cached),
    write: vi.fn<PreferencesCache['write']>(),
    clear: vi.fn<PreferencesCache['clear']>(),
  };
}

describe('getPreferences (RF-01-14)', () => {
  it('returns the defaults without writing when the user has no preferences', async () => {
    const repo = fakeRepo(null);

    await expect(getPreferences(UID, { repo, cache: fakeCache() })).resolves.toEqual(
      defaultPreferences(),
    );
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('returns the stored preferences and refreshes the local cache', async () => {
    const cache = fakeCache();

    await expect(getPreferences(UID, { repo: fakeRepo(custom), cache })).resolves.toEqual(custom);
    expect(cache.write).toHaveBeenCalledWith(UID, custom);
  });

  it('still resolves when the local cache fails', async () => {
    const cache = fakeCache();
    cache.write.mockImplementation(() => {
      throw new Error('disk full');
    });

    await expect(getPreferences(UID, { repo: fakeRepo(custom), cache })).resolves.toEqual(custom);
  });
});

describe('readCachedPreferences', () => {
  it('returns the cached preferences of that user', () => {
    const cache = fakeCache(custom);

    expect(readCachedPreferences(UID, { cache })).toEqual(custom);
    expect(cache.read).toHaveBeenCalledWith(UID);
  });

  it('returns null when the cache is empty or unreadable', () => {
    expect(readCachedPreferences(UID, { cache: fakeCache(null) })).toBeNull();
    const broken = fakeCache();
    broken.read.mockImplementation(() => {
      throw new Error('corrupt');
    });
    expect(readCachedPreferences(UID, { cache: broken })).toBeNull();
  });
});

describe('savePreferences (RF-01-13 / RF-01-15)', () => {
  it('saves valid preferences and caches what the server answered', async () => {
    const repo = fakeRepo();
    const cache = fakeCache();

    await savePreferences(UID, custom, { repo, cache });

    expect(repo.save).toHaveBeenCalledWith(custom);
    expect(cache.write).toHaveBeenCalledWith(UID, custom);
  });

  it('rejects invalid preferences without saving', async () => {
    const repo = fakeRepo();
    const invalid = { ...custom, fontScale: 'huge' } as unknown as Preferences;

    await expect(savePreferences(UID, invalid, { repo, cache: fakeCache() })).rejects.toThrow();
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('does not cache when the save fails', async () => {
    const repo = fakeRepo();
    repo.save.mockRejectedValue(new Error('offline'));
    const cache = fakeCache();

    await expect(savePreferences(UID, custom, { repo, cache })).rejects.toThrow('offline');
    expect(cache.write).not.toHaveBeenCalled();
  });
});

describe('resetPreferences (RF-01-16)', () => {
  it('deletes the document, clears the cache and returns the defaults', async () => {
    const repo = fakeRepo(custom);
    const cache = fakeCache(custom);

    await expect(resetPreferences(UID, { repo, cache })).resolves.toEqual(defaultPreferences());
    expect(repo.remove).toHaveBeenCalledOnce();
    expect(cache.clear).toHaveBeenCalledWith(UID);
  });

  it('keeps the cache when the delete fails', async () => {
    const repo = fakeRepo(custom);
    repo.remove.mockRejectedValue(new Error('offline'));
    const cache = fakeCache(custom);

    await expect(resetPreferences(UID, { repo, cache })).rejects.toThrow('offline');
    expect(cache.clear).not.toHaveBeenCalled();
  });
});
