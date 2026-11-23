import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CitiesStore } from '../../../cities/application/cities.store';
import { CityRepository } from '../../../cities/domain/city';
import { AuthService } from '../../../core/auth/auth.service';
import { ApiError } from '../../../core/errors/api-error';
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
import { AdminUsersStore } from '../application/admin-users.store';
import { UserAdminRepository } from '../domain/managed-user';
import {
  FakeUserAdminRepository,
  fakeUserAdminRepository,
  user,
} from '../testing/fake-user-admin.repository';
import { UsersAdminPage } from './users-admin.page';

const USERS = [
  user('ana', { firstName: 'Ana', lastName: 'Pérez', role: 'admin', cityId: 'loja' }),
  user('luis', { firstName: 'Luis', lastName: 'Mora', role: 'runner', cityId: 'quito' }),
  user('nora', { firstName: 'Nora', lastName: 'Sol', role: null }),
];

describe('UsersAdminPage', () => {
  let fixture: ComponentFixture<UsersAdminPage>;
  let users: FakeUserAdminRepository;
  let roles: FakeRoleAdminRepository;
  let confirmAction: ReturnType<typeof vi.fn<ConfirmDialog['confirmAction']>>;
  let success: ReturnType<typeof vi.fn<ToastService['success']>>;
  let canAssign: boolean;

  const root = () => fixture.nativeElement as HTMLElement;
  const text = () => root().textContent ?? '';
  const names = () =>
    [...root().querySelectorAll('.user-name')].map((el) => el.textContent?.trim());
  const row = (name: string) =>
    [...root().querySelectorAll('.user')].find(
      (el) => el.querySelector('.user-name')?.textContent?.trim() === name,
    ) ?? root();
  const roleSelect = (name: string) => row(name).querySelector('select') as HTMLSelectElement;
  const button = (label: string) =>
    [...root().querySelectorAll('ion-button')].find((el) => el.textContent?.trim() === label);
  const press = async (element: Element | undefined) => {
    expect(element).toBeDefined();
    element?.dispatchEvent(new Event('click'));
    await settle(fixture);
  };
  const submit = async () => {
    root().querySelector('form')?.dispatchEvent(new Event('submit'));
    await settle(fixture);
  };
  const searchInput = () => root().querySelector('ion-input[type="search"]') as HTMLElement;
  const type = (value: string) =>
    searchInput().dispatchEvent(new CustomEvent('ionInput', { detail: { value } }));

  async function create(): Promise<void> {
    fixture = TestBed.createComponent(UsersAdminPage);
    fixture.detectChanges();
    fixture.componentInstance.ionViewWillEnter();
    await settle(fixture);
  }

  beforeEach(() => {
    canAssign = true;
    users = fakeUserAdminRepository();
    users.search.mockResolvedValue({ users: USERS, nextCursor: null });
    roles = fakeRoleAdminRepository();
    roles.list.mockResolvedValue([
      role('admin', { name: 'Administrador' }),
      role('runner', { name: 'Corredor' }),
    ]);
    confirmAction = vi
      .fn<ConfirmDialog['confirmAction']>()
      .mockImplementation(async (options: ConfirmActionOptions) => {
        await options.run();
        return true;
      });
    success = vi.fn<ToastService['success']>().mockResolvedValue(undefined);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        AdminUsersStore,
        AdminRolesStore,
        CitiesStore,
        { provide: UserAdminRepository, useValue: users },
        { provide: RoleAdminRepository, useValue: roles },
        {
          provide: CityRepository,
          useValue: {
            list: async () => [
              { id: 'loja', name: 'Loja', type: 'city' },
              { id: 'quito', name: 'Quito', type: 'city' },
            ],
          },
        },
        { provide: AuthService, useValue: { can: () => canAssign } },
        { provide: ConfirmDialog, useValue: { confirmAction } },
        { provide: ToastService, useValue: { success } },
      ],
    });
  });

  it('lists the users with email, city and the name of their role', async () => {
    canAssign = false;
    await create();

    expect(names()).toEqual(['Ana Pérez', 'Luis Mora', 'Nora Sol']);
    expect(row('Ana Pérez').textContent).toContain('ana@mail.com');
    expect(row('Ana Pérez').textContent).toContain('Loja');
    expect(row('Ana Pérez').textContent).toContain('Administrador');
    expect(row('Luis Mora').textContent).toContain('Corredor');
    expect(row('Nora Sol').textContent).toContain('Sin rol');
    expect(text()).not.toContain('idNumber');
  });

  it('shows a loading state while the users arrive', async () => {
    users.search.mockReturnValueOnce(new Promise<never>(() => undefined));
    await create();
    expect(text()).toContain('Cargando usuarios…');
  });

  it('shows the error with a retry', async () => {
    users.search.mockRejectedValueOnce(
      new ApiError(0, 'network', 'No hay conexión con el servidor.'),
    );
    await create();

    expect(text()).toContain('No hay conexión con el servidor.');
    expect(names()).toEqual([]);

    await press(button('Reintentar'));

    expect(names()).toHaveLength(3);
  });

  it('says so when nobody matches', async () => {
    users.search.mockResolvedValue({ users: [], nextCursor: null });

    await create();

    expect(text()).toContain('No hay usuarios que coincidan con la búsqueda.');
  });

  it('has one search box and nothing else to filter by', async () => {
    await create();

    expect(root().querySelectorAll('ion-input')).toHaveLength(1);
    expect(searchInput().getAttribute('label')).toBe('Buscar por cédula, correo o nombre');
    expect(root().querySelector('app-text-field, app-select-field')).toBeNull();
    expect(text()).toContain('Escribe una cédula de 10 dígitos, un correo o parte del nombre.');
  });

  it('lists everyone the first time', async () => {
    await create();

    expect(users.search).toHaveBeenCalledWith('', null);
  });

  it('searches with the trimmed text when the form is submitted (Enter or the button)', async () => {
    await create();
    type('  Ana ');

    await submit();

    expect(users.search).toHaveBeenLastCalledWith('Ana', null);
    expect(button('Buscar')).toBeDefined();
  });

  it('searches by a cédula or an email as plain text', async () => {
    await create();

    type('1710034065');
    await submit();
    expect(users.search).toHaveBeenLastCalledWith('1710034065', null);

    type('ana@mail.com');
    await submit();
    expect(users.search).toHaveBeenLastCalledWith('ana@mail.com', null);
  });

  it('clears the text and lists everyone again', async () => {
    await create();
    type('Ana');
    await submit();

    await press(button('Limpiar'));

    expect((searchInput() as unknown as { value: string }).value).toBe('');
    expect(users.search).toHaveBeenLastCalledWith('', null);
    await submit();
    expect(users.search).toHaveBeenLastCalledWith('', null);
  });

  it('links every name to the detail of the user', async () => {
    await create();

    const link = root().querySelector('a.user-name') as HTMLAnchorElement;
    expect(link.textContent?.trim()).toBe('Ana Pérez');
    expect(link.getAttribute('href')).toBe('/admin/usuarios/ana');
    expect(
      [...root().querySelectorAll('a.user-name')].map((el) => el.getAttribute('href')),
    ).toEqual(['/admin/usuarios/ana', '/admin/usuarios/luis', '/admin/usuarios/nora']);
  });

  it('offers more users when there is a next page, and appends them', async () => {
    users.search.mockResolvedValueOnce({ users: USERS, nextCursor: 'nora' });
    await create();
    expect(button('Cargar más')).toBeDefined();

    users.search.mockResolvedValueOnce({
      users: [user('zoe', { firstName: 'Zoe' })],
      nextCursor: null,
    });
    await press(button('Cargar más'));

    expect(users.search).toHaveBeenLastCalledWith('', 'nora');
    expect(names()).toHaveLength(4);
    expect(button('Cargar más')).toBeUndefined();
  });

  it('explains a rejected cursor and stops offering more', async () => {
    users.search.mockResolvedValueOnce({ users: USERS, nextCursor: 'nora' });
    await create();
    users.search.mockRejectedValueOnce(
      new ApiError(
        400,
        'invalid-cursor',
        'No se pudo cargar la página siguiente. Vuelve a buscar.',
      ),
    );

    await press(button('Cargar más'));

    expect(text()).toContain('Vuelve a buscar.');
    expect(button('Cargar más')).toBeUndefined();
    expect(names()).toHaveLength(3);
  });

  it('changes the role after confirming, and says so', async () => {
    await create();
    const select = roleSelect('Luis Mora');
    expect(select.value).toBe('runner');

    select.value = 'admin';
    select.dispatchEvent(new Event('change'));
    await settle(fixture);

    expect(confirmAction).toHaveBeenCalledWith(
      expect.objectContaining({ header: 'Cambiar rol', confirmText: 'Cambiar rol' }),
    );
    expect(confirmAction.mock.calls[0][0].message).toContain('Luis Mora');
    expect(roles.setUserRole).toHaveBeenCalledWith('luis', 'admin');
    expect(roleSelect('Luis Mora').value).toBe('admin');
    expect(success).toHaveBeenCalledWith('Rol actualizado.');
  });

  it('leaves the role as it was when the change is cancelled', async () => {
    confirmAction.mockResolvedValueOnce(false);
    await create();
    const select = roleSelect('Luis Mora');

    select.value = 'admin';
    select.dispatchEvent(new Event('change'));
    await settle(fixture);

    expect(roles.setUserRole).not.toHaveBeenCalled();
    expect(roleSelect('Luis Mora').value).toBe('runner');
    expect(success).not.toHaveBeenCalled();
  });

  it('keeps the role when the API rejects the change', async () => {
    roles.setUserRole.mockRejectedValueOnce(
      new ApiError(412, 'last-admin', 'Debe quedar al menos un administrador.'),
    );
    confirmAction.mockImplementationOnce(async (options: ConfirmActionOptions) => {
      await options.run().catch(() => undefined);
      return false;
    });
    await create();
    const select = roleSelect('Ana Pérez');

    select.value = 'runner';
    select.dispatchEvent(new Event('change'));
    await settle(fixture);

    expect(roleSelect('Ana Pérez').value).toBe('admin');
    expect(success).not.toHaveBeenCalled();
  });

  it('only reads the roles when the admin cannot assign them', async () => {
    canAssign = false;
    await create();

    expect(root().querySelector('select.role-select')).toBeNull();
  });

  it('labels every control', async () => {
    await create();

    expect(root().querySelector('select.role-select')?.getAttribute('aria-label')).toBe(
      'Rol de Ana Pérez',
    );
    expect(searchInput().getAttribute('label')).toBeTruthy();
  });
});
