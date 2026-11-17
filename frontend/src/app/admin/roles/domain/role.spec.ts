import { PERMISSIONS } from '../../../core/permissions/permissions';
import { PERMISSION_GROUPS, PERMISSION_LABELS, sortPermissions, toRole } from './role';

describe('role domain', () => {
  it('names every permission of the catalogue and groups each one exactly once', () => {
    expect(Object.keys(PERMISSION_LABELS).sort()).toEqual([...PERMISSIONS].sort());
    const grouped = PERMISSION_GROUPS.flatMap((group) => group.permissions);
    expect([...grouped].sort()).toEqual([...PERMISSIONS].sort());
  });

  it('sorts permissions in catalogue order', () => {
    expect(sortPermissions(['clubs.manage', 'admin.access', 'users.read'])).toEqual([
      'admin.access',
      'users.read',
      'clubs.manage',
    ]);
  });

  it('maps a role and drops what is outside the catalogue', () => {
    expect(
      toRole({
        id: 'club_rep',
        name: 'Representante',
        description: 'Aporta rutas',
        permissions: ['routes.manage', 'bogus', 'admin.access'],
        system: true,
      }),
    ).toEqual({
      id: 'club_rep',
      name: 'Representante',
      description: 'Aporta rutas',
      permissions: ['admin.access', 'routes.manage'],
      system: true,
    });
  });

  it('falls back to harmless values for a malformed role', () => {
    expect(toRole({ id: 'x', permissions: 'nope' })).toEqual({
      id: 'x',
      name: 'x',
      description: '',
      permissions: [],
      system: false,
    });
  });
});
