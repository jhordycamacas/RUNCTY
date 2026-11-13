import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { Session } from '../../core/permissions/permissions';
import { TextField } from '../../shared/ui/text-field';
import { LoginPage } from './login.page';

const RUNNER: Session = {
  uid: 'u1',
  email: 'ana@runcty.dev',
  emailVerified: true,
  role: 'runner',
  perms: [],
};

describe('LoginPage', () => {
  let fixture: ComponentFixture<LoginPage>;
  let auth: {
    signIn: ReturnType<typeof vi.fn>;
    session: ReturnType<typeof signal<Session | null>>;
  };
  let navigate: ReturnType<typeof vi.spyOn>;

  const fieldErrors = () =>
    fixture.debugElement
      .queryAll(By.directive(TextField))
      .map((field) => field.componentInstance.error());
  const text = () => fixture.nativeElement.textContent as string;

  async function submit(email: string, password: string): Promise<void> {
    fixture.componentInstance['form'].setValue({ email, password });
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(() => {
    auth = { signIn: vi.fn().mockResolvedValue(undefined), session: signal<Session | null>(null) };
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
    });
    navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();
  });

  it('explains what is missing and does not call the server', async () => {
    await submit('ana', '');

    expect(fieldErrors()).toEqual(['Ingresa un correo válido.', 'Ingresa tu contraseña.']);
    expect(auth.signIn).not.toHaveBeenCalled();
  });

  it('signs in with the normalized email and goes to the runner area', async () => {
    auth.signIn.mockImplementation(async () => auth.session.set(RUNNER));

    await submit(' Ana@Runcty.dev ', 'Runner2026');

    expect(auth.signIn).toHaveBeenCalledWith('ana@runcty.dev', 'Runner2026');
    expect(navigate).toHaveBeenCalledWith('/app', { replaceUrl: true });
  });

  it('shows the same neutral message for a wrong password and an unknown account', async () => {
    auth.signIn.mockRejectedValue({ code: 'auth/invalid-credential' });

    await submit('ana@runcty.dev', 'bad');

    expect(text()).toContain('Correo o contraseña incorrectos.');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('shows the rate-limit and network failures', async () => {
    auth.signIn.mockRejectedValueOnce({ code: 'auth/too-many-requests' });
    await submit('ana@runcty.dev', 'x');
    expect(text()).toContain('Demasiados intentos');

    auth.signIn.mockRejectedValueOnce({ code: 'auth/network-request-failed' });
    await submit('ana@runcty.dev', 'x');
    expect(text()).toContain('No hay conexión con el servidor');
  });

  it('links to sign-up and password recovery', () => {
    const links = Array.from(fixture.nativeElement.querySelectorAll('[routerLink]')).map((el) =>
      (el as HTMLElement).getAttribute('routerLink'),
    );

    expect(links).toEqual(['/recuperar', '/registro']);
  });
});
