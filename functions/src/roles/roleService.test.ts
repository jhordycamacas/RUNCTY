import { describe, expect, it, vi } from 'vitest';

import { DomainError } from '../shared/errors';
import { ALL_PERMISSIONS } from './permissions';
import {
  createRole,
  deleteRole,
  parseRoleInput,
  setUserRole,
  updateRole,
  type RoleCaller,
  type RoleRecord,
  type RolesDeps,
} from './roleService';

const ADMIN: RoleCaller = { uid: 'admin-1', isAdmin: true, permissions: [...ALL_PERMISSIONS] };
/** A delegate: holds roles.manage without being an admin. */
const MANAGER: RoleCaller = { uid: 'mgr-1', isAdmin: false, permissions: ['roles.manage', 'users.read'] };

function fakeDeps(roles: Record<string, RoleRecord> = {}, overrides: Partial<RolesDeps> = {}): RolesDeps {
  return {
    getRole: vi.fn(async (id: string) => roles[id] ?? null),
    createRole: vi.fn(async () => undefined),
    updateRole: vi.fn(async () => undefined),
    deleteRole: vi.fn(async () => undefined),
    listUserIdsWithRole: vi.fn(async () => []),
    hasUsersWithRole: vi.fn(async () => false),
    getCustomClaims: vi.fn(async () => ({})),
    setCustomClaims: vi.fn(async () => undefined),
    setDocRole: vi.fn(async () => undefined),
    revokeRefreshTokens: vi.fn(async () => undefined),
    isLastAdmin: vi.fn(async () => false),
    ...overrides,
  };
}

const SYSTEM: Record<string, RoleRecord> = {
  runner: { name: 'Corredor', description: '', permissions: [], system: true },
  admin: { name: 'Administrador', description: '', permissions: [...ALL_PERMISSIONS], system: true },
};

async function expectReason(promise: Promise<unknown>, reason: string): Promise<void> {
  await expect(promise).rejects.toBeInstanceOf(DomainError);
  await expect(promise).rejects.toMatchObject({ reason });
}

describe('parseRoleInput', () => {
  it('normalizes a valid role', () => {
    expect(
      parseRoleInput({ id: 'support', name: '  Soporte ', description: 'Mesa de ayuda', permissions: ['users.read', 'admin.access'] }),
    ).toEqual({ id: 'support', name: 'Soporte', description: 'Mesa de ayuda', permissions: ['admin.access', 'users.read'] });
  });

  it('defaults a missing description to empty', () => {
    expect(parseRoleInput({ id: 'support', name: 'Soporte', permissions: [] }).description).toBe('');
  });

  it('rejects ids that are not slugs', () => {
    for (const id of ['', 'A', 'Support', 'with space', '1abc', 'x'.repeat(40), 42]) {
      expect(() => parseRoleInput({ id, name: 'X', permissions: [] })).toThrow(DomainError);
    }
  });

  it('rejects empty or long names and descriptions', () => {
    expect(() => parseRoleInput({ id: 'abc', name: '   ', permissions: [] })).toThrow(DomainError);
    expect(() => parseRoleInput({ id: 'abc', name: 'x'.repeat(61), permissions: [] })).toThrow(DomainError);
    expect(() => parseRoleInput({ id: 'abc', name: 'X', description: 'x'.repeat(201), permissions: [] })).toThrow(DomainError);
  });

  it('rejects permissions outside the catalog', () => {
    expect(() => parseRoleInput({ id: 'abc', name: 'X', permissions: ['root'] })).toThrow(/permissions/i);
  });
});

describe('createRole', () => {
  it('creates a new non-system role', async () => {
    const deps = fakeDeps(SYSTEM);
    await createRole({ id: 'support', name: 'Soporte', permissions: ['users.read'] }, ADMIN, deps);
    expect(deps.createRole).toHaveBeenCalledWith('support', {
      name: 'Soporte',
      description: '',
      permissions: ['users.read'],
      system: false,
    });
  });

  it('rejects an id that already exists', async () => {
    const deps = fakeDeps(SYSTEM);
    await expectReason(createRole({ id: 'admin', name: 'Otro', permissions: [] }, ADMIN, deps), 'role-exists');
    expect(deps.createRole).not.toHaveBeenCalled();
  });
});

