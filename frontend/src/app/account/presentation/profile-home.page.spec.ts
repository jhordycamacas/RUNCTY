import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { CityRepository } from '../../cities/domain/city';
import { AuthService } from '../../core/auth/auth.service';
import { ApiError } from '../../core/errors/api-error';
import { Session } from '../../core/permissions/permissions';
import { provideSystemSettings } from '../../core/settings/testing/fake-system-settings.store';
import { IMAGE_CODEC } from '../../shared/images/browser-image-codec';
import { DecodedImage } from '../../shared/images/image-codec';
import { ConfirmDialog } from '../../shared/ui/confirm-dialog';
import { ToastService } from '../../shared/ui/toast.service';
import { ProfilePhotoRepository } from '../domain/profile-photo';
import { FakeProfilePhotoRepository } from '../testing/fake-profile-photo.repository';
import { Profile, ProfileRepository } from '../domain/profile';
import { ProfileHomePage } from './profile-home.page';

const PROFILE: Profile = {
  uid: 'u1',
  email: 'ana@runcty.dev',
  firstName: 'Ana',
  lastName: 'Torres',
  birthDate: '1998-07-14',
  cityId: 'loja',
  idNumber: null,
  role: 'runner',
};

const NEW_PHOTO = 'data:image/jpeg;base64,AAAA';
const OLD_PHOTO = 'data:image/jpeg;base64,BBBB';

