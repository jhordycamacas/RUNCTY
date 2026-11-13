import {
  Preferences,
  PreferencesCache,
  PreferencesRepository,
  defaultPreferences,
  isValidPreferences,
} from '../domain/preferences';

interface Deps {
  repo: PreferencesRepository;
  cache: PreferencesCache;
}

/** The local cache is best effort: its failures never break the flow. */
function ignoringCacheErrors(action: () => void): void {
  try {
    action();
  } catch {
    // Private mode or a full disk: the API stays the source of truth.
  }
}

/**
 * RF-01-14: the stored preferences, or the defaults when the user never saved any (nothing is
 * written in that case). Refreshes the local cache.
 */
export async function getPreferences(uid: string, deps: Deps): Promise<Preferences> {
  const preferences = (await deps.repo.get()) ?? defaultPreferences();
  ignoringCacheErrors(() => deps.cache.write(uid, preferences));
  return preferences;
}

/** Last known preferences of this user on this device, or null. */
export function readCachedPreferences(
  uid: string,
  deps: { cache: PreferencesCache },
): Preferences | null {
  try {
    return deps.cache.read(uid);
  } catch {
    return null;
  }
}

/** RF-01-13 (first save creates the document) and RF-01-15. */
export async function savePreferences(
  uid: string,
  preferences: Preferences,
  deps: Deps,
): Promise<Preferences> {
  if (!isValidPreferences(preferences)) throw new Error('Invalid preferences');
  const saved = await deps.repo.save(preferences);
  ignoringCacheErrors(() => deps.cache.write(uid, saved));
  return saved;
}

/** RF-01-16: deletes the document, so the defaults apply again. */
export async function resetPreferences(uid: string, deps: Deps): Promise<Preferences> {
  await deps.repo.remove();
  ignoringCacheErrors(() => deps.cache.clear(uid));
  return defaultPreferences();
}