describe('updateRole', () => {
  it('updates the role and re-syncs the claims of its users', async () => {
    const roles = { ...SYSTEM, support: { name: 'Soporte', description: '', permissions: [], system: false } };
    const deps = fakeDeps(roles, {
      listUserIdsWithRole: vi.fn(async () => ['u1', 'u2']),
      getCustomClaims: vi.fn(async (uid: string) => (uid === 'u1' ? { role: 'support', perms: [], beta: true } : undefined)),
    });

    const result = await updateRole({ id: 'support', name: 'Soporte', permissions: ['users.read'] }, ADMIN, deps);

    expect(deps.updateRole).toHaveBeenCalledWith('support', { name: 'Soporte', description: '', permissions: ['users.read'] });
    expect(deps.setCustomClaims).toHaveBeenCalledWith('u1', { role: 'support', perms: ['users.read'], beta: true });
    expect(deps.setCustomClaims).toHaveBeenCalledWith('u2', { role: 'support', perms: ['users.read'] });
    expect(result).toEqual({ syncedUsers: 2 });
  });

  it('skips users deleted from Auth while syncing', async () => {
    const roles = { ...SYSTEM, support: { name: 'Soporte', description: '', permissions: [], system: false } };
    const deps = fakeDeps(roles, {
      listUserIdsWithRole: vi.fn(async () => ['gone', 'u2']),
      getCustomClaims: vi.fn(async (uid: string) => {
        if (uid === 'gone') throw Object.assign(new Error('gone'), { code: 'auth/user-not-found' });
        return {};
      }),
    });
    await expect(updateRole({ id: 'support', name: 'Soporte', permissions: [] }, ADMIN, deps)).resolves.toEqual({ syncedUsers: 1 });
  });

  it('rejects an unknown role', async () => {
    await expectReason(updateRole({ id: 'ghost', name: 'X', permissions: [] }, ADMIN, fakeDeps(SYSTEM)), 'role-not-found');
  });

  it('keeps every permission on the admin role', async () => {
    const deps = fakeDeps(SYSTEM);
    await expectReason(updateRole({ id: 'admin', name: 'Admin', permissions: ['users.read'] }, ADMIN, deps), 'admin-permissions');
    await expect(updateRole({ id: 'admin', name: 'Admin', permissions: [...ALL_PERMISSIONS] }, ADMIN, deps)).resolves.toBeDefined();
  });
});

describe('deleteRole', () => {
  it('deletes a custom role without users', async () => {
    const deps = fakeDeps({ support: { name: 'Soporte', description: '', permissions: [], system: false } });
    await deleteRole({ id: 'support' }, deps);
    expect(deps.deleteRole).toHaveBeenCalledWith('support');
  });

  it('rejects system roles', async () => {
    const deps = fakeDeps(SYSTEM);
    await expectReason(deleteRole({ id: 'runner' }, deps), 'system-role');
    expect(deps.deleteRole).not.toHaveBeenCalled();
  });

  it('rejects roles that still have users (RF-02-4)', async () => {
    const deps = fakeDeps(
      { support: { name: 'Soporte', description: '', permissions: [], system: false } },
      { hasUsersWithRole: vi.fn(async () => true) },
    );
    await expectReason(deleteRole({ id: 'support' }, deps), 'role-has-users');
    expect(deps.deleteRole).not.toHaveBeenCalled();
  });

  it('rejects unknown roles', async () => {
    await expectReason(deleteRole({ id: 'ghost' }, fakeDeps()), 'role-not-found');
  });
});

