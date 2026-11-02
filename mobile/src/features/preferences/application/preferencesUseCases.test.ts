import { DEFAULT_PREFERENCES, type Preferences, type PreferencesCache, type PreferencesRepository } from '../domain';
import { getPreferences, readCachedPreferences, resetPreferences, savePreferences } from './preferencesUseCases';

const UID = 'uid-1';

const custom: Preferences = {
  ...DEFAULT_PREFERENCES,
  fontScale: 'xlarge',
  appearance: 'dark',
  notifications: { enabled: false, safetyAlerts: true, events: false },
};

function fakeRepo(stored: Preferences | null = null): jest.Mocked<PreferencesRepository> {
  return {
    get: jest.fn<Promise<Preferences | null>, [string]>(async () => stored),
    save: jest.fn<Promise<void>, [string, Preferences]>(async () => undefined),
    remove: jest.fn<Promise<void>, [string]>(async () => undefined),
  };
}

function fakeCache(cached: Preferences | null = null): jest.Mocked<PreferencesCache> {
  return {
    read: jest.fn<Promise<Preferences | null>, [string]>(async () => cached),
    write: jest.fn<Promise<void>, [string, Preferences]>(async () => undefined),
    clear: jest.fn<Promise<void>, [string]>(async () => undefined),
  };
}

describe('getPreferences (RF-01-14)', () => {
  it('returns the defaults without writing when the user has no preferences doc', async () => {
    const repo = fakeRepo(null);
    await expect(getPreferences(UID, { repo, cache: fakeCache() })).resolves.toEqual(DEFAULT_PREFERENCES);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('returns the stored preferences and refreshes the local cache', async () => {
    const cache = fakeCache();
    await expect(getPreferences(UID, { repo: fakeRepo(custom), cache })).resolves.toEqual(custom);
    expect(cache.write).toHaveBeenCalledWith(UID, custom);
  });

  it('still resolves when the local cache fails', async () => {
    const cache = fakeCache();
    cache.write.mockRejectedValue(new Error('disk full'));
    await expect(getPreferences(UID, { repo: fakeRepo(custom), cache })).resolves.toEqual(custom);
  });
});

describe('readCachedPreferences', () => {
  it('returns the cached preferences of that user', async () => {
    const cache = fakeCache(custom);
    await expect(readCachedPreferences(UID, { cache })).resolves.toEqual(custom);
    expect(cache.read).toHaveBeenCalledWith(UID);
  });

  it('returns null when the cache is empty or unreadable', async () => {
    await expect(readCachedPreferences(UID, { cache: fakeCache(null) })).resolves.toBeNull();
    const broken = fakeCache();
    broken.read.mockRejectedValue(new Error('corrupt'));
    await expect(readCachedPreferences(UID, { cache: broken })).resolves.toBeNull();
  });
});

describe('savePreferences (RF-01-13 / RF-01-15)', () => {
  it('saves valid preferences and caches them', async () => {
    const repo = fakeRepo();
    const cache = fakeCache();
    await savePreferences(UID, custom, { repo, cache });
    expect(repo.save).toHaveBeenCalledWith(UID, custom);
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
  it('deletes the doc, clears the cache and returns the defaults', async () => {
    const repo = fakeRepo(custom);
    const cache = fakeCache(custom);
    await expect(resetPreferences(UID, { repo, cache })).resolves.toEqual(DEFAULT_PREFERENCES);
    expect(repo.remove).toHaveBeenCalledWith(UID);
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
