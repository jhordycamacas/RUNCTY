import { Injectable, effect, inject, signal, untracked } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { userMessage } from '../../core/errors/user-message';
import {
  Preferences,
  PreferencesCache,
  PreferencesDisplay,
  PreferencesRepository,
  defaultPreferences,
} from '../domain/preferences';
import {
  getPreferences,
  readCachedPreferences,
  resetPreferences,
  savePreferences,
} from './preferences-use-cases';

/**
 * The signed-in user's preferences. They are applied to the screen as soon as the user is known
 * (the device copy first, the API answer after) and go back to the defaults on sign-out.
 * Must be instantiated at start-up (`provideAppInitializer`), not by a screen.
 */
@Injectable({ providedIn: 'root' })
export class PreferencesStore {
  private readonly auth = inject(AuthService);
  private readonly repo = inject(PreferencesRepository);
  private readonly cache = inject(PreferencesCache);
  private readonly display = inject(PreferencesDisplay);

  private readonly current = signal<Preferences>(defaultPreferences());
  private readonly synced = signal(false);
  private readonly failure = signal<string | null>(null);

  readonly preferences = this.current.asReadonly();
  /** True once the API answered for the signed-in user (the device copy does not count). */
  readonly loaded = this.synced.asReadonly();
  readonly error = this.failure.asReadonly();

  constructor() {
    effect(() => this.display.apply(this.current()));
    effect(() => {
      const uid = this.auth.session()?.uid ?? null;
      untracked(() => this.follow(uid));
    });
  }

  /** Reads the preferences from the API; the screen keeps the previous copy if it fails. */
  async load(): Promise<void> {
    const uid = this.auth.session()?.uid;
    if (!uid) return;
    this.failure.set(null);
    try {
      const preferences = await getPreferences(uid, { repo: this.repo, cache: this.cache });
      if (this.auth.session()?.uid !== uid) return;
      this.current.set(preferences);
      this.synced.set(true);
    } catch (error) {
      this.failure.set(userMessage(error));
    }
  }

  /** RF-01-13 and RF-01-15. Throws the translated error so the screen can show it. */
  async save(preferences: Preferences): Promise<void> {
    const uid = this.requireUid();
    this.current.set(
      await savePreferences(uid, preferences, { repo: this.repo, cache: this.cache }),
    );
    this.synced.set(true);
  }

  /** RF-01-16 */
  async reset(): Promise<void> {
    const uid = this.requireUid();
    this.current.set(await resetPreferences(uid, { repo: this.repo, cache: this.cache }));
    this.synced.set(true);
  }

  private follow(uid: string | null): void {
    this.synced.set(false);
    this.failure.set(null);
    const cached = uid ? readCachedPreferences(uid, { cache: this.cache }) : null;
    this.current.set(cached ?? defaultPreferences());
    if (uid) void this.load();
  }

  private requireUid(): string {
    const uid = this.auth.session()?.uid;
    if (!uid) throw new Error('No signed-in user');
    return uid;
  }
}
