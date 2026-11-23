import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '../../core/auth/auth.service';
import { ApiError } from '../../core/errors/api-error';
import { Session } from '../../core/permissions/permissions';
import {
  fakeSystemSettingsStore,
  provideSystemSettings,
} from '../../core/settings/testing/fake-system-settings.store';
import { IMAGE_CODEC } from '../../shared/images/browser-image-codec';
import { DecodedImage, ImageCodec } from '../../shared/images/image-codec';
import { ProfilePhotoRepository } from '../domain/profile-photo';
import { FakeProfilePhotoRepository } from '../testing/fake-profile-photo.repository';
import { ProfilePhotoStore } from './profile-photo.store';

const OLD = 'data:image/jpeg;base64,OLD=';
const NEW = 'data:image/jpeg;base64,AAAA';

const file = (type = 'image/png') => ({ type, size: 1000 }) as unknown as File;

describe('ProfilePhotoStore', () => {
  let repository: FakeProfilePhotoRepository;
  let session: ReturnType<typeof signal<Pick<Session, 'uid'> | null>>;
  let encode: ReturnType<typeof vi.fn<DecodedImage['encode']>>;
  let store: ProfilePhotoStore;

  beforeEach(() => {
    repository = new FakeProfilePhotoRepository(OLD);
    session = signal({ uid: 'u1' });
    encode = vi.fn<DecodedImage['encode']>(() => NEW);
    const codec: ImageCodec = {
      decode: async () => ({ width: 600, height: 400, encode, encodeFit: () => NEW, close: () => undefined }),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: ProfilePhotoRepository, useValue: repository },
        { provide: AuthService, useValue: { session } },
        { provide: IMAGE_CODEC, useValue: codec },
        provideSystemSettings(fakeSystemSettingsStore({ profilePhotoMaxKb: 50, profilePhotoMaxPx: 128 })),
      ],
    });
    store = TestBed.inject(ProfilePhotoStore);
  });

  it('starts without a photo and without activity', () => {
    expect(store.photo()).toBeNull();
    expect(store.loading()).toBe(false);
    expect(store.saving()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('loads the photo', async () => {
    await store.load();

    expect(store.photo()).toBe(OLD);
  });

  it('keeps an error and the previous photo when the load fails', async () => {
    await store.load();
    repository.failure = new ApiError(0, 'network', 'Sin conexión.');

    await store.load();

    expect(store.error()).toBe('Sin conexión.');
    expect(store.photo()).toBe(OLD);
    expect(store.loading()).toBe(false);
  });

  it('resizes with the configured limits, uploads and shows the stored photo', async () => {
    const saved = await store.change(file());

    expect(saved).toBe(true);
    expect(encode).toHaveBeenCalledWith(expect.anything(), 128, 0.9);
    expect(repository.photo).toBe(NEW);
    expect(store.photo()).toBe(NEW);
    expect(store.saving()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('reports a file that is not an image without calling the API', async () => {
    const save = vi.spyOn(repository, 'save');

    const saved = await store.change(file('application/pdf'));

    expect(saved).toBe(false);
    expect(store.error()).toBe('El archivo no es una imagen.');
    expect(save).not.toHaveBeenCalled();
  });

  it.each([
    ['invalid-format', 'La foto debe ser JPG, PNG o WebP.'],
    ['invalid-image', 'No pudimos leer la imagen. Prueba con otra.'],
    ['too-large', 'La foto pesa más de lo permitido. Prueba con otra.'],
  ])('maps the API reason %s to Spanish and keeps the old photo', async (reason, message) => {
    await store.load();
    repository.failure = new ApiError(400, 'validation', 'Datos inválidos.', { photo: reason });

    const saved = await store.change(file());

    expect(saved).toBe(false);
    expect(store.error()).toBe(message);
    expect(store.photo()).toBe(OLD);
  });

  it('shows the API message when the failure has no photo field', async () => {
    repository.failure = new ApiError(500, 'server', 'Algo salió mal.');

    await store.change(file());

    expect(store.error()).toBe('Algo salió mal.');
  });

  it('removes the photo', async () => {
    await store.load();

    const removed = await store.remove();

    expect(removed).toBe(true);
    expect(repository.photo).toBeNull();
    expect(store.photo()).toBeNull();
  });

  it('keeps the photo and reports the failure when removing fails', async () => {
    await store.load();
    repository.failure = new ApiError(0, 'network', 'Sin conexión.');

    expect(await store.remove()).toBe(false);
    expect(store.photo()).toBe(OLD);
    expect(store.error()).toBe('Sin conexión.');
  });

  it('clears the error on the next attempt', async () => {
    repository.failure = new ApiError(0, 'network', 'Sin conexión.');
    await store.change(file());
    repository.failure = null;

    await store.change(file());

    expect(store.error()).toBeNull();
  });

  it('drops the photo when another user signs in', async () => {
    await store.load();
    session.set({ uid: 'u2' });

    expect(store.photo()).toBeNull();
  });
});
