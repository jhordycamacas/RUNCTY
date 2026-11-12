import AsyncStorage from '@react-native-async-storage/async-storage';

import { parsePreferences, type PreferencesCache } from '../domain';

/** One entry per uid, so a shared device never applies another user's preferences. */
const keyFor = (uid: string) => `runcty:preferences:${uid}`;

export function createAsyncStoragePreferencesCache(): PreferencesCache {
  return {
    async read(uid) {
      const raw = await AsyncStorage.getItem(keyFor(uid));
      if (raw === null) return null;
      try {
        return parsePreferences(JSON.parse(raw));
      } catch {
        return null;
      }
    },
    async write(uid, preferences) {
      await AsyncStorage.setItem(keyFor(uid), JSON.stringify(preferences));
    },
    async clear(uid) {
      await AsyncStorage.removeItem(keyFor(uid));
    },
  };
}
