import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { FirebaseAuthGateway } from '../../core/auth/firebase-auth.gateway';
import { FakeFirebaseAuthGateway } from '../../core/auth/testing/fake-firebase-auth.gateway';
import { ForgotPasswordPage, RESET_SENT_MESSAGE } from './forgot-password.page';

describe('ForgotPasswordPage', () => {
  let fixture: ComponentFixture<ForgotPasswordPage>;
  let gateway: FakeFirebaseAuthGateway;

  const text = () => fixture.nativeElement.textContent as string;
  async function submit(email: string): Promise<void> {
    fixture.componentInstance['form'].setValue({ email });
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(() => {
    gateway = new FakeFirebaseAuthGateway();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: FirebaseAuthGateway, useValue: gateway }],
    });
    fixture = TestBed.createComponent(ForgotPasswordPage);
    fixture.detectChanges();
  });

  it('does not send anything for an invalid email', async () => {
    await submit('nope');

    expect(gateway.calls).toEqual([]);
  });

  it('sends the link and confirms with a neutral message', async () => {
    await submit('Ana@Runcty.dev');

    expect(gateway.calls).toEqual(['sendPasswordReset:ana@runcty.dev']);
    expect(text()).toContain(RESET_SENT_MESSAGE);
  });

  it('gives the same confirmation for an unknown account', async () => {
    gateway.failures.sendPasswordReset = { code: 'auth/user-not-found' };

    await submit('ghost@runcty.dev');

    expect(text()).toContain(RESET_SENT_MESSAGE);
  });

  it('shows network failures', async () => {
    gateway.failures.sendPasswordReset = { code: 'auth/network-request-failed' };

    await submit('ana@runcty.dev');

    expect(text()).toContain('No hay conexión con el servidor');
    expect(text()).not.toContain(RESET_SENT_MESSAGE);
  });
});
