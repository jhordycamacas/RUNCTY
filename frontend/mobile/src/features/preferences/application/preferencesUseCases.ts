import {
  DEFAULT_PREFERENCES,
  parsePreferences,
  preferencesSchema,
  type PreferenciaUsuario,
  type PreferencesCache,
  type PreferencesRepository,
} from '../domain';

interface Deps {
  repo: PreferencesRepository;
  cache: PreferencesCache;
}

/** The local cache is best effort: its failures never break the flow. */
function ignoreCacheError(promise: Promise<void>): Promise<void> {
  return promise.catch(() => undefined);
}

/**
 * RF-01-14: the stored preferences, or the defaults when the user never saved
 * any (nothing is written in that case). Refreshes the local cache.
 */
export async function getPreferences(uid: string, deps: Deps): Promise<PreferenciaUsuario> {
  const preferences = (await deps.repo.get(uid)) ?? parsePreferences(DEFAULT_PREFERENCES);
  await ignoreCacheError(deps.cache.write(uid, preferences));
  return preferences;
}

/** Last known preferences of this user on this device, or null. */
export async function readCachedPreferences(
  uid: string,
  deps: { cache: PreferencesCache },
): Promise<PreferenciaUsuario | null> {
  try {
    return await deps.cache.read(uid);
  } catch {
    return null;
  }
}

/** RF-01-13 (first save creates the doc) and RF-01-15. */
export async function savePreferences(uid: string, preferences: PreferenciaUsuario, deps: Deps): Promise<void> {
  const valid = preferencesSchema.parse(preferences);
  await deps.repo.save(uid, valid);
  await ignoreCacheError(deps.cache.write(uid, valid));
}

/** RF-01-16: deletes the doc, so the defaults apply again. */
export async function resetPreferences(uid: string, deps: Deps): Promise<PreferenciaUsuario> {
  await deps.repo.remove(uid);
  await ignoreCacheError(deps.cache.clear(uid));
  return parsePreferences(DEFAULT_PREFERENCES);
}
