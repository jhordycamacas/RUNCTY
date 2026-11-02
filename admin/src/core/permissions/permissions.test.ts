import { describe, expect, it } from 'vitest';

import { PERMISSIONS, canAccessAdmin, hasPermission, permissionLabel, readClaims } from './permissions';

describe('readClaims', () => {
  it('reads role and perms from token claims', () => {
    expect(readClaims({ role: 'support', perms: ['admin.access', 'users.read', 'bogus'] })).toEqual({
      role: 'support',
      perms: ['admin.access', 'users.read'],
    });
  });

  it('tolerates missing or malformed claims', () => {
    expect(readClaims({})).toEqual({ role: null, perms: [] });
    expect(readClaims({ role: 3, perms: 'admin.access' })).toEqual({ role: null, perms: [] });
  });
});

describe('hasPermission', () => {
  it('checks the perms claim', () => {
    expect(hasPermission({ role: 'support', perms: ['users.read'] }, 'users.read')).toBe(true);
    expect(hasPermission({ role: 'support', perms: ['users.read'] }, 'roles.manage')).toBe(false);
    expect(hasPermission(null, 'users.read')).toBe(false);
  });

  it('treats admin as superuser, like the security rules', () => {
    expect(hasPermission({ role: 'admin', perms: [] }, 'cities.manage')).toBe(true);
  });
});

describe('canAccessAdmin', () => {
  it('requires admin.access', () => {
    expect(canAccessAdmin({ role: 'runner', perms: [] })).toBe(false);
    expect(canAccessAdmin({ role: 'club_rep', perms: ['admin.access', 'routes.manage'] })).toBe(true);
    expect(canAccessAdmin({ role: 'support', perms: ['users.read'] })).toBe(false);
  });
});

describe('catalog', () => {
  it('has a Spanish label for every permission', () => {
    for (const permission of PERMISSIONS) {
      expect(permissionLabel(permission).length).toBeGreaterThan(3);
    }
  });
});
