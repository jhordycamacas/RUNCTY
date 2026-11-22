import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthService } from '../../core/auth/auth.service';
import { FirebaseAuthGateway } from '../../core/auth/firebase-auth.gateway';
import { FakeFirebaseAuthGateway } from '../../core/auth/testing/fake-firebase-auth.gateway';
import { Session } from '../../core/permissions/permissions';
import { EmailVerificationBanner } from './email-verification-banner';

const session = (emailVerified: boolean): Session => ({
  uid: 'u1',
  email: 'ana@runcty.dev',
  emailVerified,
  role: 'runner',
  perms: [],
});

describe('EmailVerificationBanner', () => {
  let fixture: ComponentFixture<EmailVerificationBanner>;
  let gateway: FakeFirebaseAuthGateway;
  let current: ReturnType<typeof signal<Session | null>>;
  let refresh: ReturnType<typeof vi.fn>;

  const text = () => fixture.nativeElement.textContent as string;
  const button = (label: string) =>
    Array.from(
      fixture.nativeElement.querySelectorAll('ion-button') as NodeListOf<HTMLElement>,
    ).find((el) => el.textContent?.includes(label));
  async function click(label: string): Promise<void> {
    button(label)?.click();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function create(initial: Session | null): void {
    current = signal(initial);
    gateway = new FakeFirebaseAuthGateway();
    refresh = vi.fn().mockResolvedValue(undefined);
    TestBed.configureTestingModule({
      providers: [
        { provide: FirebaseAuthGateway, useValue: gateway },
        { provide: AuthService, useValue: { session: current, refreshSession: refresh } },
      ],
    });
    fixture = TestBed.createComponent(EmailVerificationBanner);
    fixture.detectChanges();
  }

  it('shows nothing once the email is verified', () => {
    create(session(true));

    expect(text().trim()).toBe('');
  });

  it('asks to verify and names the address', () => {
    create(session(false));

    expect(text()).toContain('Verifica tu correo');
    expect(text()).toContain('ana@runcty.dev');
  });

  it('resends the verification email', async () => {
    create(session(false));

    await click('Reenviar');

    expect(gateway.calls).toEqual(['sendEmailVerification']);
    expect(text()).toContain('Te enviamos un nuevo correo.');
  });

  it('explains a failed resend', async () => {
    create(session(false));
    gateway.failures.sendEmailVerification = { code: 'auth/too-many-requests' };

    await click('Reenviar');

    expect(text()).toContain('Demasiados intentos');
  });

  it('re-checks the verification and says so when it is still pending', async () => {
    create(session(false));

    await click('Ya verifiqué');

    expect(refresh).toHaveBeenCalledOnce();
    expect(text()).toContain('Aún no vemos tu correo verificado.');
  });

  it('hides the banner when the re-check finds the email verified', async () => {
    create(session(false));
    refresh.mockImplementation(async () => current.set(session(true)));

    await click('Ya verifiqué');

    expect(text().trim()).toBe('');
  });
});
