import { describe, expect, it } from 'vitest';

import { claimsFor, hasPermission } from './authz';

describe('hasPermission', () => {
  it('denies anonymous callers and tokens without perms', () => {
    expect(hasPermission(undefined, 'users.read')).toBe(false);
    expect(hasPermission({ role: 'runner' }, 'users.read')).toBe(false);
    expect(hasPermission({ role: 'runner', perms: [] }, 'users.read')).toBe(false);
  });

  it('grants permissions listed in the perms claim', () => {
    expect(hasPermission({ role: 'support', perms: ['users.read'] }, 'users.read')).toBe(true);
    expect(hasPermission({ role: 'support', perms: ['users.read'] }, 'roles.manage')).toBe(false);
  });

  it('ignores a malformed perms claim', () => {
    expect(hasPermission({ perms: 'users.read' }, 'users.read')).toBe(false);
  });

  it('treats the admin role as superuser (legacy tokens without perms)', () => {
    expect(hasPermission({ role: 'admin' }, 'roles.manage')).toBe(true);
  });
});

describe('claimsFor', () => {
  it('sets role and perms while keeping unrelated claims', () => {
    expect(claimsFor({ beta: true, role: 'runner', perms: [] }, 'admin', ['users.read'])).toEqual({
      beta: true,
      role: 'admin',
      perms: ['users.read'],
    });
    expect(claimsFor(undefined, 'runner', [])).toEqual({ role: 'runner', perms: [] });
  });
});
