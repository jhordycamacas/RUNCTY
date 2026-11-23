import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { CitiesStore } from '../../../cities/application/cities.store';
import { CityRepository } from '../../../cities/domain/city';
import { CatalogRepository } from '../../../core/catalogs/catalog';
import { fakeCatalogRepository } from '../../../core/catalogs/testing/fake-catalog.repository';
import { AuthService } from '../../../core/auth/auth.service';
import { ApiError } from '../../../core/errors/api-error';
import { DEFAULT_SETTINGS } from '../../../core/settings/system-settings';
import { SystemSettingsStore } from '../../../core/settings/system-settings.store';
import { ConfirmActionOptions, ConfirmDialog } from '../../../shared/ui/confirm-dialog';
import { ToastService } from '../../../shared/ui/toast.service';
import { AdminRolesStore } from '../../roles/application/admin-roles.store';
import { RoleAdminRepository } from '../../roles/domain/role';
import {
  FakeRoleAdminRepository,
  fakeRoleAdminRepository,
  role,
  settle,
} from '../../roles/testing/fake-role-admin.repository';
import { UserDetailStore } from '../application/user-detail.store';
import { UserAdminRepository } from '../domain/managed-user';
import {
  FakeUserAdminRepository,
  fakeUserAdminRepository,
  userDetail,
} from '../testing/fake-user-admin.repository';
import { UserDetailPage } from './user-detail.page';
import { UserPersonalEdit } from './user-personal-edit';
import { UserSportEdit } from './user-sport-edit';

/** Ionic moves `aria-label` into the native button, so the icon buttons are found by class. */
const PENCILS: Record<string, string> = {
  'Editar perfil personal': 'ion-button.edit-personal',
  'Editar perfil deportivo': 'ion-button.edit-sport',
};

