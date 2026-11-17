import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiClient } from '../../../core/api/api-client';
import { HttpRoleAdminRepository } from './http-role-admin.repository';

describe('HttpRoleAdminRepository', () => {
  const api = { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() };
  let repository: HttpRoleAdminRepository;

  beforeEach(() => {
    vi.resetAllMocks();
    TestBed.configureTestingModule({
      providers: [HttpRoleAdminRepository, { provide: ApiClient, useValue: api }],
    });
    repository = TestBed.inject(HttpRoleAdminRepository);
  });

  it('lists the roles mapped to the domain', async () => {
    api.get.mockReturnValue(of({ roles: [{ id: 'runner', name: 'Corredor', system: true }] }));

    const roles = await repository.list();

    expect(api.get).toHaveBeenCalledWith('/roles');
    expect(roles).toEqual([
      { id: 'runner', name: 'Corredor', description: '', permissions: [], system: true },
    ]);
  });

  it('answers an empty list when the body has no roles', async () => {
    api.get.mockReturnValue(of({}));

    expect(await repository.list()).toEqual([]);
  });

  it('creates a role with its id', async () => {
    api.post.mockReturnValue(of({}));
    const input = { id: 'coach', name: 'Entrenador', permissions: ['admin.access' as const] };

    await repository.create(input);

    expect(api.post).toHaveBeenCalledWith('/roles', input);
  });

  it('updates a role and resolves to the synced users', async () => {
    api.put.mockReturnValue(of({ syncedUsers: 3 }));

    const synced = await repository.update('coach', { name: 'Entrenador', permissions: [] });

    expect(api.put).toHaveBeenCalledWith('/roles/coach', { name: 'Entrenador', permissions: [] });
    expect(synced).toBe(3);
  });

  it('deletes a role', async () => {
    api.delete.mockReturnValue(of(null));

    await repository.delete('coach');

    expect(api.delete).toHaveBeenCalledWith('/roles/coach');
  });

  it('assigns a role to a user, encoding the uid', async () => {
    api.put.mockReturnValue(of({ uid: 'a/b', role: 'admin' }));

    await repository.setUserRole('a/b', 'admin');

    expect(api.put).toHaveBeenCalledWith('/users/a%2Fb/role', { roleId: 'admin' });
  });
});
