import { DEFAULT_SETTINGS } from '../../../core/settings/system-settings';
import { sportProfileRules } from '../../../sport-profile/domain/sport-profile';
import { userDetail } from '../testing/fake-user-admin.repository';
import {
  parsePersonalEdit,
  personalFormOf,
  personalServerErrors,
  sportFormOf,
  sportRulesFor,
  sportServerErrors,
} from './user-edit';

const TODAY = new Date('2026-11-22T12:00:00Z');
const levels = [
  { code: 'beginner', label: 'Principiante', order: 1, active: true },
  { code: 'legacy', label: 'Antiguo', order: 2, active: false },
];
const goals = [{ code: 'health', label: 'Salud', order: 1, active: true }];
const rules = sportProfileRules(levels, goals, DEFAULT_SETTINGS);

describe('personal data edit', () => {
  it('starts the form with the data of the user; a missing cédula is an empty text', () => {
    const { user } = userDetail('u1');

    expect(personalFormOf(user)).toEqual({
      firstName: 'Ana',
      lastName: 'Pérez',
      birthDate: '1995-04-23',
      cityId: 'loja',
      idNumber: '1710034065',
    });
    expect(personalFormOf({ ...user, idNumber: null }).idNumber).toBe('');
  });

  it('trims what is valid and lists the errors of the runner form otherwise', () => {
    const form = personalFormOf(userDetail('u1').user);

    expect(parsePersonalEdit({ ...form, firstName: '  Ana  ' }, TODAY)).toEqual({
      data: { ...form, firstName: 'Ana' },
    });
    const invalid = parsePersonalEdit({ ...form, firstName: ' ', idNumber: '12' }, TODAY);
    expect(invalid.data).toBeUndefined();
    expect(invalid.errors).toEqual({
      firstName: 'Ingresa tus nombres.',
      idNumber: 'La cédula debe tener 10 dígitos.',
    });
  });

  it('reads the field reasons of the API in Spanish and ignores unknown fields', () => {
    expect(
      personalServerErrors({
        firstName: 'required',
        idNumber: 'invalid-format',
        other: 'x',
        cityId: 'weird',
      }),
    ).toEqual({
      firstName: 'Este dato es obligatorio.',
      idNumber: 'La cédula debe tener 10 dígitos.',
      cityId: 'Revisa este dato.',
    });
  });
});

describe('sport profile edit', () => {
  it('keeps the current level selectable even when the catalog deactivated it', () => {
    expect(sportRulesFor(rules, 'legacy').levels).toEqual(['beginner', 'legacy']);
    expect(sportRulesFor(rules, 'beginner').levels).toEqual(['beginner']);
    expect(sportRulesFor(rules, null).levels).toEqual(['beginner']);
  });

  it('turns the stored profile into form values, leaving out what is missing', () => {
    const { sportProfile } = userDetail('u1');

    expect(sportFormOf(sportProfile, sportRulesFor(rules, 'beginner'))).toEqual({
      level: 'beginner',
      goals: ['health'],
      pace: '6:30',
      distance: '10',
    });
    expect(sportFormOf(null, rules)).toEqual({ level: '', goals: [], pace: '', distance: '' });
    expect(
      sportFormOf(
        { level: 'beginner', goals: ['gone'], usualPaceSecPerKm: null, preferredDistanceKm: null },
        rules,
      ),
    ).toEqual({ level: 'beginner', goals: [], pace: '', distance: '' });
  });

  it('maps the field reasons of the API to the form fields', () => {
    expect(
      sportServerErrors({
        level: 'invalid-choice',
        usualPaceSecPerKm: 'out-of-range',
        preferredDistanceKm: 'invalid',
        goals: 'invalid-choice',
      }),
    ).toEqual({
      level: 'Elige una opción válida.',
      goals: 'Elige una opción válida.',
      pace: 'Está fuera del rango permitido.',
      distance: 'Revisa este dato.',
    });
  });
});
