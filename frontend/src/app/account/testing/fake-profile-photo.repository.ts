import { ProfilePhotoRepository } from '../domain/profile-photo';

/** In-memory photo for specs: no HTTP. Set `failure` to make every call reject with it. */
export class FakeProfilePhotoRepository extends ProfilePhotoRepository {
  failure: unknown = null;

  constructor(public photo: string | null = null) {
    super();
  }

  async get(): Promise<string | null> {
    this.check();
    return this.photo;
  }

  async save(photo: string): Promise<string> {
    this.check();
    this.photo = photo;
    return photo;
  }

  async remove(): Promise<void> {
    this.check();
    this.photo = null;
  }

  private check(): void {
    if (this.failure) throw this.failure;
  }
}
