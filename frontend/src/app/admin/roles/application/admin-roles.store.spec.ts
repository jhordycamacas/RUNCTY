import { TestBed } from '@angular/core/testing';
import { ApiError } from '../../../core/errors/api-error';
import { RoleAdminRepository } from '../domain/role';
import {
  FakeRoleAdminRepository,
  fakeRoleAdminRepository,
  role,
} from '../testing/fake-role-admin.repository';
import { AdminRolesStore } from './admin-roles.store';

describe('AdminRolesStore', () => {
  let repository: FakeRoleAdminRepository;
  let store: AdminRolesStore;

  beforeEach(() => {
    repository = fakeRoleAdminRepository();
    repository.list.mockResolvedValue([role('admin', { name: 'Administrador' }), role('coach')]);
    TestBed.configureTestingModule({
      providers: [AdminRolesStore, { provide: RoleAdminRepository, useValue: repository }],
    });
    store = TestBed.inject(AdminRolesStore);
  });

  it('has no roles until they are loaded, then holds them', async () => {
    expect(store.roles()).toBeNull();

    await store.load();

    expect(store.roles()?.map((r) => r.id)).toEqual(['admin', 'coach']);
    expect(store.error()).toBeNull();
    expect(store.loading()).toBe(false);
  });

  it('keeps the loaded roles and reports the failure when a reload fails', async () => {
    await store.load();
    repository.list.mockRejectedValueOnce(new ApiError(0, 'network', 'Sin conexión.'));

    await store.load();

    expect(store.roles()).toHaveLength(2);
    expect(store.error()).toBe('Sin conexión.');
  });

  it('names a role by its id, falling back to the id or to "Sin rol"', async () => {
    await store.load();

    expect(store.roleName('admin')).toBe('Administrador');
    expect(store.roleName('ghost')).toBe('ghost');
    expect(store.roleName(null)).toBe('Sin rol');
  });

  it('finds a role asking the API when the list was not loaded', async () => {
    expect((await store.find('coach'))?.id).toBe('coach');
    expect(await store.find('ghost')).toBeNull();
    expect(repository.list).toHaveBeenCalledTimes(2);
  });

  it('creates a role', async () => {
    await store.save(null, { id: 'new', name: 'Nuevo', permissions: [] });

    expect(repository.create).toHaveBeenCalledWith({ id: 'new', name: 'Nuevo', permissions: [] });
  });

  it('updates a role without its id and answers the synced users', async () => {
    repository.update.mockResolvedValue(4);

    const synced = await store.save('coach', {
      id: 'coach',
      name: 'Entrenador',
      permissions: ['admin.access'],
    });

    expect(repository.update).toHaveBeenCalledWith('coach', {
      name: 'Entrenador',
      permissions: ['admin.access'],
    });
    expect(synced).toBe(4);
  });

  it('drops a deleted role from the list', async () => {
    await store.load();

    await store.remove('coach');

    expect(repository.delete).toHaveBeenCalledWith('coach');
    expect(store.roles()?.map((r) => r.id)).toEqual(['admin']);
  });

  it('keeps the role when the deletion fails', async () => {
    await store.load();
    repository.delete.mockRejectedValueOnce(new ApiError(412, 'role-has-users', 'En uso.'));

    await expect(store.remove('coach')).rejects.toThrow('En uso.');

    expect(store.roles()).toHaveLength(2);
  });

  it('assigns a role to a user', async () => {
    await store.assign('uid-1', 'coach');

    expect(repository.setUserRole).toHaveBeenCalledWith('uid-1', 'coach');
  });
});
