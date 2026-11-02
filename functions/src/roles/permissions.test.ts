import { describe, expect, it } from 'vitest';

import { ALL_PERMISSIONS, SYSTEM_ROLES, isPermission, normalizePermissions } from './permissions';

describe('permission catalog', () => {
  it('recognizes only catalog permissions', () => {
    expect(isPermission('admin.access')).toBe(true);
    expect(isPermission('roles.manage')).toBe(true);
    expect(isPermission('root')).toBe(false);
    expect(isPermission(42)).toBe(false);
  });

  it('normalizes permissions to a sorted unique list', () => {
    expect(normalizePermissions(['users.read', 'admin.access', 'users.read'])).toEqual(['admin.access', 'users.read']);
  });

  it('rejects permissions outside the catalog', () => {
    expect(normalizePermissions(['admin.access', 'root'])).toBeNull();
    expect(normalizePermissions('admin.access')).toBeNull();
    expect(normalizePermissions([1])).toBeNull();
  });
});

describe('system roles', () => {
  it('gives runners no admin permissions and admins every permission', () => {
    expect(SYSTEM_ROLES.runner.permissions).toEqual([]);
    expect([...SYSTEM_ROLES.admin.permissions].sort()).toEqual([...ALL_PERMISSIONS].sort());
  });

  it('only grants club representatives catalog permissions', () => {
    expect(SYSTEM_ROLES.club_rep.permissions.every(isPermission)).toBe(true);
    expect(SYSTEM_ROLES.club_rep.permissions).toContain('routes.manage');
    expect(SYSTEM_ROLES.club_rep.permissions).not.toContain('roles.manage');
  });
});
