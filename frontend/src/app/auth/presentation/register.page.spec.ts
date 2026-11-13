import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { CityRepository } from '../../cities/domain/city';
import { AuthService } from '../../core/auth/auth.service';
import { FirebaseAuthGateway } from '../../core/auth/firebase-auth.gateway';
import { FakeFirebaseAuthGateway } from '../../core/auth/testing/fake-firebase-auth.gateway';
import { Session } from '../../core/permissions/permissions';
import { BirthDateField } from '../../shared/ui/birth-date-field';
import { TextField } from '../../shared/ui/text-field';
import { NewUserProfile, UsersRepository } from '../domain/ports';
import { RegisterPage } from './register.page';

const RUNNER: Session = {
  uid: 'u1',
  email: 'ana@runcty.dev',
  emailVerified: false,
  role: 'runner',
  perms: [],
};

const VALID = {
  firstName: 'Ana',
  lastName: 'Torres',
  birthDate: '1998-07-14',
  cityId: 'loja',
  idNumber: '',
  email: 'Ana@Runcty.dev',
  password: 'Runner2026',
  confirmPassword: 'Runner2026',
  acceptsLopdp: true,
};

describe('RegisterPage', () => {
  let fixture: ComponentFixture<RegisterPage>;
  let gateway: FakeFirebaseAuthGateway;
  let created: NewUserProfile[];
  let createFailure: unknown;
  let session: ReturnType<typeof signal<Session | null>>;
  let navigate: ReturnType<typeof vi.spyOn>;

  const text = () => fixture.nativeElement.textContent as string;
  const textErrors = () =>
    fixture.debugElement
      .queryAll(By.directive(TextField))
      .map((field) => field.componentInstance.error());

  async function submit(values: Partial<typeof VALID> = {}): Promise<void> {
    fixture.componentInstance['form'].setValue({ ...VALID, ...values });
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(() => {
    gateway = new FakeFirebaseAuthGateway();
    created = [];
    createFailure = null;
    session = signal<Session | null>(null);
    const users: UsersRepository = {
      create: async (profile) => {
        created.push(profile);
        if (createFailure) throw createFailure;
      },
    };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: FirebaseAuthGateway, useValue: gateway },
        { provide: UsersRepository, useValue: users },
        {
          provide: CityRepository,
          useValue: { list: async () => [{ id: 'loja', name: 'Loja', type: 'city' }] },
        },
        {
          provide: AuthService,
          useValue: { session, refreshSession: async () => session.set(RUNNER) },
        },
      ],
    });
    navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    fixture = TestBed.createComponent(RegisterPage);
    fixture.detectChanges();
  });

  it('shows what is wrong with each field and creates nothing', async () => {
    await submit({
      firstName: ' ',
      email: 'ana',
      password: 'abc',
      confirmPassword: 'abd',
      idNumber: '12',
    });

    expect(textErrors()).toEqual([
      'Ingresa tus nombres.',
      null,
      'La cédula debe tener 10 dígitos.',
      'Ingresa un correo válido.',
      'La contraseña debe tener al menos 8 caracteres.',
      'Las contraseñas no coinciden.',
    ]);
    expect(gateway.calls).toEqual([]);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('asks for the data processing consent (LOPDP)', async () => {
    await submit({ acceptsLopdp: false });

    expect(text()).toContain('Debes aceptar el tratamiento de tus datos personales.');
    expect(gateway.calls).toEqual([]);
  });

  it('reports an incomplete birth date as such', async () => {
    await submit({ birthDate: '19' });

    const birthDate = fixture.debugElement.query(By.directive(BirthDateField)).componentInstance;
    expect(birthDate.error()).toBe('Usa el formato AAAA-MM-DD.');
  });

  it('creates the account and the profile, then opens the runner area', async () => {
    await submit();

    expect(gateway.calls).toEqual(['signUp:ana@runcty.dev:Runner2026', 'sendEmailVerification']);
    expect(created).toEqual([
      { firstName: 'Ana', lastName: 'Torres', birthDate: '1998-07-14', cityId: 'loja' },
    ]);
    expect(navigate).toHaveBeenCalledWith('/app', { replaceUrl: true });
  });

  it('says so when the email already has an account', async () => {
    gateway.failures.signUp = { code: 'auth/email-already-in-use' };

    await submit();

    expect(text()).toContain('Ya existe una cuenta con este correo.');
    expect(created).toEqual([]);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('shows the API reason and removes the account when the profile is rejected', async () => {
    createFailure = Object.assign(new Error('x'), { code: 'permission-denied' });

    await submit();

    expect(gateway.calls).toContain('deleteCurrentUser');
    expect(text()).toContain('Ocurrió un error inesperado.');
    expect(navigate).not.toHaveBeenCalled();
  });
});
