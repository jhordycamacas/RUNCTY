import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { userMessage } from '../../core/errors/user-message';
import { SportProfile, SportProfileRepository } from '../domain/sport-profile';

/** `loading` until the first answer; `empty` is a user without a sport profile (not an error). */
export type SportProfileStatus = 'loading' | 'ready' | 'empty' | 'error';

/** The signed-in user's sport profile (RF-01-9..12). Dropped when the signed-in user changes. */
@Injectable({ providedIn: 'root' })
export class SportProfileStore {
  private readonly repository = inject(SportProfileRepository);
  private readonly auth = inject(AuthService);
  private readonly stored = signal<{ uid: string; profile: SportProfile | null } | null>(null);
  private readonly failure = signal<string | null>(null);

  private readonly current = computed(() => {
    const stored = this.stored();
    return stored && stored.uid === this.auth.session()?.uid ? stored : null;
  });

  readonly profile = computed(() => this.current()?.profile ?? null);
  readonly error = this.failure.asReadonly();
  readonly status = computed<SportProfileStatus>(() => {
    const current = this.current();
    if (current) return current.profile ? 'ready' : 'empty';
    return this.failure() ? 'error' : 'loading';
  });

  async load(): Promise<void> {
    this.failure.set(null);
    try {
      this.keep(await this.repository.get());
    } catch (error) {
      this.failure.set(userMessage(error));
    }
  }

  /** Throws the translated error so the form can show it next to the button. */
  async save(profile: SportProfile): Promise<void> {
    this.keep(await this.repository.save(profile));
  }

  async remove(): Promise<void> {
    await this.repository.remove();
    this.keep(null);
  }

  private keep(profile: SportProfile | null): void {
    const uid = this.auth.session()?.uid;
    if (uid) this.stored.set({ uid, profile });
  }
}
