import { Injectable, computed, inject, signal } from '@angular/core';
import { PersonalData, trimPersonalData } from '../../auth/domain/personal-data';
import { AuthService } from '../../core/auth/auth.service';
import { userMessage } from '../../core/errors/user-message';
import { Profile, ProfileRepository } from '../domain/profile';

/**
 * The signed-in user's profile, shared by Home, the account tab and the edit screen. The profile
 * is dropped when the signed-in user changes, so one user never sees another one's data.
 */
@Injectable({ providedIn: 'root' })
export class ProfileStore {
  private readonly repository = inject(ProfileRepository);
  private readonly auth = inject(AuthService);
  private readonly stored = signal<Profile | null>(null);
  private readonly failure = signal<string | null>(null);
  private readonly pending = signal(false);

  readonly profile = computed(() => {
    const profile = this.stored();
    return profile && profile.uid === this.auth.session()?.uid ? profile : null;
  });
  readonly error = this.failure.asReadonly();
  readonly loading = this.pending.asReadonly();

  /** Reads the profile from the API. A previous copy stays visible while it loads or if it fails. */
  async load(): Promise<void> {
    this.pending.set(true);
    this.failure.set(null);
    try {
      this.stored.set(await this.repository.get());
    } catch (error) {
      this.failure.set(userMessage(error));
    } finally {
      this.pending.set(false);
    }
  }

  /** RF-01-3. Throws the translated error so the form can show it next to the button. */
  async save(data: PersonalData): Promise<void> {
    this.stored.set(await this.repository.update(trimPersonalData(data)));
  }
}
