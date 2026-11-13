import { ageOn, validateBirthDate } from './birth-date';
import { validatePassword } from './password-policy';
import { validateEmail, validateIdNumber } from './personal-data';
import { validateLogin, validateRegistration } from './registration';

const TODAY = new Date(2026, 10, 2); // 2026-11-02 local time

describe('validatePassword', () => {
  it.each(['abc12345', 'Runner2026', 'clave segura 1'])('accepts %s', (value) => {
    expect(validatePassword(value)).toBeNull();
  });

  it('rejects passwords shorter than 8 characters', () => {
    expect(validatePassword('abc123')).toBe('La contraseña debe tener al menos 8 caracteres.');
  });

  it('requires at least one letter and one number', () => {
    expect(validatePassword('12345678')).toBe('La contraseña debe incluir al menos una letra.');
    expect(validatePassword('abcdefgh')).toBe('La contraseña debe incluir al menos un número.');
  });
});

describe('birth date', () => {
  const check = (value: string) => validateBirthDate(value, TODAY);

  it('computes age on a given day', () => {
    expect(ageOn('2000-11-02', TODAY)).toBe(26);
    expect(ageOn('2000-11-03', TODAY)).toBe(25);
  });

  it('accepts a past date within the allowed age range', () => {
    expect(check('1990-05-20')).toBeNull();
  });

  it('accepts minors (parental consent is an open product decision)', () => {
    expect(check('2014-01-15')).toBeNull();
  });

  it('asks for the date when it is empty', () => {
    expect(check('  ')).toBe('Ingresa tu fecha de nacimiento.');
  });

  it('rejects malformed or impossible dates', () => {
    expect(check('20/05/1990')).toBe('Usa el formato AAAA-MM-DD.');
    expect(check('1990-02-30')).toBe('La fecha no existe.');
  });

  it('rejects today and future dates', () => {
    expect(check('2026-11-02')).toBe('La fecha de nacimiento debe ser anterior a hoy.');
    expect(check('2030-01-01')).toBe('La fecha de nacimiento debe ser anterior a hoy.');
  });

  it('rejects ages outside 5 to 110 years', () => {
    expect(check('2023-01-01')).toBe('La edad debe estar entre 5 y 110 años.');
    expect(check('1900-01-01')).toBe('La edad debe estar entre 5 y 110 años.');
  });
});

describe('validateIdNumber', () => {
  it('accepts an empty value (optional) or 10 digits', () => {
    expect(validateIdNumber('')).toBeNull();
    expect(validateIdNumber('1104567890')).toBeNull();
  });

  it('rejects anything else', () => {
    expect(validateIdNumber('11045')).toBe('La cédula debe tener 10 dígitos.');
    expect(validateIdNumber('11045678AB')).not.toBeNull();
  });
});

describe('validateRegistration', () => {
  const valid = {
    firstName: 'Ana',
    lastName: 'Torres',
    email: '  Ana@Runcty.dev ',
    password: 'Runner2026',
    confirmPassword: 'Runner2026',
    birthDate: '1998-07-14',
    cityId: 'loja',
    idNumber: '',
    acceptsLopdp: true,
  };

  it('accepts a complete form', () => {
    expect(validateRegistration(valid, TODAY)).toEqual({});
  });

  it('requires matching passwords', () => {
    expect(validateRegistration({ ...valid, confirmPassword: 'Runner2027' }, TODAY)).toEqual({
      confirmPassword: 'Las contraseñas no coinciden.',
    });
  });

  it('requires LOPDP consent', () => {
    expect(validateRegistration({ ...valid, acceptsLopdp: false }, TODAY)).toEqual({
      acceptsLopdp: 'Debes aceptar el tratamiento de tus datos personales.',
    });
  });

  it('requires names, a valid email and a city', () => {
    const errors = validateRegistration(
      { ...valid, firstName: ' ', email: 'ana', cityId: '' },
      TODAY,
    );
    expect(errors).toEqual({
      firstName: 'Ingresa tus nombres.',
      email: 'Ingresa un correo válido.',
      cityId: 'Selecciona tu ciudad.',
    });
  });

  it('limits the names to 60 characters', () => {
    expect(validateRegistration({ ...valid, lastName: 'a'.repeat(61) }, TODAY)).toEqual({
      lastName: 'Máximo 60 caracteres.',
    });
  });
});

describe('login and email validation', () => {
  it('requires email and password to sign in', () => {
    expect(validateLogin({ email: 'ana@runcty.dev', password: 'x' })).toEqual({});
    expect(validateLogin({ email: 'ana@runcty.dev', password: '' })).toEqual({
      password: 'Ingresa tu contraseña.',
    });
  });

  it('requires a valid email to recover the password', () => {
    expect(validateEmail('nope')).toBe('Ingresa un correo válido.');
    expect(validateEmail(' Ana@Runcty.dev ')).toBeNull();
  });
});
