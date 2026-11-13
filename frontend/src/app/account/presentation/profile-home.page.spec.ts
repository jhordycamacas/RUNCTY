import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { CityRepository } from '../../cities/domain/city';
import { AuthService } from '../../core/auth/auth.service';
import { Session } from '../../core/permissions/permissions';
import { ConfirmDialog } from '../../shared/ui/confirm-dialog';
import { Profile, ProfileRepository } from '../domain/profile';
import { ProfileHomePage } from './profile-home.page';

const PROFILE: Profile = {
  uid: 'u1',
  email: 'ana@runcty.dev',
  firstName: 'Ana',
  lastName: 'Torres',
  birthDate: '1998-07-14',
  cityId: 'loja',
  idNumber: null,
  role: 'runner',
};

describe('ProfileHomePage', () => {
  let fixture: ComponentFixture<ProfileHomePage>;
  let signOut: ReturnType<typeof vi.fn<() => Promise<void>>>;
  let confirm: ReturnType<typeof vi.fn<ConfirmDialog['confirm']>>;
  let navigate: ReturnType<typeof vi.spyOn>;
  let get: ReturnType<typeof vi.fn<ProfileRepository['get']>>;
  let emailVerified: boolean;
  const session = signal<Session | null>(null);

  const text = () => fixture.nativeElement.textContent as string;
  async function create(): Promise<void> {
    session.set({ uid: 'u1', email: PROFILE.email, emailVerified, role: 'runner', perms: [] });
    fixture = TestBed.createComponent(ProfileHomePage);
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();
  }

  beforeEach(() => {
    emailVerified = true;
    signOut = vi.fn<() => Promise<void>>().mockResolvedValue();
    confirm = vi.fn<ConfirmDialog['confirm']>().mockResolvedValue(true);
    get = vi.fn<ProfileRepository['get']>().mockResolvedValue(PROFILE);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { session, signOut: () => signOut() } },
        { provide: ProfileRepository, useValue: { get } },
        {
          provide: CityRepository,
          useValue: { list: async () => [{ id: 'loja', name: 'Loja', type: 'city' }] },
        },
        { provide: ConfirmDialog, useValue: { confirm } },
      ],
    });
    navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
  });

  it('shows who the user is, the city name and the verification state', async () => {
    await create();

    expect(text()).toContain('Ana Torres');
    expect(text()).toContain('ana@runcty.dev');
    expect(text()).toContain('Loja');
    expect(text()).toContain('Correo verificado');
  });

  it('flags an unverified email', async () => {
    emailVerified = false;
    await create();

    expect(text()).toContain('Correo sin verificar');
  });

  it('keeps the account sections reachable when the profile fails to load', async () => {
    get.mockRejectedValue({ code: 'auth/network-request-failed' });
    await create();

    expect(text()).toContain('Reintentar');
    expect(text()).toContain('Datos personales');
    expect(text()).toContain('Eliminar cuenta');
  });

  it('signs out after the user confirms', async () => {
    await create();

    await fixture.componentInstance['signOut']();

    expect(confirm).toHaveBeenCalledOnce();
    expect(signOut).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith('/login', { replaceUrl: true });
  });

  it('stays signed in when the user cancels', async () => {
    await create();
    confirm.mockResolvedValue(false);

    await fixture.componentInstance['signOut']();

    expect(signOut).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });
});
