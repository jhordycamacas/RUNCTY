import { homeUrl, safeReturnUrl } from './home-route';

describe('safeReturnUrl', () => {
  it('keeps in-app paths with their query', () => {
    expect(safeReturnUrl('/admin/rutas?page=2')).toBe('/admin/rutas?page=2');
  });

  it.each([null, undefined, '', 'admin', 'https://evil.example.com', '//evil.example.com', '/\\evil.example.com'])(
    'rejects %s',
    (value) => {
      expect(safeReturnUrl(value)).toBeNull();
    },
  );
});

describe('homeUrl', () => {
  const base = { uid: 'u', email: null, emailVerified: false };

  it('is the admin area only for admin.access or the admin role', () => {
    expect(homeUrl({ ...base, role: 'staff', perms: ['admin.access'] })).toBe('/admin');
    expect(homeUrl({ ...base, role: 'admin', perms: [] })).toBe('/admin');
    expect(homeUrl({ ...base, role: 'runner', perms: [] })).toBe('/app');
    expect(homeUrl(null)).toBe('/app');
  });
});
