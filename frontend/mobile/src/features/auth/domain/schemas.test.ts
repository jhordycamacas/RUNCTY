import { ageOn, makeBirthDateSchema } from './birthDate';
import { passwordSchema } from './passwordPolicy';
import { idNumberSchema } from './personalData';
import { forgotPasswordSchema, loginSchema, makeRegisterSchema } from './schemas';

const TODAY = new Date(2026, 10, 2); // 2026-11-02 local time

function firstError(result: { success: boolean; error?: { issues: { message: string }[] } }) {
  return result.success ? undefined : result.error?.issues[0]?.message;
}

describe('passwordSchema', () => {
  it.each(['abc12345', 'Runner2026', 'clave segura 1'])('accepts %s', (value) => {
    expect(passwordSchema.safeParse(value).success).toBe(true);
  });

  it('rejects passwords shorter than 8 characters', () => {
    expect(firstError(passwordSchema.safeParse('abc123'))).toBe('La contraseña debe tener al menos 8 caracteres.');
  });

  it('requires at least one letter and one number', () => {
    expect(firstError(passwordSchema.safeParse('12345678'))).toBe('La contraseña debe incluir al menos una letra.');
    expect(firstError(passwordSchema.safeParse('abcdefgh'))).toBe('La contraseña debe incluir al menos un número.');
  });
});

describe('birth date', () => {
  const schema = makeBirthDateSchema(() => TODAY);

  it('computes age on a given day', () => {
    expect(ageOn('2000-11-02', TODAY)).toBe(26);
    expect(ageOn('2000-11-03', TODAY)).toBe(25);
  });

  it('accepts a past date within the allowed age range', () => {
    expect(schema.safeParse('1990-05-20').success).toBe(true);
  });

  it('accepts minors (parental consent is an open product decision)', () => {
    expect(schema.safeParse('2014-01-15').success).toBe(true);
  });

  it('rejects malformed or impossible dates', () => {
    expect(firstError(schema.safeParse('20/05/1990'))).toBe('Usa el formato AAAA-MM-DD.');
    expect(firstError(schema.safeParse('1990-02-30'))).toBe('La fecha no existe.');
  });

  it('rejects today and future dates', () => {
    expect(firstError(schema.safeParse('2026-11-02'))).toBe('La fecha de nacimiento debe ser anterior a hoy.');
    expect(firstError(schema.safeParse('2030-01-01'))).toBe('La fecha de nacimiento debe ser anterior a hoy.');
  });

  it('rejects ages outside 5 to 110 years', () => {
    expect(firstError(schema.safeParse('2023-01-01'))).toBe('La edad debe estar entre 5 y 110 años.');
    expect(firstError(schema.safeParse('1900-01-01'))).toBe('La edad debe estar entre 5 y 110 años.');
  });
});

describe('idNumberSchema', () => {
  it('accepts an empty value (optional) or 10 digits', () => {
    expect(idNumberSchema.safeParse('').success).toBe(true);
    expect(idNumberSchema.safeParse('1104567890').success).toBe(true);
  });

  it('rejects anything else', () => {
    expect(firstError(idNumberSchema.safeParse('11045'))).toBe('La cédula debe tener 10 dígitos.');
    expect(idNumberSchema.safeParse('11045678AB').success).toBe(false);
  });
});

describe('registerSchema', () => {
  const schema = makeRegisterSchema(() => TODAY);
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

  it('accepts a complete form and normalizes the email', () => {
    const result = schema.safeParse(valid);
    expect(result.success).toBe(true);
    expect(result.data?.email).toBe('ana@runcty.dev');
  });

  it('requires matching passwords', () => {
    const result = schema.safeParse({ ...valid, confirmPassword: 'Runner2027' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]).toMatchObject({
      path: ['confirmPassword'],
      message: 'Las contraseñas no coinciden.',
    });
  });

  it('requires LOPDP consent', () => {
    const result = schema.safeParse({ ...valid, acceptsLopdp: false });
    expect(result.error?.issues[0]?.message).toBe('Debes aceptar el tratamiento de tus datos personales.');
  });

  it('requires names, a valid email and a city', () => {
    const result = schema.safeParse({ ...valid, firstName: ' ', email: 'ana', cityId: '' });
    const messages = result.error?.issues.map((i) => i.message);
    expect(messages).toEqual(
      expect.arrayContaining(['Ingresa tus nombres.', 'Ingresa un correo válido.', 'Selecciona tu ciudad.']),
    );
  });
});

describe('login and forgot password schemas', () => {
  it('requires email and password to sign in', () => {
    expect(loginSchema.safeParse({ email: 'ana@runcty.dev', password: 'x' }).success).toBe(true);
    expect(loginSchema.safeParse({ email: 'ana@runcty.dev', password: '' }).success).toBe(false);
  });

  it('requires a valid email to recover the password', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'nope' }).success).toBe(false);
  });
});
