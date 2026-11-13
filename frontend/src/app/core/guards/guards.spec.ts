import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { adminLandingGuard } from '../../admin/admin-landing.guard';
import { AuthService } from '../auth/auth.service';
import { Permission, Session, hasPermission } from '../permissions/permissions';
import { guestGuard, homeGuard, permissionGuard, sessionGuard } from './auth.guards';

const session = (role: string, perms: Permission[] = []): Session => ({
  uid: 'u1',
  email: 'a@b.c',
  emailVerified: true,
  role,
  perms,
});

describe('route guards', () => {
  const current = signal<Session | null>(null);
  const restore = vi.fn(() => Promise.resolve());

  const run = <T>(guard: () => T): T => TestBed.runInInjectionContext(guard);
  const url = (result: boolean | UrlTree) => (result instanceof UrlTree ? TestBed.inject(Router).serializeUrl(result) : result);

  beforeEach(() => {
    current.set(null);
    restore.mockClear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: { session: current, restore, can: (p: Permission) => hasPermission(current(), p) },
        },
      ],
    });
  });

  describe('sessionGuard', () => {
    it('waits for the stored session to be restored', async () => {
      await run(sessionGuard);

      expect(restore).toHaveBeenCalledOnce();
    });

    it('lets a signed-in user through', async () => {
      current.set(session('runner'));

      expect(await run(sessionGuard)).toBe(true);
    });

    it('sends an anonymous user to /login', async () => {
      expect(url(await run(sessionGuard))).toBe('/login');
    });
  });

  describe('permissionGuard', () => {
    it('allows a user holding the permission', async () => {
      current.set(session('staff', ['users.read']));

      expect(await run(permissionGuard('users.read'))).toBe(true);
    });

    it('sends a signed-in user without it to /403, not to /login', async () => {
      current.set(session('staff', ['users.read']));

      expect(url(await run(permissionGuard('roles.manage')))).toBe('/403');
    });

    it('sends an anonymous user to /login', async () => {
      expect(url(await run(permissionGuard('admin.access')))).toBe('/login');
    });

    it('treats the admin role as holding every permission', async () => {
      current.set(session('admin'));

      expect(await run(permissionGuard('routes.manage'))).toBe(true);
    });
  });

  describe('guestGuard', () => {
    it('lets an anonymous user see the login', async () => {
      expect(await run(guestGuard)).toBe(true);
    });

    it('sends a runner to /app and an administrator to /admin', async () => {
      current.set(session('runner'));
      expect(url(await run(guestGuard))).toBe('/app');

      current.set(session('staff', ['admin.access']));
      expect(url(await run(guestGuard))).toBe('/admin');
    });
  });

  describe('homeGuard', () => {
    it('sends anonymous users to /login and signed-in users to their area', async () => {
      expect(url(await run(homeGuard))).toBe('/login');

      current.set(session('runner'));
      expect(url(await run(homeGuard))).toBe('/app');
    });
  });

  describe('adminLandingGuard', () => {
    const landing = () => url(run(adminLandingGuard as () => boolean | UrlTree));

    it('opens the first permitted section (UXN-12)', () => {
      current.set(session('staff', ['admin.access', 'cities.manage', 'routes.manage']));

      expect(landing()).toBe('/admin/ciudades');
    });

    it('opens the users section for an administrator', () => {
      current.set(session('admin'));

      expect(landing()).toBe('/admin/usuarios');
    });

    it('shows the empty state when no section is permitted', () => {
      current.set(session('staff', ['admin.access']));

      expect(landing()).toBe(true);
    });
  });
});
