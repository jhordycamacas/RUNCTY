import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ApiError } from '../../../core/errors/api-error';
import { ConfirmActionOptions, ConfirmDialog } from '../../../shared/ui/confirm-dialog';
import { ToastService } from '../../../shared/ui/toast.service';
import { AdminRolesStore } from '../application/admin-roles.store';
import { RoleAdminRepository } from '../domain/role';
import {
  FakeRoleAdminRepository,
  fakeRoleAdminRepository,
  role,
  settle,
} from '../testing/fake-role-admin.repository';
import { RolesAdminPage } from './roles-admin.page';

const ROLES = [
  role('admin', {
    name: 'Administrador',
    description: 'Personal de Gacelas',
    system: true,
    permissions: ['admin.access', 'users.read'],
  }),
  role('coach', { name: 'Entrenador', permissions: ['routes.manage'] }),
  role('runner', { name: 'Corredor', system: true }),
];

describe('RolesAdminPage', () => {
  let fixture: ComponentFixture<RolesAdminPage>;
  let repository: FakeRoleAdminRepository;
  let confirmAction: ReturnType<typeof vi.fn<ConfirmDialog['confirmAction']>>;
  let success: ReturnType<typeof vi.fn<ToastService['success']>>;

  const root = () => fixture.nativeElement as HTMLElement;
  const text = () => root().textContent ?? '';
  const names = () =>
    [...root().querySelectorAll('.role-name')].map((el) => el.textContent?.trim());
  const button = (label: string, scope: Element = root()) =>
    [...scope.querySelectorAll('ion-button')].find((el) => el.textContent?.trim() === label);
  const row = (name: string) =>
    [...root().querySelectorAll('.role')].find(
      (el) => el.querySelector('.role-name')?.textContent?.trim() === name,
    ) ?? root();
  const press = async (element: Element | undefined) => {
    expect(element).toBeDefined();
    element?.dispatchEvent(new Event('click'));
    await settle(fixture);
  };

  async function create(): Promise<void> {
    fixture = TestBed.createComponent(RolesAdminPage);
    fixture.detectChanges();
    fixture.componentInstance.ionViewWillEnter();
    await settle(fixture);
  }

  beforeEach(() => {
    repository = fakeRoleAdminRepository();
    repository.list.mockResolvedValue(ROLES);
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
        AdminRolesStore,
        { provide: RoleAdminRepository, useValue: repository },
        { provide: ConfirmDialog, useValue: { confirmAction } },
        { provide: ToastService, useValue: { success } },
      ],
    });
  });

  it('lists every role with its id, description and permissions in Spanish', async () => {
    await create();

    expect(names()).toEqual(['Administrador', 'Entrenador', 'Corredor']);
    expect(text()).toContain('Personal de Gacelas');
    expect(row('Administrador').textContent).toContain('Entrar al panel de administración');
    expect(row('Administrador').textContent).toContain('Consultar usuarios');
    expect(row('Entrenador').textContent).toContain(
      'Gestionar rutas, franjas y factores de riesgo',
    );
    expect(row('Corredor').textContent).toContain('Sin permisos');
    expect(text()).not.toContain('routes.manage');
  });

  it('marks the system roles', async () => {
    await create();

    expect(row('Administrador').textContent).toContain('Del sistema');
    expect(row('Entrenador').textContent).not.toContain('Del sistema');
  });

  it('shows a loading state while the roles arrive', async () => {
    repository.list.mockReturnValue(new Promise<never>(() => undefined));

    await create();

    expect(text()).toContain('Cargando roles…');
  });

  it('shows the error with a retry', async () => {
    repository.list.mockRejectedValueOnce(
      new ApiError(0, 'network', 'No hay conexión con el servidor.'),
    );
    await create();

    expect(text()).toContain('No hay conexión con el servidor.');
    expect(names()).toEqual([]);

    await press(button('Reintentar'));

    expect(names()).toHaveLength(3);
  });

  it('says so when there are no roles', async () => {
    repository.list.mockResolvedValue([]);

    await create();

    expect(text()).toContain('Aún no hay roles.');
  });

  it('offers to delete only the roles that are not from the system', async () => {
    await create();

    expect(button('Eliminar', row('Entrenador'))).toBeDefined();
    expect(button('Eliminar', row('Administrador'))).toBeUndefined();
    expect(button('Editar', row('Administrador'))).toBeDefined();
  });

  it('asks before deleting with a destructive button and drops the role', async () => {
    await create();

    await press(button('Eliminar', row('Entrenador')));

    expect(confirmAction).toHaveBeenCalledWith(
      expect.objectContaining({ confirmText: 'Eliminar', destructive: true }),
    );
    expect(repository.delete).toHaveBeenCalledWith('coach');
    expect(names()).toEqual(['Administrador', 'Corredor']);
    expect(success).toHaveBeenCalledWith('Rol eliminado.');
  });

  it('keeps the role when the deletion is cancelled', async () => {
    confirmAction.mockResolvedValueOnce(false);
    await create();

    await press(button('Eliminar', row('Entrenador')));

    expect(repository.delete).not.toHaveBeenCalled();
    expect(names()).toHaveLength(3);
    expect(success).not.toHaveBeenCalled();
  });

  it('offers the creation of a role', async () => {
    await create();

    expect(button('Nuevo rol')).toBeDefined();
  });
});