describe('ProfileHomePage', () => {
  let fixture: ComponentFixture<ProfileHomePage>;
  let signOut: ReturnType<typeof vi.fn<() => Promise<void>>>;
  let confirm: ReturnType<typeof vi.fn<ConfirmDialog['confirm']>>;
  let navigate: ReturnType<typeof vi.spyOn>;
  let get: ReturnType<typeof vi.fn<ProfileRepository['get']>>;
  let emailVerified: boolean;
  let photos: FakeProfilePhotoRepository;
  let toastSuccess: ReturnType<typeof vi.fn<ToastService['success']>>;
  const session = signal<Session | null>(null);

  const text = () => fixture.nativeElement.textContent as string;
  async function create(): Promise<void> {
    session.set({ uid: 'u1', email: PROFILE.email, emailVerified, role: 'runner', perms: [] });
    fixture = TestBed.createComponent(ProfileHomePage);
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();
  }

  beforeEach(() => {
    emailVerified = true;
    signOut = vi.fn<() => Promise<void>>().mockResolvedValue();
    confirm = vi.fn<ConfirmDialog['confirm']>().mockResolvedValue(true);
    photos = new FakeProfilePhotoRepository(null);
    toastSuccess = vi.fn<ToastService['success']>().mockResolvedValue();
    get = vi.fn<ProfileRepository['get']>().mockResolvedValue(PROFILE);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { session, signOut: () => signOut() } },
        { provide: ProfileRepository, useValue: { get } },
        {
          provide: CityRepository,
          useValue: { list: async () => [{ id: 'loja', name: 'Loja', type: 'city' }] },
        },
        { provide: ConfirmDialog, useValue: { confirm } },
        { provide: ProfilePhotoRepository, useFactory: () => photos },
        { provide: ToastService, useValue: { success: toastSuccess } },
        {
          provide: IMAGE_CODEC,
          useValue: {
            decode: async () =>
              ({
                width: 300,
                height: 300,
                encode: () => NEW_PHOTO,
                close: () => undefined,
              }) satisfies DecodedImage,
          },
        },
        provideSystemSettings(),
      ],
    });
    navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
  });

  it('shows who the user is, the city name and the verification state', async () => {
    await create();

    expect(text()).toContain('Ana Torres');
    expect(text()).toContain('ana@runcty.dev');
    expect(text()).toContain('Loja');
    expect(text()).toContain('Correo verificado');
  });

  it('flags an unverified email', async () => {
    emailVerified = false;
    await create();

    expect(text()).toContain('Correo sin verificar');
  });

  it('keeps the account sections reachable when the profile fails to load', async () => {
    get.mockRejectedValue({ code: 'auth/network-request-failed' });
    await create();

    expect(text()).toContain('Reintentar');
    expect(text()).toContain('Datos personales');
    expect(text()).toContain('Eliminar cuenta');
  });

  it('signs out after the user confirms', async () => {
    await create();

    await fixture.componentInstance['signOut']();

    expect(confirm).toHaveBeenCalledOnce();
    expect(signOut).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith('/login', { replaceUrl: true });
  });

  it('stays signed in when the user cancels', async () => {
    await create();
    confirm.mockResolvedValue(false);

    await fixture.componentInstance['signOut']();

    expect(signOut).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  describe('profile photo', () => {
    const avatarImage = () => fixture.nativeElement.querySelector('app-avatar img') as HTMLImageElement | null;
    const buttonByText = (label: string) =>
      Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('ion-button')).find((button) =>
        button.textContent?.includes(label),
      );
    async function settle(): Promise<void> {
      await fixture.whenStable();
      await new Promise((resolve) => setTimeout(resolve));
      fixture.detectChanges();
    }
    async function pick(file: Partial<File>): Promise<void> {
      const input = fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;
      Object.defineProperty(input, 'files', { value: [file], configurable: true });
      input.dispatchEvent(new Event('change'));
      await settle();
    }

    it('shows the initials and no remove button while there is no photo', async () => {
      await create();

      expect(avatarImage()).toBeNull();
      expect(fixture.nativeElement.querySelector('app-avatar')?.textContent).toContain('AT');
      expect(buttonByText('Cambiar foto')).toBeDefined();
      expect(buttonByText('Quitar foto')).toBeUndefined();
    });

    it('shows the saved photo with its remove button', async () => {
      photos.photo = OLD_PHOTO;
      await create();

      expect(avatarImage()?.getAttribute('src')).toBe(OLD_PHOTO);
      expect(buttonByText('Quitar foto')).toBeDefined();
    });

    it('offers the camera and the gallery through a file input labelled for images', async () => {
      await create();

      const input = fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;
      expect(input.accept).toBe('image/*');
      expect(input.hidden).toBe(true);
    });

    it('resizes and uploads the picked picture, shows it and confirms with a toast', async () => {
      await create();

      await pick({ type: 'image/png', size: 5000 });

      expect(photos.photo).toBe(NEW_PHOTO);
      expect(avatarImage()?.getAttribute('src')).toBe(NEW_PHOTO);
      expect(toastSuccess).toHaveBeenCalledWith('Foto actualizada.');
    });

    it('explains in Spanish why a picture was rejected and keeps the old photo', async () => {
      photos.photo = OLD_PHOTO;
      await create();
      photos.failure = new ApiError(400, 'validation', 'Datos inválidos.', { photo: 'too-large' });

      await pick({ type: 'image/png', size: 5000 });

      expect(text()).toContain('La foto pesa más de lo permitido. Prueba con otra.');
      expect(avatarImage()?.getAttribute('src')).toBe(OLD_PHOTO);
      expect(toastSuccess).not.toHaveBeenCalled();
    });

    it('rejects a file that is not an image without touching the API', async () => {
      await create();

      await pick({ type: 'application/pdf', size: 5000 });

      expect(text()).toContain('El archivo no es una imagen.');
      expect(photos.photo).toBeNull();
    });

    it('removes the photo after the user confirms', async () => {
      photos.photo = OLD_PHOTO;
      await create();

      buttonByText('Quitar foto')?.click();
      await settle();

      expect(confirm).toHaveBeenCalledOnce();
      expect(photos.photo).toBeNull();
      expect(avatarImage()).toBeNull();
      expect(toastSuccess).toHaveBeenCalledWith('Foto eliminada.');
    });

    it('keeps the photo when the user cancels the removal', async () => {
      photos.photo = OLD_PHOTO;
      confirm.mockResolvedValue(false);
      await create();

      buttonByText('Quitar foto')?.click();
      await settle();

      expect(photos.photo).toBe(OLD_PHOTO);
      expect(toastSuccess).not.toHaveBeenCalled();
    });
  });
});
