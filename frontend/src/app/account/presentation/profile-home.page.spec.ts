import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { Session } from '../../core/permissions/permissions';
import { provideSystemSettings } from '../../core/settings/testing/fake-system-settings.store';
import { FriendRepository } from '../../friends/domain/friend';
import { FakeFriendRepository, profile } from '../../friends/testing/fake-friend.repository';
import { ConfirmDialog } from '../../shared/ui/confirm-dialog';
import { ProfilePhotoRepository } from '../domain/profile-photo';
import { FakeProfilePhotoRepository } from '../testing/fake-profile-photo.repository';
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

const OLD_PHOTO = 'data:image/jpeg;base64,BBBB';

describe('ProfileHomePage', () => {
  let fixture: ComponentFixture<ProfileHomePage>;
  let signOut: ReturnType<typeof vi.fn<() => Promise<void>>>;
  let confirm: ReturnType<typeof vi.fn<ConfirmDialog['confirm']>>;
  let navigate: ReturnType<typeof vi.spyOn>;
  let get: ReturnType<typeof vi.fn<ProfileRepository['get']>>;
  let emailVerified: boolean;
  let photos: FakeProfilePhotoRepository;
  let friendRepository: FakeFriendRepository;
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
    photos = new FakeProfilePhotoRepository(null);
    friendRepository = new FakeFriendRepository();
    get = vi.fn<ProfileRepository['get']>().mockResolvedValue(PROFILE);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { session, signOut: () => signOut() } },
        { provide: ProfileRepository, useValue: { get } },
        { provide: ConfirmDialog, useValue: { confirm } },
        { provide: ProfilePhotoRepository, useFactory: () => photos },
        { provide: FriendRepository, useFactory: () => friendRepository },
        provideSystemSettings(),
      ],
    });
    navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
  });

  it('shows who the user is and the verification state', async () => {
    await create();

    expect(text()).toContain('Ana Torres');
    expect(text()).toContain('ana@runcty.dev');
    expect(text()).toContain('Correo verificado');
  });

  it('has no «Tu cuenta» module and lists no personal data', async () => {
    await create();

    expect(text()).not.toContain('Tu cuenta');
    expect(text()).not.toContain('Datos personales');
    expect(text()).not.toContain('Fecha de nacimiento');
    expect(text()).not.toContain('1998-07-14');
  });

  it('opens the personal data editor from a labelled pencil button', async () => {
    await create();

    fixture.nativeElement.querySelector('ion-button.edit').click();

    expect(String(navigate.mock.calls.at(-1)?.[0])).toBe('/datos');
  });

  it('lists friends, the sport profile, preferences and password as plain options, then the session ones', async () => {
    await create();

    const labels = Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('ion-item')).map((item) =>
      (item.textContent ?? '').trim(),
    );
    expect(labels[0]).toContain('Amigos');
    expect(labels[1]).toContain('Perfil deportivo');
    expect(labels[2]).toContain('Preferencias');
    expect(labels[3]).toContain('Cambiar contraseña');
    expect(text()).toContain('Cerrar sesión');
    expect(labels.at(-1)).toContain('Eliminar cuenta');
  });

  describe('friend requests badge', () => {
    const badge = () => fixture.nativeElement.querySelector('.count') as HTMLElement | null;

    it('shows nothing without pending requests', async () => {
      await create();

      expect(badge()).toBeNull();
    });

    it('counts the requests waiting for an answer', async () => {
      friendRepository.requests = {
        incoming: [
          { id: 'r1', profile: profile('a') },
          { id: 'r2', profile: profile('b') },
        ],
        outgoing: [{ id: 'r3', profile: profile('c') }],
      };

      await create();

      expect(badge()?.textContent?.trim()).toBe('2');
      expect(badge()?.getAttribute('aria-label')).toBe('2 solicitudes pendientes');
    });
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
    expect(text()).toContain('Perfil deportivo');
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

  describe('profile photo', () => {
    const avatarImage = () => fixture.nativeElement.querySelector('app-avatar img') as HTMLImageElement | null;

    it('shows the initials while there is no photo', async () => {
      await create();

      expect(avatarImage()).toBeNull();
      expect(fixture.nativeElement.querySelector('app-avatar')?.textContent).toContain('AT');
    });

    it('shows the saved photo', async () => {
      photos.photo = OLD_PHOTO;
      await create();

      expect(avatarImage()?.getAttribute('src')).toBe(OLD_PHOTO);
    });

    it('is display-only: the photo cannot be changed or removed here', async () => {
      photos.photo = OLD_PHOTO;
      await create();

      expect(text()).not.toContain('Cambiar foto');
      expect(text()).not.toContain('Quitar foto');
      expect(fixture.nativeElement.querySelector('input[type="file"]')).toBeNull();
    });
  });
});
