import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { ApiError } from '../../../core/errors/api-error';
import { ToastService } from '../../../shared/ui/toast.service';
import { AdminRolesStore } from '../application/admin-roles.store';
import { RoleAdminRepository } from '../domain/role';
import { RoleForm } from '../domain/role-form';
import {
  FakeRoleAdminRepository,
  fakeRoleAdminRepository,
  role,
  settle,
} from '../testing/fake-role-admin.repository';
import { RoleFormPage } from './role-form.page';

const STORED = role('coach', {
  name: 'Entrenador',
  description: 'Apoya a los clubes',
  permissions: ['admin.access'],
});

describe('RoleFormPage', () => {
  let fixture: ComponentFixture<RoleFormPage>;
  let repository: FakeRoleAdminRepository;
  let success: ReturnType<typeof vi.fn<ToastService['success']>>;
  let navigate: ReturnType<typeof vi.spyOn>;
  let roleId: string | null;

  const root = () => fixture.nativeElement as HTMLElement;
  const text = () => root().textContent ?? '';
  const page = () => fixture.componentInstance;
  const form = () => page()['form'];
  const checkbox = (label: string) =>
    [...root().querySelectorAll<HTMLInputElement>('input[type="checkbox"]')].find((input) =>
      input.closest('label')?.textContent?.includes(label),
    );

  async function create(id: string | null): Promise<void> {
    roleId = id;
    navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    fixture = TestBed.createComponent(RoleFormPage);
    fixture.detectChanges();
    await settle(fixture);
  }
  async function submit(): Promise<void> {
    root().querySelector('form')?.dispatchEvent(new Event('submit'));
    await settle(fixture);
  }

  beforeEach(() => {
    repository = fakeRoleAdminRepository();
    repository.list.mockResolvedValue([STORED]);
    success = vi.fn<ToastService['success']>().mockResolvedValue(undefined);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        AdminRolesStore,
        { provide: RoleAdminRepository, useValue: repository },
        { provide: ToastService, useValue: { success } },
        {
          provide: ActivatedRoute,
          useFactory: () => ({
            snapshot: { paramMap: convertToParamMap(roleId ? { id: roleId } : {}) },
          }),
        },
      ],
    });
  });

  it('creates a role from the checklist, confirms it and goes back to the list', async () => {
    await create(null);
    expect(text()).toContain('Nuevo rol');
    form().patchValue({ id: 'scout', name: 'Explorador' } satisfies Partial<RoleForm>);
    checkbox('Gestionar rutas')?.click();
    checkbox('Consultar usuarios')?.click();
    await settle(fixture);

    await submit();

    expect(repository.create).toHaveBeenCalledWith({
      id: 'scout',
      name: 'Explorador',
      permissions: ['users.read', 'routes.manage'],
    });
    expect(success).toHaveBeenCalledWith('Rol creado.');
    expect(navigate).toHaveBeenCalledWith('/admin/roles');
    expect(page().hasUnsavedChanges()).toBe(false);
  });

  it('groups the permission checklist by area, every permission named in Spanish', async () => {
    await create(null);

    const groups = [...root().querySelectorAll('fieldset legend')].map((el) =>
      el.textContent?.trim(),
    );
    expect(groups).toEqual([
      'Acceso',
      'Cuentas y roles',
      'Ciudades y rutas',
      'Comunidad y alianzas',
      'Sistema',
    ]);
    expect(root().querySelectorAll('input[type="checkbox"]')).toHaveLength(9);
  });

  it('shows the field messages in Spanish and sends nothing when the input is invalid', async () => {
    await create(null);

    await submit();

    expect(repository.create).not.toHaveBeenCalled();
    expect(text()).toContain('El nombre es obligatorio.');
    expect(text()).toContain('minúsculas');
  });

  it('shows the API rejection in the form and keeps what was typed', async () => {
    repository.create.mockRejectedValueOnce(
      new ApiError(409, 'role-exists', 'Ya existe un rol con ese identificador.'),
    );
    await create(null);
    form().patchValue({ id: 'coach', name: 'Entrenador' });

    await submit();

    expect(text()).toContain('Ya existe un rol con ese identificador.');
    expect(form().getRawValue().name).toBe('Entrenador');
    expect(success).not.toHaveBeenCalled();
  });

  it('preloads the role to edit, keeps its id fixed and tells how many users were updated', async () => {
    repository.update.mockResolvedValue(2);
    await create('coach');

    expect(text()).toContain('Editar rol');
    expect(form().getRawValue()).toEqual({
      id: 'coach',
      name: 'Entrenador',
      description: 'Apoya a los clubes',
      permissions: ['admin.access'],
    });
    expect(form().controls.id.disabled).toBe(true);
    expect(checkbox('Entrar al panel')?.checked).toBe(true);
    expect(page().hasUnsavedChanges()).toBe(false);

    form().patchValue({ name: 'Coach' });
    expect(page().hasUnsavedChanges()).toBe(true);
    await submit();

    expect(repository.update).toHaveBeenCalledWith('coach', {
      name: 'Coach',
      description: 'Apoya a los clubes',
      permissions: ['admin.access'],
    });
    expect(success).toHaveBeenCalledWith(
      'Rol actualizado. Se actualizó el acceso de 2 usuarios.',
    );
    expect(navigate).toHaveBeenCalledWith('/admin/roles');
  });

  it('only says "Rol actualizado." when no user had the role', async () => {
    await create('coach');
    form().patchValue({ name: 'Coach' });

    await submit();

    expect(success).toHaveBeenCalledWith('Rol actualizado.');
  });

  it('moves the focus to the form heading once it is ready', async () => {
    await create('coach');

    expect(document.activeElement?.textContent?.trim()).toBe('Editar rol');
  });

  it('says so when the role no longer exists', async () => {
    await create('ghost');

    expect(text()).toContain('El rol ya no existe.');
    expect(root().querySelector('form')).toBeNull();
  });

  it('shows the loading failure with a retry', async () => {
    repository.list.mockRejectedValueOnce(new ApiError(0, 'network', 'Sin conexión.'));
    await create('coach');
    expect(text()).toContain('Sin conexión.');

    const retry = [...root().querySelectorAll('ion-button')].find(
      (el) => el.textContent?.trim() === 'Reintentar',
    );
    retry?.dispatchEvent(new Event('click'));
    await settle(fixture);

    expect(text()).toContain('Editar rol');
  });
});
