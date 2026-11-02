import { describe, expect, it, vi } from 'vitest';

import { assignDefaultRole, resolveRoleAssignment, type RoleAssignmentDeps } from './assignDefaultRole';

describe('resolveRoleAssignment', () => {
  it('assigns runner to a brand new user', () => {
    expect(resolveRoleAssignment(undefined, undefined)).toEqual({
      claims: { role: 'runner', perms: [] },
      claimsChanged: true,
      role: 'runner',
      docChanged: true,
    });
  });

  it('keeps unrelated existing claims when adding the role', () => {
    const result = resolveRoleAssignment({ beta: true }, undefined);
    expect(result.claims).toEqual({ beta: true, role: 'runner', perms: [] });
    expect(result.claimsChanged).toBe(true);
  });

  it('never downgrades an existing admin claim', () => {
    const result = resolveRoleAssignment({ role: 'admin' }, undefined);
    expect(result.role).toBe('admin');
    expect(result.claims).toEqual({ role: 'admin' });
    expect(result.claimsChanged).toBe(false);
    expect(result.docChanged).toBe(true);
  });

  it('does nothing when claim and doc already agree', () => {
    const result = resolveRoleAssignment({ role: 'admin' }, 'admin');
    expect(result.claimsChanged).toBe(false);
    expect(result.docChanged).toBe(false);
  });

  it('ignores a role written to the doc that the claim does not back', () => {
    const result = resolveRoleAssignment(undefined, 'admin');
    expect(result.role).toBe('runner');
    expect(result.docChanged).toBe(true);
  });
});

function fakeDeps(claims: Record<string, unknown> | undefined): RoleAssignmentDeps {
  return {
    getCustomClaims: vi.fn(async () => claims),
    setCustomClaims: vi.fn(async () => undefined),
    setDocRole: vi.fn(async () => undefined),
  };
}

describe('assignDefaultRole', () => {
  it('sets the claim before writing the role to the doc', async () => {
    const deps = fakeDeps(undefined);
    const order: string[] = [];
    vi.mocked(deps.setCustomClaims).mockImplementation(async () => {
      order.push('claims');
    });
    vi.mocked(deps.setDocRole).mockImplementation(async () => {
      order.push('doc');
    });

    const role = await assignDefaultRole('u1', undefined, deps);

    expect(role).toBe('runner');
    expect(deps.setCustomClaims).toHaveBeenCalledWith('u1', { role: 'runner', perms: [] });
    expect(deps.setDocRole).toHaveBeenCalledWith('u1', 'runner');
    // The client refreshes its token when the doc role appears, so the claim must exist first.
    expect(order).toEqual(['claims', 'doc']);
  });

  it('preserves an admin claim and only mirrors it to the doc', async () => {
    const deps = fakeDeps({ role: 'admin' });
    const role = await assignDefaultRole('a1', undefined, deps);
    expect(role).toBe('admin');
    expect(deps.setCustomClaims).not.toHaveBeenCalled();
    expect(deps.setDocRole).toHaveBeenCalledWith('a1', 'admin');
  });

  it('is idempotent when everything is already in place', async () => {
    const deps = fakeDeps({ role: 'runner' });
    await assignDefaultRole('u1', 'runner', deps);
    expect(deps.setCustomClaims).not.toHaveBeenCalled();
    expect(deps.setDocRole).not.toHaveBeenCalled();
  });
});
