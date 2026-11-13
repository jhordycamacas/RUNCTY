import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { FirebaseAuthGateway } from '../../core/auth/firebase-auth.gateway';
import { FakeFirebaseAuthGateway } from '../../core/auth/testing/fake-firebase-auth.gateway';
import { TextField } from '../../shared/ui/text-field';
import { ChangePasswordPage } from './change-password.page';

describe('ChangePasswordPage', () => {
  let fixture: ComponentFixture<ChangePasswordPage>;
  let gateway: FakeFirebaseAuthGateway;

  const text = () => fixture.nativeElement.textContent as string;
  async function submit(values: Partial<Record<string, string>> = {}): Promise<void> {
    fixture.componentInstance['form'].setValue({
      currentPassword: 'Old12345',
      newPassword: 'New12345',
      confirmNewPassword: 'New12345',
      ...values,
    });
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(() => {
    gateway = new FakeFirebaseAuthGateway();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: FirebaseAuthGateway, useValue: gateway }],
    });
    fixture = TestBed.createComponent(ChangePasswordPage);
    fixture.detectChanges();
  });

  it('re-authenticates and updates the password, then clears the form', async () => {
    await submit();

    expect(gateway.calls).toEqual(['reauthenticate:Old12345', 'updatePassword:New12345']);
    expect(text()).toContain('Tu contraseña se actualizó.');
    expect(fixture.componentInstance['form'].getRawValue().newPassword).toBe('');
  });

  it('blocks a new password that breaks the policy', async () => {
    await submit({ newPassword: 'short', confirmNewPassword: 'short' });

    expect(gateway.calls).toEqual([]);
    const errors = fixture.debugElement
      .queryAll(By.directive(TextField))
      .map((field) => field.componentInstance.error());
    expect(errors).toEqual([null, 'La contraseña debe tener al menos 8 caracteres.', null]);
  });

  it('says the current password is wrong when Firebase rejects it', async () => {
    gateway.failures.reauthenticate = { code: 'auth/invalid-credential' };

    await submit();

    expect(text()).toContain('La contraseña actual no es correcta.');
    expect(gateway.calls).toEqual(['reauthenticate:Old12345']);
  });
});
