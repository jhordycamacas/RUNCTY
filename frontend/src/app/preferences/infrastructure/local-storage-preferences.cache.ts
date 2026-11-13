import { Injectable } from '@angular/core';
import { Preferences, PreferencesCache, parsePreferences } from '../domain/preferences';

/** One entry per uid, so a shared device never applies another user's preferences. */
const keyFor = (uid: string) => `runcty:preferences:${uid}`;

@Injectable()
export class LocalStoragePreferencesCache extends PreferencesCache {
  read(uid: string): Preferences | null {
    const raw = localStorage.getItem(keyFor(uid));
    if (raw === null) return null;
    try {
      return parsePreferences(JSON.parse(raw));
    } catch {
      return null;
    }
  }

  write(uid: string, preferences: Preferences): void {
    localStorage.setItem(keyFor(uid), JSON.stringify(preferences));
  }

  clear(uid: string): void {
    localStorage.removeItem(keyFor(uid));
  }
}
