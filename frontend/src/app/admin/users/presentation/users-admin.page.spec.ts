import { ComponentFixture, TestBed } from '@angular/core/testing';
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
  const names = () => [...root().querySelectorAll('.user-name')].map((el) => el.textContent?.trim());
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
  const form = () => fixture.componentInstance['form'];

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

  it('searches with only the filters that have a value', async () => {
    await create();
    form().patchValue({ firstName: ' Ana ', cityId: 'loja' });

    await submit();

    expect(users.search).toHaveBeenLastCalledWith({ firstName: 'Ana', cityId: 'loja' }, null);
  });

  it('shows the field message and sends nothing for an invalid filter', async () => {
    await create();
    users.search.mockClear();
    form().patchValue({ idNumber: '123', birthDate: '23/04/1995' });

    await submit();

    expect(users.search).not.toHaveBeenCalled();
    expect(root().querySelector('.filter-error')?.textContent).toContain(
      'La identificación debe tener 10 dígitos.',
    );
    expect(root().querySelector('.filter-error')?.textContent).toContain('AAAA-MM-DD');
  });

  it('clears the filters and lists everyone again', async () => {
    await create();
    form().patchValue({ firstName: 'Ana' });
    await submit();

    await press(button('Limpiar'));

    expect(form().getRawValue().firstName).toBe('');
    expect(users.search).toHaveBeenLastCalledWith({}, null);
  });

  it('offers more users when there is a next page, and appends them', async () => {
    users.search.mockResolvedValueOnce({ users: USERS, nextCursor: 'nora' });
    await create();
    expect(button('Cargar más')).toBeDefined();

    users.search.mockResolvedValueOnce({ users: [user('zoe', { firstName: 'Zoe' })], nextCursor: null });
    await press(button('Cargar más'));

    expect(users.search).toHaveBeenLastCalledWith({}, 'nora');
    expect(names()).toHaveLength(4);
    expect(button('Cargar más')).toBeUndefined();
  });

  it('explains a rejected cursor and stops offering more', async () => {
    users.search.mockResolvedValueOnce({ users: USERS, nextCursor: 'nora' });
    await create();
    users.search.mockRejectedValueOnce(
      new ApiError(400, 'invalid-cursor', 'No se pudo cargar la página siguiente. Vuelve a buscar.'),
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
    expect(root().querySelector('app-select-field label')?.textContent).toContain('Ciudad');
    expect(root().querySelectorAll('app-text-field')).toHaveLength(5);
  });
});