describe('UserDetailPage', () => {
  let fixture: ComponentFixture<UserDetailPage>;
  let users: FakeUserAdminRepository;
  let roles: FakeRoleAdminRepository;
  let canManage: boolean;
  let ownUid: string;
  let confirm: ReturnType<typeof vi.fn<ConfirmDialog['confirm']>>;
  let confirmAction: ReturnType<typeof vi.fn<ConfirmDialog['confirmAction']>>;
  let success: ReturnType<typeof vi.fn<ToastService['success']>>;

  const root = () => fixture.nativeElement as HTMLElement;
  const text = () => root().textContent?.replace(/\s+/g, ' ') ?? '';
  const panel = (title: string) =>
    [...root().querySelectorAll('section')].find(
      (el) => el.querySelector('h2')?.textContent?.trim() === title,
    ) as HTMLElement;
  const panelText = (title: string) => panel(title)?.textContent?.replace(/\s+/g, ' ') ?? '';
  const button = (label: string) =>
    [...root().querySelectorAll('ion-button')].find((el) => el.textContent?.trim() === label);

  const byLabel = (label: string) => root().querySelector(PENCILS[label]) as HTMLElement | null;
  const press = async (element: Element | null | undefined) => {
    expect(element).toBeTruthy();
    element?.dispatchEvent(new Event('click'));
    await settle(fixture);
  };
  const submitForm = async () => {
    root().querySelector('form')?.dispatchEvent(new Event('submit'));
    await settle(fixture);
  };
  /** The messages the fields of the open form show; Ionic draws them inside its own shadow DOM. */
  const fieldErrors = () =>
    fixture.debugElement
      .queryAll(By.css('[formcontrolname]'))
      .map((field) => field.componentInstance.error?.() as string | null | undefined)
      .filter((message): message is string => !!message);
  const personalForm = () =>
    fixture.debugElement.query(By.directive(UserPersonalEdit)).componentInstance['form'];
  const sportForm = () =>
    fixture.debugElement.query(By.directive(UserSportEdit)).componentInstance['form'];

  async function create(): Promise<void> {
    fixture = TestBed.createComponent(UserDetailPage);
    fixture.detectChanges();
    fixture.componentInstance.ionViewWillEnter();
    await settle(fixture);
  }

  beforeEach(() => {
    canManage = true;
    ownUid = 'admin-1';
    confirm = vi.fn<ConfirmDialog['confirm']>().mockResolvedValue(true);
    confirmAction = vi
      .fn<ConfirmDialog['confirmAction']>()
      .mockImplementation(async (options: ConfirmActionOptions) => {
        await options.run();
        return true;
      });
    success = vi.fn<ToastService['success']>().mockResolvedValue(undefined);
    users = fakeUserAdminRepository();
    users.get.mockResolvedValue(userDetail('u1'));
    roles = fakeRoleAdminRepository();
    roles.list.mockResolvedValue([role('runner', { name: 'Corredor' })]);
    const catalogs = fakeCatalogRepository({
      sportLevels: [
        { code: 'beginner', label: 'Principiante', order: 1, active: true },
        { code: 'legacy', label: 'Antiguo', order: 2, active: false },
      ],
    });
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: { can: () => canManage, session: () => ({ uid: ownUid }) },
        },
        { provide: ConfirmDialog, useValue: { confirm, confirmAction } },
        { provide: ToastService, useValue: { success } },
        UserDetailStore,
        AdminRolesStore,
        CitiesStore,
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ uid: 'u1' }) } },
        },
        { provide: UserAdminRepository, useValue: users },
        { provide: RoleAdminRepository, useValue: roles },
        {
          provide: CityRepository,
          useValue: { list: async () => [{ id: 'loja', name: 'Loja', type: 'city' }] },
        },
        { provide: CatalogRepository, useValue: catalogs },
        {
          provide: SystemSettingsStore,
          useValue: { settings: signal({ ...DEFAULT_SETTINGS }), load: async () => undefined },
        },
      ],
    });
  });

  it('asks for the user of the route and titles the page with the full name', async () => {
    await create();

    expect(users.get).toHaveBeenCalledWith('u1');
    expect(root().querySelector('app-admin-header h1')?.textContent).toContain('Ana Pérez');
  });

  it('shows a loading state while the user arrives', async () => {
    users.get.mockReturnValueOnce(new Promise<never>(() => undefined));
    await create();

    expect(text()).toContain('Cargando usuario…');
    expect(root().querySelector('app-admin-header h1')?.textContent).toContain('Usuario');
  });

  it('has the three panels and, for who manages users, the delete zone', async () => {
    await create();

    expect([...root().querySelectorAll('section h2')].map((el) => el.textContent?.trim())).toEqual([
      'Perfil personal',
      'Perfil deportivo',
      'Valoración',
      'Eliminar usuario',
    ]);
  });

  describe('personal profile', () => {
    it('shows the data with the names of the city and the role', async () => {
      await create();

      const personal = panelText('Perfil personal');
      expect(personal).toContain('Ana Pérez');
      expect(personal).toContain('ana@mail.com');
      expect(personal).toContain('1710034065');
      expect(personal).toContain('23 de abril de 1995');
      expect(personal).toMatch(/\(\d+ años\)/);
      expect(personal).toContain('Loja');
      expect(personal).toContain('Corredor');
      expect(personal).toContain('5 de marzo de 2026');
    });

    it('tags the email as verified or not only when the API says so', async () => {
      await create();
      expect(panelText('Perfil personal')).toContain('Verificado');
      expect(panelText('Perfil personal')).not.toContain('Sin verificar');
    });

    it('says an email is not verified', async () => {
      const detail = userDetail('u1');
      users.get.mockResolvedValue({ ...detail, user: { ...detail.user, emailVerified: false } });
      await create();

      expect(panelText('Perfil personal')).toContain('Sin verificar');
    });

    it('shows no verification tag, creation date or cédula that the API does not send', async () => {
      const detail = userDetail('u1');
      users.get.mockResolvedValue({
        ...detail,
        user: { ...detail.user, emailVerified: null, createdAt: null, idNumber: null, role: null },
      });
      await create();

      const personal = panelText('Perfil personal');
      expect(personal).not.toContain('Verificado');
      expect(personal).not.toContain('Sin verificar');
      expect(personal).not.toContain('Registrado');
      expect(personal).toContain('No registrada');
      expect(personal).toContain('Sin rol');
    });
  });

  describe('sport profile', () => {
    it('shows level and goals with the labels of the catalogs, and pace and distance', async () => {
      await create();

      const sport = panelText('Perfil deportivo');
      expect(sport).toContain('Principiante');
      expect(sport).toContain('Salud');
      expect(sport).toContain('Mejorar mi ritmo');
      expect(sport).toContain('6:30 min/km');
      expect(sport).toContain('10 km');
      expect(sport).not.toContain('beginner');
    });

    it('labels an inactive code and shows the raw code of an unknown one', async () => {
      const detail = userDetail('u1');
      users.get.mockResolvedValue({
        ...detail,
        sportProfile: { ...detail.sportProfile!, level: 'legacy', goals: ['health', 'gone'] },
      });
      await create();

      const sport = panelText('Perfil deportivo');
      expect(sport).toContain('Antiguo');
      expect(sport).toContain('gone');
    });

    it('says so when the user has not completed it', async () => {
      users.get.mockResolvedValue(userDetail('u1', { sportProfile: null }));
      await create();

      expect(panelText('Perfil deportivo')).toContain(
        'Este usuario aún no completó su perfil deportivo.',
      );
    });

    it('does not invent the pace or the distance the API leaves out', async () => {
      const detail = userDetail('u1');
      users.get.mockResolvedValue({
        ...detail,
        sportProfile: {
          ...detail.sportProfile!,
          usualPaceSecPerKm: null,
          preferredDistanceKm: null,
        },
      });
      await create();

      expect(panelText('Perfil deportivo')).not.toContain('min/km');
      expect(panelText('Perfil deportivo')).toContain('No indicado');
    });
  });

  describe('rating', () => {
    it('shows the stars with their text alternative', async () => {
      await create();

      expect(
        panel('Valoración')
          .querySelector('app-rating-stars [role="img"]')
          ?.getAttribute('aria-label'),
      ).toBe('4,3 de 5 estrellas, 12 valoraciones');
    });

    it('says so when nobody rated the user, or the API sends no rating', async () => {
      users.get.mockResolvedValue(userDetail('u1', { rating: null }));
      await create();

      expect(panelText('Valoración')).toContain('Aún no tiene valoraciones.');
      expect(panel('Valoración').querySelector('app-rating-stars')).toBeNull();
    });
  });

  describe('failures', () => {
    it('says the user does not exist', async () => {
      users.get.mockRejectedValue(new ApiError(404, 'user-not-found', 'No encontrado.'));
      await create();

      expect(text()).toContain('No encontramos a este usuario.');
      expect(root().querySelector('section')).toBeNull();
      expect(button('Reintentar')).toBeUndefined();
    });

    it('shows the error with a retry that asks again', async () => {
      users.get.mockRejectedValueOnce(
        new ApiError(0, 'network', 'No hay conexión con el servidor.'),
      );
      await create();

      expect(text()).toContain('No hay conexión con el servidor.');

      button('Reintentar')?.dispatchEvent(new Event('click'));
      await settle(fixture);

      expect(users.get).toHaveBeenCalledTimes(2);
      expect(panelText('Perfil personal')).toContain('ana@mail.com');
    });
  });

  describe('editing', () => {
    it('shows the pencils and the delete zone only to who may manage users', async () => {
      await create();
      expect(byLabel('Editar perfil personal')).not.toBeNull();
      expect(byLabel('Editar perfil deportivo')).not.toBeNull();
      expect(button('Eliminar usuario')).toBeDefined();

      canManage = false;
      await create();
      expect(byLabel('Editar perfil personal')).toBeNull();
      expect(byLabel('Editar perfil deportivo')).toBeNull();
      expect(button('Eliminar usuario')).toBeUndefined();
    });

    it('opens the personal form with the data, the email read-only and a Cancel that closes it', async () => {
      await create();
      await press(byLabel('Editar perfil personal'));

      expect(personalForm().getRawValue()).toEqual({
        firstName: 'Ana',
        lastName: 'Pérez',
        birthDate: '1995-04-23',
        cityId: 'loja',
        idNumber: '1710034065',
      });
      expect(panelText('Perfil personal')).toContain('ana@mail.com');
      expect(panelText('Perfil personal')).toContain(
        'El correo es el acceso del usuario y no se puede cambiar aquí',
      );

      await press(button('Cancelar'));

      expect(panel('Perfil personal').querySelector('form')).toBeNull();
      expect(byLabel('Editar perfil personal')).not.toBeNull();
    });

    it('validates with the rules of the runner form and sends nothing while invalid', async () => {
      await create();
      await press(byLabel('Editar perfil personal'));
      personalForm().patchValue({ firstName: ' ', idNumber: '12' });

      await submitForm();

      expect(users.updatePersonalData).not.toHaveBeenCalled();
      expect(fieldErrors()).toEqual(['Ingresa tus nombres.', 'La cédula debe tener 10 dígitos.']);
    });

    it('saves the personal data, shows it without reloading and says so', async () => {
      await create();
      await press(byLabel('Editar perfil personal'));
      personalForm().patchValue({ firstName: ' Anita ' });

      await submitForm();

      expect(users.updatePersonalData).toHaveBeenCalledWith('u1', {
        firstName: 'Anita',
        lastName: 'Pérez',
        birthDate: '1995-04-23',
        cityId: 'loja',
        idNumber: '1710034065',
      });
      expect(success).toHaveBeenCalledWith('Datos actualizados.');
      expect(users.get).toHaveBeenCalledTimes(1);
      expect(panel('Perfil personal').querySelector('form')).toBeNull();
      expect(root().querySelector('app-admin-header h1')?.textContent).toContain('Anita Pérez');
    });

    it('puts the field errors of the API under the fields and keeps the form open', async () => {
      users.updatePersonalData.mockRejectedValueOnce(
        new ApiError(400, 'invalid-argument', 'Los datos enviados no son válidos.', {
          idNumber: 'invalid-format',
        }),
      );
      await create();
      await press(byLabel('Editar perfil personal'));

      await submitForm();

      expect(fieldErrors()).toEqual(['La cédula debe tener 10 dígitos.']);
      expect(success).not.toHaveBeenCalled();
      expect(panel('Perfil personal').querySelector('form')).not.toBeNull();
    });

    it('shows any other failure in the form', async () => {
      users.updatePersonalData.mockRejectedValueOnce(
        new ApiError(0, 'network', 'No hay conexión con el servidor.'),
      );
      await create();
      await press(byLabel('Editar perfil personal'));

      await submitForm();

      expect(panelText('Perfil personal')).toContain('No hay conexión con el servidor.');
    });

    it('edits the sport profile with the active options plus the current inactive level', async () => {
      const detail = userDetail('u1');
      users.get.mockResolvedValue({
        ...detail,
        sportProfile: { ...detail.sportProfile!, level: 'legacy' },
      });
      await create();
      await press(byLabel('Editar perfil deportivo'));

      const select = panel('Perfil deportivo').querySelector('select') as HTMLSelectElement;
      expect([...select.options].map((option) => option.value)).toEqual(['', 'beginner', 'legacy']);
      expect(sportForm().getRawValue()).toMatchObject({
        level: 'legacy',
        pace: '6:30',
        distance: '10',
      });
    });

    it('saves the sport profile and says so', async () => {
      await create();
      await press(byLabel('Editar perfil deportivo'));
      sportForm().patchValue({ pace: '5:45', distance: '21,5' });

      await submitForm();

      expect(users.saveSportProfile).toHaveBeenCalledWith('u1', {
        level: 'beginner',
        goals: ['health', 'pace'],
        usualPaceSecPerKm: 345,
        preferredDistanceKm: 21.5,
      });
      expect(success).toHaveBeenCalledWith('Perfil deportivo actualizado.');
      expect(panelText('Perfil deportivo')).toContain('5:45 min/km');
      expect(panel('Perfil deportivo').querySelector('form')).toBeNull();
    });

    it('does not send a pace outside the range of the settings', async () => {
      await create();
      await press(byLabel('Editar perfil deportivo'));
      sportForm().patchValue({ pace: '0:10' });

      await submitForm();

      expect(users.saveSportProfile).not.toHaveBeenCalled();
      expect(fieldErrors()).toEqual([expect.stringContaining('El ritmo debe estar entre')]);
    });

    it('maps the field errors of the API of the sport profile', async () => {
      users.saveSportProfile.mockRejectedValueOnce(
        new ApiError(400, 'invalid-argument', 'Los datos enviados no son válidos.', {
          usualPaceSecPerKm: 'out-of-range',
        }),
      );
      await create();
      await press(byLabel('Editar perfil deportivo'));

      await submitForm();

      expect(fieldErrors()).toEqual(['Está fuera del rango permitido.']);
    });

    it('clears the sport profile after confirming', async () => {
      await create();
      await press(byLabel('Editar perfil deportivo'));

      await press(button('Borrar perfil deportivo'));

      expect(confirm).toHaveBeenCalledWith(expect.objectContaining({ destructive: true }));
      expect(users.clearSportProfile).toHaveBeenCalledWith('u1');
      expect(panelText('Perfil deportivo')).toContain(
        'Este usuario aún no completó su perfil deportivo.',
      );
    });

    it('keeps the sport profile when declined, and offers no clearing without one', async () => {
      confirm.mockResolvedValueOnce(false);
      await create();
      await press(byLabel('Editar perfil deportivo'));
      await press(button('Borrar perfil deportivo'));
      expect(users.clearSportProfile).not.toHaveBeenCalled();

      users.get.mockResolvedValue(userDetail('u1', { sportProfile: null }));
      await create();
      await press(byLabel('Editar perfil deportivo'));
      expect(button('Borrar perfil deportivo')).toBeUndefined();
    });
  });

  describe('deleting', () => {
    it('confirms with what is lost, deletes, says so and goes back to the list', async () => {
      const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
      await create();

      await press(button('Eliminar usuario'));

      expect(confirmAction).toHaveBeenCalledWith(
        expect.objectContaining({
          destructive: true,
          message: expect.stringContaining('no se puede deshacer'),
        }),
      );
      expect(users.remove).toHaveBeenCalledWith('u1');
      expect(success).toHaveBeenCalledWith('Usuario eliminado.');
      expect(navigate).toHaveBeenCalledWith('/admin/usuarios');
    });

    it('does not delete when the confirmation is declined', async () => {
      confirmAction.mockResolvedValueOnce(false);
      await create();

      await press(button('Eliminar usuario'));

      expect(users.remove).not.toHaveBeenCalled();
      expect(success).not.toHaveBeenCalled();
    });

    it('refuses to delete the own account and says why', async () => {
      ownUid = 'u1';
      await create();

      expect(text()).toContain('No puedes eliminar tu propia cuenta');
      const remove = button('Eliminar usuario');
      expect(
        remove?.hasAttribute('disabled') || remove?.getAttribute('aria-disabled') === 'true',
      ).toBe(true);
    });

    it('lets the dialog show the refusal of the API', async () => {
      users.remove.mockRejectedValueOnce(
        new ApiError(409, 'last-admin', 'Debe quedar al menos un administrador.'),
      );
      confirmAction.mockImplementationOnce(async (options) => {
        await expect(options.run()).rejects.toMatchObject({
          message: 'Debe quedar al menos un administrador.',
        });
        return false;
      });
      await create();

      await press(button('Eliminar usuario'));

      expect(success).not.toHaveBeenCalled();
    });
  });
});
