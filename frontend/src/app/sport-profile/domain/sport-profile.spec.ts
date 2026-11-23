import { DEFAULT_SETTINGS } from '../../core/settings/system-settings';
import {
  SportProfile,
  SportProfileRules,
  formatPace,
  parsePace,
  parseSportProfileForm,
  sportProfileRules,
  toSportProfileForm,
} from './sport-profile';

const RULES: SportProfileRules = {
  levels: ['beginner', 'intermediate', 'advanced'],
  goals: ['health', 'weightLoss', 'racePrep', 'pace', 'social'],
  paceMinSecPerKm: 150,
  paceMaxSecPerKm: 1200,
  distanceMinKm: 1,
  distanceMaxKm: 50,
};

describe('pace helpers', () => {
  it('parses min:sec into seconds per km', () => {
    expect(parsePace('6:30')).toBe(390);
    expect(parsePace(' 10:05 ')).toBe(605);
    expect(parsePace('6.30')).toBeNull();
    expect(parsePace('6:75')).toBeNull();
  });

  it('formats seconds per km as min:sec', () => {
    expect(formatPace(390)).toBe('6:30');
    expect(formatPace(605)).toBe('10:05');
  });
});

describe('parseSportProfileForm', () => {
  const form = {
    level: 'intermediate',
    goals: ['racePrep', 'pace'],
    pace: '5:45',
    distance: '10,5',
  };

  it('converts the form into the profile sent to the API', () => {
    expect(parseSportProfileForm(form, RULES)).toEqual({
      profile: {
        level: 'intermediate',
        goals: ['racePrep', 'pace'],
        usualPaceSecPerKm: 345,
        preferredDistanceKm: 10.5,
      },
    });
  });

  it('explains each invalid field in Spanish', () => {
    expect(
      parseSportProfileForm({ level: '', goals: [], pace: '5', distance: 'diez' }, RULES).errors,
    ).toEqual({
      level: 'Selecciona tu nivel.',
      goals: 'Elige al menos un objetivo.',
      pace: 'Usa el formato min:seg, por ejemplo 6:30.',
      distance: 'Ingresa un número, por ejemplo 10.',
    });
  });

  it('rejects an unknown goal', () => {
    expect(parseSportProfileForm({ ...form, goals: ['fly'] }, RULES).errors).toEqual({
      goals: 'Hay un objetivo no válido.',
    });
  });

  it('rejects values outside the allowed ranges', () => {
    expect(parseSportProfileForm({ ...form, pace: '2:00', distance: '60' }, RULES).errors).toEqual({
      pace: 'El ritmo debe estar entre 2:30 y 20:00 min/km.',
      distance: 'La distancia debe estar entre 1 y 50 km.',
    });
    expect(parseSportProfileForm({ ...form, pace: '20:01', distance: '0,5' }, RULES).errors).toEqual({
      pace: 'El ritmo debe estar entre 2:30 y 20:00 min/km.',
      distance: 'La distancia debe estar entre 1 y 50 km.',
    });
  });

  it('round-trips a stored profile into form values', () => {
    const stored: SportProfile = {
      level: 'advanced',
      goals: ['social'],
      usualPaceSecPerKm: 300,
      preferredDistanceKm: 21,
    };

    expect(toSportProfileForm(stored, RULES)).toEqual({
      level: 'advanced',
      goals: ['social'],
      pace: '5:00',
      distance: '21',
    });
    expect(parseSportProfileForm(toSportProfileForm(stored, RULES), RULES)).toEqual({
      profile: stored,
    });
  });

  it('only accepts the options the catalog still has active', () => {
    const rules = { ...RULES, levels: ['beginner'], goals: ['health'] };

    expect(parseSportProfileForm(form, rules).errors).toEqual({
      level: 'Selecciona tu nivel.',
      goals: 'Hay un objetivo no válido.',
    });
  });

  it('validates against the ranges the admin configured', () => {
    const rules = {
      ...RULES,
      paceMinSecPerKm: 180,
      paceMaxSecPerKm: 600,
      distanceMinKm: 2,
      distanceMaxKm: 42,
    };

    expect(parseSportProfileForm({ ...form, pace: '2:30', distance: '1' }, rules).errors).toEqual({
      pace: 'El ritmo debe estar entre 3:00 y 10:00 min/km.',
      distance: 'La distancia debe estar entre 2 y 42 km.',
    });
    expect(parseSportProfileForm({ ...form, pace: '3:00', distance: '42' }, rules).errors).toBeUndefined();
  });

  it('leaves out of the edit form the stored choices that are no longer active', () => {
    const stored: SportProfile = {
      level: 'legacy',
      goals: ['health', 'retired'],
      usualPaceSecPerKm: 300,
      preferredDistanceKm: 5,
    };

    expect(toSportProfileForm(stored, RULES)).toEqual({
      level: '',
      goals: ['health'],
      pace: '5:00',
      distance: '5',
    });
  });
});

describe('sportProfileRules', () => {
  it('takes the active codes of the catalogs and the ranges of the settings', () => {
    const rules = sportProfileRules(
      [
        { code: 'a', label: 'A', order: 1, active: true },
        { code: 'b', label: 'B', order: 2, active: false },
      ],
      [{ code: 'g', label: 'G', order: 1, active: true }],
      { ...DEFAULT_SETTINGS, paceMinSecPerKm: 180, distanceMaxKm: 42 },
    );

    expect(rules).toEqual({
      levels: ['a'],
      goals: ['g'],
      paceMinSecPerKm: 180,
      paceMaxSecPerKm: 1200,
      distanceMinKm: 1,
      distanceMaxKm: 42,
    });
  });
});