describe('setUserRole', () => {
  const roles = {
    ...SYSTEM,
    support: { name: 'Soporte', description: '', permissions: ['admin.access', 'users.read'], system: false },
  } satisfies Record<string, RoleRecord>;

  it('sets the claims first and then mirrors the role on the user doc', async () => {
    const order: string[] = [];
    const deps = fakeDeps(roles, {
      getCustomClaims: vi.fn(async () => ({ role: 'runner', perms: [] })),
      setCustomClaims: vi.fn(async () => {
        order.push('claims');
      }),
      setDocRole: vi.fn(async () => {
        order.push('doc');
      }),
    });

    await setUserRole({ uid: 'u1', roleId: 'support' }, ADMIN, deps);

    expect(deps.setCustomClaims).toHaveBeenCalledWith('u1', { role: 'support', perms: ['admin.access', 'users.read'] });
    expect(deps.setDocRole).toHaveBeenCalledWith('u1', 'support');
    expect(order).toEqual(['claims', 'doc']);
  });

  it('rejects an unknown role or a missing uid', async () => {
    await expectReason(setUserRole({ uid: 'u1', roleId: 'ghost' }, ADMIN, fakeDeps(roles)), 'role-not-found');
    await expectReason(setUserRole({ uid: '', roleId: 'runner' }, ADMIN, fakeDeps(roles)), 'invalid-argument');
  });

  it('reports a user that does not exist in Auth', async () => {
    const deps = fakeDeps(roles, {
      getCustomClaims: vi.fn(async () => {
        throw Object.assign(new Error('gone'), { code: 'auth/user-not-found' });
      }),
    });
    await expectReason(setUserRole({ uid: 'ghost', roleId: 'runner' }, ADMIN, deps), 'user-not-found');
  });

  it('prevents an admin from removing their own admin role (lockout guard)', async () => {
    const deps = fakeDeps(roles, { getCustomClaims: vi.fn(async () => ({ role: 'admin', perms: [...ALL_PERMISSIONS] })) });
    await expectReason(setUserRole({ uid: 'admin-1', roleId: 'support' }, ADMIN, deps), 'self-lockout');
    await expectReason(setUserRole({ uid: 'admin-1', roleId: 'runner' }, ADMIN, deps), 'self-lockout');
    expect(deps.setCustomClaims).not.toHaveBeenCalled();
  });

  it('lets an admin change the role of another admin', async () => {
    const deps = fakeDeps(roles, { getCustomClaims: vi.fn(async () => ({ role: 'admin', perms: [...ALL_PERMISSIONS] })) });
    await expect(setUserRole({ uid: 'admin-2', roleId: 'runner' }, ADMIN, deps)).resolves.toBeUndefined();
  });
});

