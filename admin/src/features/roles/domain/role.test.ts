import { describe, expect, it } from 'vitest';

import { canDeleteRole, parseRoleForm, suggestRoleId } from './role';

const valid = { id: 'soporte', name: 'Soporte', description: '', permissions: ['admin.access', 'users.read'] };

describe('parseRoleForm', () => {
  it('accepts a valid role and trims text', () => {
    const result = parseRoleForm({ ...valid, name: '  Soporte  ' });
    expect(result).toEqual({ ok: true, value: { ...valid, name: 'Soporte' } });
  });

  it('rejects an id that is not a slug', () => {
    const result = parseRoleForm({ ...valid, id: 'Soporte técnico' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.id).toMatch(/minúsculas/);
  });

  it('requires a name and catalog permissions', () => {
    const result = parseRoleForm({ ...valid, name: ' ', permissions: ['root'] });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.name).toBeDefined();
      expect(result.errors.permissions).toBeDefined();
    }
  });
});

describe('suggestRoleId', () => {
  it('builds a slug from the name', () => {
    expect(suggestRoleId('Representante de Club Ñandú')).toBe('representante_de_club_nandu');
    expect(suggestRoleId('  123 Soporte ')).toBe('soporte');
  });
});

describe('canDeleteRole', () => {
  it('protects system roles', () => {
    expect(canDeleteRole({ system: true })).toBe(false);
    expect(canDeleteRole({ system: false })).toBe(true);
  });
});
