import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CityRepository } from '../../cities/domain/city';
import { AuthService } from '../../core/auth/auth.service';
import { ApiError } from '../../core/errors/api-error';
import { provideSystemSettings } from '../../core/settings/testing/fake-system-settings.store';
import { IMAGE_CODEC } from '../../shared/images/browser-image-codec';
import { DecodedImage } from '../../shared/images/image-codec';
import { ConfirmDialog } from '../../shared/ui/confirm-dialog';
import { ToastService } from '../../shared/ui/toast.service';
import { Profile, ProfileRepository } from '../domain/profile';
import { ProfilePhotoRepository } from '../domain/profile-photo';
import { FakeProfilePhotoRepository } from '../testing/fake-profile-photo.repository';
import { EditPersonalDataPage } from './edit-personal-data.page';

const NEW_PHOTO = 'data:image/jpeg;base64,AAAA';
const OLD_PHOTO = 'data:image/jpeg;base64,BBBB';

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

describe('EditPersonalDataPage', () => {
  let fixture: ComponentFixture<EditPersonalDataPage>;
  let get: ReturnType<typeof vi.fn<ProfileRepository['get']>>;
  let update: ReturnType<typeof vi.fn<ProfileRepository['update']>>;
  let photos: FakeProfilePhotoRepository;
  let toastSuccess: ReturnType<typeof vi.fn<ToastService['success']>>;
  let confirm: ReturnType<typeof vi.fn<ConfirmDialog['confirm']>>;

  const text = () => fixture.nativeElement.textContent as string;
  const page = () => fixture.componentInstance;
  async function settle(): Promise<void> {
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();
  }
  async function create(): Promise<void> {
    fixture = TestBed.createComponent(EditPersonalDataPage);
    fixture.detectChanges();
    await settle();
  }
  async function submit(): Promise<void> {
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await settle();
  }

  beforeEach(() => {
    photos = new FakeProfilePhotoRepository(null);
    toastSuccess = vi.fn<ToastService['success']>().mockResolvedValue();
    confirm = vi.fn<ConfirmDialog['confirm']>().mockResolvedValue(true);
    get = vi.fn<ProfileRepository['get']>().mockResolvedValue(PROFILE);
    update = vi.fn<ProfileRepository['update']>().mockImplementation(async (data) => ({
      ...PROFILE,
      ...data,
      idNumber: data.idNumber || null,
    }));
    TestBed.configureTestingModule({
      providers: [
        { provide: ProfileRepository, useValue: { get, update } },
        { provide: CityRepository, useValue: { list: async () => [{ id: 'loja', name: 'Loja' }] } },
        { provide: AuthService, useValue: { session: signal({ uid: 'u1' }) } },
        { provide: ProfilePhotoRepository, useFactory: () => photos },
        { provide: ToastService, useValue: { success: toastSuccess } },
        { provide: ConfirmDialog, useValue: { confirm } },
        {
          provide: IMAGE_CODEC,
          useValue: {
            decode: async () =>
              ({
                width: 300,
                height: 300,
                encode: () => NEW_PHOTO,
                encodeFit: () => NEW_PHOTO,
                close: () => undefined,
              }) satisfies DecodedImage,
          },
        },
        provideSystemSettings(),
      ],
    });
  });

  it('shows the loaded data and the read-only email', async () => {
    await create();

    expect(page()['form'].getRawValue()).toEqual({
      firstName: 'Ana',
      lastName: 'Torres',
      birthDate: '1998-07-14',
      cityId: 'loja',
      idNumber: '',
    });
    expect(text()).toContain('ana@runcty.dev');
    expect(text()).toContain('Tu correo no se puede cambiar.');
    expect(page().hasUnsavedChanges()).toBe(false);
  });

  it('offers a retry when the profile cannot be loaded', async () => {
    get.mockRejectedValueOnce(new ApiError(0, 'network', 'No hay conexión con el servidor.'));
    await create();

    expect(text()).toContain('No hay conexión con el servidor.');
    expect(text()).toContain('Reintentar');
    expect(fixture.nativeElement.querySelector('form')).toBeNull();

    await page()['load']();
    await settle();

    expect(fixture.nativeElement.querySelector('form')).not.toBeNull();
  });

  it('saves the changes, confirms with a notice and has nothing left unsaved', async () => {
    await create();
    page()['form'].patchValue({ firstName: 'Anita', idNumber: '1104567890' });
    expect(page().hasUnsavedChanges()).toBe(true);

    await submit();

    expect(update).toHaveBeenCalledWith({
      firstName: 'Anita',
      lastName: 'Torres',
      birthDate: '1998-07-14',
      cityId: 'loja',
      idNumber: '1104567890',
    });
    expect(text()).toContain('Datos actualizados.');
    expect(page().hasUnsavedChanges()).toBe(false);
  });

  it('sends an empty cédula so the server removes it', async () => {
    get.mockResolvedValue({ ...PROFILE, idNumber: '1104567890' });
    await create();
    page()['form'].patchValue({ idNumber: '' });

    await submit();

    expect(update).toHaveBeenCalledWith(expect.objectContaining({ idNumber: '' }));
  });

  it('validates before calling the server', async () => {
    await create();
    page()['form'].patchValue({ firstName: ' ', birthDate: '2030-01-01' });

    await submit();

    expect(update).not.toHaveBeenCalled();
    expect(text()).not.toContain('Datos actualizados.');
  });

  it('shows the API reason when the save is rejected and keeps the draft', async () => {
    await create();
    page()['form'].patchValue({ firstName: 'Anita' });
    update.mockRejectedValueOnce(
      new ApiError(400, 'invalid-argument', 'Los datos enviados no son válidos.'),
    );

    await submit();

    expect(text()).toContain('Los datos enviados no son válidos.');
    expect(page().hasUnsavedChanges()).toBe(true);
  });

  describe('profile photo', () => {
    const avatarImage = () => fixture.nativeElement.querySelector('app-avatar img') as HTMLImageElement | null;
    const buttonByText = (label: string) =>
      Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('ion-button')).find((button) =>
        button.textContent?.includes(label),
      );
    async function pick(file: Partial<File>): Promise<void> {
      const input = fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;
      Object.defineProperty(input, 'files', { value: [file], configurable: true });
      input.dispatchEvent(new Event('change'));
      await settle();
    }

    it('is titled Editar perfil', async () => {
      await create();

      expect(text()).toContain('Editar perfil');
    });

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

    it('offers the camera and the gallery through a hidden file input for images', async () => {
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

    it('does not mark the personal data form as changed when only the photo changes', async () => {
      await create();

      await pick({ type: 'image/png', size: 5000 });

      expect(page().hasUnsavedChanges()).toBe(false);
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
