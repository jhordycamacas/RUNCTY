import { Session, hasPermission } from '../core/permissions/permissions';
import { ADMIN_SECTIONS } from './admin-sections';
import { ADMIN_ROUTES } from './admin.routes';

const staff = (perms: Session['perms'], role: string | null = 'staff'): Session => ({
  uid: 'u1',
  email: 'staff@runcty.test',
  emailVerified: true,
  role,
  perms,
});
const visible = (session: Session) =>
  ADMIN_SECTIONS.filter((section) => hasPermission(session, section.permission)).map((s) => s.path);

describe('admin sections', () => {
  it('offers Configuración only with settings.manage (or to the admin role)', () => {
    expect(visible(staff(['admin.access', 'cities.manage']))).not.toContain('configuracion');
    expect(visible(staff(['settings.manage']))).toEqual(['configuracion']);
    expect(visible(staff([], 'admin'))).toContain('configuracion');
  });

  it('describes the section for the menu', () => {
    expect(ADMIN_SECTIONS.find((section) => section.path === 'configuracion')).toEqual({
      path: 'configuracion',
      label: 'Configuración',
      icon: 'settings-outline',
      permission: 'settings.manage',
    });
  });

  it('routes every section behind its permission guard to a lazy screen', () => {
    const children = ADMIN_ROUTES[0].children ?? [];

    for (const section of ADMIN_SECTIONS) {
      const route = children.find((child) => child.path === section.path);
      expect(route?.canActivate).toHaveLength(1);
      expect(route?.loadChildren).toBeTypeOf('function');
    }
  });
});
