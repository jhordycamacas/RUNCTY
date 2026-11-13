import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ApiClient } from '../api/api-client';
import { ApiError } from '../errors/api-error';
import { Session } from '../permissions/permissions';
import { AuthService } from './auth.service';
import { FirebaseAuthGateway } from './firebase-auth.gateway';

const ME = { uid: 'u1', email: 'ana@example.com', emailVerified: true, role: 'runner', perms: ['users.read'] };

class FakeGateway extends FirebaseAuthGateway {
  user = false;
  signInError: unknown = null;
  readonly calls: string[] = [];

  async signIn(email: string, password: string): Promise<void> {
    this.calls.push(`signIn:${email}:${password}`);
    if (this.signInError) throw this.signInError;
    this.user = true;
  }
  async signOut(): Promise<void> {
    this.calls.push('signOut');
    this.user = false;
  }
  async hasUser(): Promise<boolean> {
    return this.user;
  }
  async getIdToken(): Promise<string | null> {
    return this.user ? 'token' : null;
  }
}

describe('AuthService', () => {
  let gateway: FakeGateway;
  let api: { get: ReturnType<typeof vi.fn> };
  let service: AuthService;

  beforeEach(() => {
    gateway = new FakeGateway();
    api = { get: vi.fn().mockReturnValue(of(ME)) };
    TestBed.configureTestingModule({
      providers: [
        { provide: FirebaseAuthGateway, useValue: gateway },
        { provide: ApiClient, useValue: api },
      ],
    });
    service = TestBed.inject(AuthService);
  });

  describe('restore', () => {
    it('stays signed out when Firebase has no user, without calling the API', async () => {
      await service.restore();

      expect(service.session()).toBeNull();
      expect(api.get).not.toHaveBeenCalled();
    });

    it('loads the role and permissions from /me when a user is stored', async () => {
      gateway.user = true;

      await service.restore();

      expect(api.get).toHaveBeenCalledWith('/me');
      expect(service.session()).toEqual<Session>(ME as Session);
    });

    it('runs only once however many guards ask', async () => {
      gateway.user = true;

      await Promise.all([service.restore(), service.restore()]);

      expect(api.get).toHaveBeenCalledTimes(1);
    });

    it('signs out and stays anonymous when the API rejects the stored user', async () => {
      gateway.user = true;
      api.get.mockReturnValue(throwError(() => new ApiError(401, 'token-revoked', 'x')));

      await service.restore();

      expect(service.session()).toBeNull();
      expect(gateway.calls).toContain('signOut');
    });

    it('keeps the Firebase user when the API is unreachable', async () => {
      gateway.user = true;
      api.get.mockReturnValue(throwError(() => new ApiError(0, 'network', 'x')));

      await service.restore();

      expect(service.session()).toBeNull();
      expect(gateway.calls).not.toContain('signOut');
    });
  });

  describe('signIn', () => {
    it('signs in with Firebase, then reads the session from /me', async () => {
      await service.signIn('ana@example.com', 'secret');

      expect(gateway.calls).toEqual(['signIn:ana@example.com:secret']);
      expect(service.session()?.uid).toBe('u1');
    });

    it('does not call the API when Firebase rejects the credentials', async () => {
      gateway.signInError = { code: 'auth/invalid-credential' };

      await expect(service.signIn('ana@example.com', 'bad')).rejects.toEqual({ code: 'auth/invalid-credential' });
      expect(api.get).not.toHaveBeenCalled();
      expect(service.session()).toBeNull();
    });

    it('signs out again when /me fails, so no half-open session remains', async () => {
      api.get.mockReturnValue(throwError(() => new ApiError(500, 'internal', 'x')));

      await expect(service.signIn('ana@example.com', 'secret')).rejects.toBeInstanceOf(ApiError);
      expect(gateway.calls).toContain('signOut');
      expect(service.session()).toBeNull();
    });
  });

  it('signOut clears the session', async () => {
    await service.signIn('ana@example.com', 'secret');

    await service.signOut();

    expect(service.session()).toBeNull();
    expect(gateway.calls.at(-1)).toBe('signOut');
  });

  it('can() reads the permissions of the server session only', async () => {
    expect(service.can('users.read')).toBe(false);

    await service.signIn('ana@example.com', 'secret');

    expect(service.can('users.read')).toBe(true);
    expect(service.can('roles.manage')).toBe(false);
  });

  it('the admin role holds every permission', async () => {
    api.get.mockReturnValue(of({ ...ME, role: 'admin', perms: [] }));

    await service.signIn('root@example.com', 'secret');

    expect(service.can('roles.manage')).toBe(true);
  });
});
