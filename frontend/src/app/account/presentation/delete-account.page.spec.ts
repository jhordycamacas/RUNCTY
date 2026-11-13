import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { FirebaseAuthGateway } from '../../core/auth/firebase-auth.gateway';
import { FakeFirebaseAuthGateway } from '../../core/auth/testing/fake-firebase-auth.gateway';
import { ApiError } from '../../core/errors/api-error';
import { AccountRepository } from '../domain/profile';
import { DeleteAccountPage } from './delete-account.page';

describe('DeleteAccountPage', () => {
  let fixture: ComponentFixture<DeleteAccountPage>;
  let gateway: FakeFirebaseAuthGateway;
  let deleteAccount: ReturnType<typeof vi.fn<AccountRepository['delete']>>;
  let signOut: ReturnType<typeof vi.fn<() => Promise<void>>>;
  let navigate: ReturnType<typeof vi.spyOn>;

  const text = () => fixture.nativeElement.textContent as string;
  async function submit(values: { password?: string; confirmed?: boolean } = {}): Promise<void> {
    fixture.componentInstance['form'].setValue({
      password: 'Secret123',
      confirmed: true,
      ...values,
    });
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(() => {
    gateway = new FakeFirebaseAuthGateway();
    deleteAccount = vi.fn<AccountRepository['delete']>().mockResolvedValue();
    signOut = vi.fn<() => Promise<void>>().mockResolvedValue();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: FirebaseAuthGateway, useValue: gateway },
        { provide: AccountRepository, useValue: { delete: deleteAccount } },
        { provide: AuthService, useValue: { signOut } },
      ],
    });
    navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    fixture = TestBed.createComponent(DeleteAccountPage);
    fixture.detectChanges();
  });

  it('warns that the deletion is permanent', () => {
    expect(text()).toContain('Eliminar tu cuenta es permanente');
  });

  it('needs the password and the confirmation before doing anything', async () => {
    await submit({ password: '', confirmed: false });

    expect(gateway.calls).toEqual([]);
    expect(deleteAccount).not.toHaveBeenCalled();
    expect(text()).toContain('Confirma que entiendes que esta acción no se puede deshacer.');
  });

  it('re-authenticates, deletes the account, signs out and returns to the sign-in screen', async () => {
    await submit();

    expect(gateway.calls).toEqual(['reauthenticate:Secret123', 'getIdToken:forced']);
    expect(deleteAccount).toHaveBeenCalledOnce();
    expect(signOut).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith('/login', { replaceUrl: true });
  });

  it('deletes nothing and says so when the password is wrong', async () => {
    gateway.failures.reauthenticate = { code: 'auth/invalid-credential' };

    await submit();

    expect(text()).toContain('La contraseña actual no es correcta.');
    expect(deleteAccount).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('translates recent-sign-in-required and keeps the session', async () => {
    deleteAccount.mockRejectedValueOnce(new ApiError(412, 'recent-sign-in-required', 'x'));

    await submit();

    expect(text()).toContain(
      'Por seguridad, confirma tu contraseña de nuevo e inténtalo otra vez.',
    );
    expect(signOut).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('shows other server failures', async () => {
    deleteAccount.mockRejectedValueOnce(
      new ApiError(412, 'last-admin', 'Debe quedar al menos un administrador.'),
    );

    await submit();

    expect(text()).toContain('Debe quedar al menos un administrador.');
  });
});