describe('privilege escalation guards (SEC-02)', () => {
  const roles = {
    ...SYSTEM,
    support: { name: 'Soporte', description: '', permissions: ['users.read'], system: false },
    ops: { name: 'Ops', description: '', permissions: ['roles.manage', 'users.read'], system: false },
  } satisfies Record<string, RoleRecord>;

  it('only an admin can create a role that includes roles.manage', async () => {
    const deps = fakeDeps(roles);
    const input = { id: 'boss', name: 'Jefe', permissions: ['roles.manage'] };
    await expectReason(createRole(input, MANAGER, deps), 'admin-only');
    expect(deps.createRole).not.toHaveBeenCalled();
    await expect(createRole(input, ADMIN, deps)).resolves.toBeUndefined();
  });

  it('a non-admin cannot grant a permission they do not hold', async () => {
    const deps = fakeDeps(roles);
    await expectReason(
      createRole({ id: 'cityboss', name: 'Ciudades', permissions: ['users.read', 'cities.manage'] }, MANAGER, deps),
      'permission-escalation',
    );
    await expect(createRole({ id: 'viewer', name: 'Lector', permissions: ['users.read'] }, MANAGER, deps)).resolves.toBeUndefined();
  });

  it('a non-admin cannot add roles.manage or a missing permission to an existing role', async () => {
    const deps = fakeDeps(roles);
    await expectReason(
      updateRole({ id: 'support', name: 'Soporte', permissions: ['users.read', 'roles.manage'] }, MANAGER, deps),
      'admin-only',
    );
    await expectReason(
      updateRole({ id: 'support', name: 'Soporte', permissions: ['users.read', 'cities.manage'] }, MANAGER, deps),
      'permission-escalation',
    );
    expect(deps.updateRole).not.toHaveBeenCalled();
  });

  it('a non-admin can still narrow an existing role', async () => {
    const deps = fakeDeps(roles);
    await expect(updateRole({ id: 'support', name: 'Soporte', permissions: [] }, MANAGER, deps)).resolves.toBeDefined();
  });

  it('only an admin can assign or revoke the admin role', async () => {
    const deps = fakeDeps(roles, { getCustomClaims: vi.fn(async () => ({ role: 'runner', perms: [] })) });
    await expectReason(setUserRole({ uid: 'u1', roleId: 'admin' }, MANAGER, deps), 'admin-only');

    const adminTarget = fakeDeps(roles, { getCustomClaims: vi.fn(async () => ({ role: 'admin', perms: [...ALL_PERMISSIONS] })) });
    await expectReason(setUserRole({ uid: 'u2', roleId: 'runner' }, MANAGER, adminTarget), 'admin-only');
    expect(deps.setCustomClaims).not.toHaveBeenCalled();
    expect(adminTarget.setCustomClaims).not.toHaveBeenCalled();
  });

  it('a non-admin cannot assign a role with roles.manage', async () => {
    const deps = fakeDeps(roles);
    await expectReason(setUserRole({ uid: 'u1', roleId: 'ops' }, MANAGER, deps), 'admin-only');
  });

  it('a non-admin cannot assign a role holding permissions they lack', async () => {
    const deps = fakeDeps({ ...roles, cities: { name: 'C', description: '', permissions: ['cities.manage'], system: false } });
    await expectReason(setUserRole({ uid: 'u1', roleId: 'cities' }, MANAGER, deps), 'permission-escalation');
  });

  it('a non-admin can assign a role within their own permissions', async () => {
    const deps = fakeDeps(roles);
    await expect(setUserRole({ uid: 'u1', roleId: 'support' }, MANAGER, deps)).resolves.toBeUndefined();
  });
});

describe('token revocation (SEC-03)', () => {
  it('revokes refresh tokens after changing a user role, after the claims', async () => {
    const order: string[] = [];
    const deps = fakeDeps(SYSTEM, {
      setCustomClaims: vi.fn(async () => {
        order.push('claims');
      }),
      revokeRefreshTokens: vi.fn(async () => {
        order.push('revoke');
      }),
    });
    await setUserRole({ uid: 'u1', roleId: 'runner' }, ADMIN, deps);
    expect(deps.revokeRefreshTokens).toHaveBeenCalledWith('u1');
    expect(order).toEqual(['claims', 'revoke']);
  });

  it('revokes refresh tokens of every user re-synced by updateRole', async () => {
    const roles = { ...SYSTEM, support: { name: 'Soporte', description: '', permissions: [], system: false } };
    const deps = fakeDeps(roles, { listUserIdsWithRole: vi.fn(async () => ['u1', 'u2']) });
    await updateRole({ id: 'support', name: 'Soporte', permissions: ['users.read'] }, ADMIN, deps);
    expect(deps.revokeRefreshTokens).toHaveBeenCalledWith('u1');
    expect(deps.revokeRefreshTokens).toHaveBeenCalledWith('u2');
  });
});

describe('last admin guard (SEC-08)', () => {
  it('blocks demoting the last remaining admin', async () => {
    const deps = fakeDeps(SYSTEM, {
      getCustomClaims: vi.fn(async () => ({ role: 'admin', perms: [...ALL_PERMISSIONS] })),
      isLastAdmin: vi.fn(async () => true),
    });
    await expectReason(setUserRole({ uid: 'admin-2', roleId: 'runner' }, ADMIN, deps), 'last-admin');
    expect(deps.setCustomClaims).not.toHaveBeenCalled();
  });

  it('does not consult the admin count when the target is not an admin', async () => {
    const deps = fakeDeps(SYSTEM, { isLastAdmin: vi.fn(async () => true) });
    await expect(setUserRole({ uid: 'u1', roleId: 'runner' }, ADMIN, deps)).resolves.toBeUndefined();
    expect(deps.isLastAdmin).not.toHaveBeenCalled();
  });
});
