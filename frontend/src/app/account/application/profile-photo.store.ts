import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { ApiError } from '../../core/errors/api-error';
import { userMessage } from '../../core/errors/user-message';
import { SystemSettingsStore } from '../../core/settings/system-settings.store';
import { IMAGE_CODEC } from '../../shared/images/browser-image-codec';
import { ImageFileError, resizeToSquareJpeg } from '../../shared/images/resize-to-square-jpeg';
import { ProfilePhotoRepository, photoReasonMessage } from '../domain/profile-photo';

interface StoredPhoto {
  uid: string;
  photo: string | null;
}

/**
 * The signed-in user's profile photo. The photo is dropped when the signed-in user changes, so one
 * user never sees another one's picture. Failures are kept as Spanish text in `error`.
 */
@Injectable({ providedIn: 'root' })
export class ProfilePhotoStore {
  private readonly repository = inject(ProfilePhotoRepository);
  private readonly auth = inject(AuthService);
  private readonly settings = inject(SystemSettingsStore);
  private readonly codec = inject(IMAGE_CODEC);
  private readonly stored = signal<StoredPhoto | null>(null);
  private readonly failure = signal<string | null>(null);
  private readonly reading = signal(false);
  private readonly writing = signal(false);

  readonly photo = computed(() => {
    const current = this.stored();
    return current && current.uid === this.auth.session()?.uid ? current.photo : null;
  });
  readonly error = this.failure.asReadonly();
  readonly loading = this.reading.asReadonly();
  readonly saving = this.writing.asReadonly();

  async load(): Promise<void> {
    this.reading.set(true);
    this.failure.set(null);
    try {
      this.keep(await this.repository.get());
    } catch (error) {
      this.failure.set(userMessage(error));
    } finally {
      this.reading.set(false);
    }
  }

  /** Resizes the picked file to the configured limits and uploads it. Resolves to whether it worked. */
  async change(file: File): Promise<boolean> {
    const { profilePhotoMaxPx, profilePhotoMaxKb } = this.settings.settings();
    return this.write(async () => {
      const resized = await resizeToSquareJpeg(file, profilePhotoMaxPx, profilePhotoMaxKb, this.codec);
      this.keep(await this.repository.save(resized));
    });
  }

  /** Removes the photo. Resolves to whether it worked. */
  async remove(): Promise<boolean> {
    return this.write(async () => {
      await this.repository.remove();
      this.keep(null);
    });
  }

  private async write(action: () => Promise<void>): Promise<boolean> {
    this.writing.set(true);
    this.failure.set(null);
    try {
      await action();
      return true;
    } catch (error) {
      this.failure.set(this.message(error));
      return false;
    } finally {
      this.writing.set(false);
    }
  }

  private keep(photo: string | null): void {
    const uid = this.auth.session()?.uid;
    this.stored.set(uid ? { uid, photo } : null);
  }

  /** The API reason on the `photo` field wins; other failures use the usual translation. */
  private message(error: unknown): string {
    if (error instanceof ApiError && error.fields['photo']) {
      return photoReasonMessage(error.fields['photo']);
    }
    return error instanceof ImageFileError ? error.message : userMessage(error);
  }
}
