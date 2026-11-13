import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CityRepository } from '../../cities/domain/city';
import { AuthService } from '../../core/auth/auth.service';
import { ApiError } from '../../core/errors/api-error';
import { Profile, ProfileRepository } from '../domain/profile';
import { EditPersonalDataPage } from './edit-personal-data.page';

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
});
