import {
  SportProfile,
  formatPace,
  parsePace,
  parseSportProfileForm,
  toSportProfileForm,
} from './sport-profile';

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
    expect(parseSportProfileForm(form)).toEqual({
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
      parseSportProfileForm({ level: '', goals: [], pace: '5', distance: 'diez' }).errors,
    ).toEqual({
      level: 'Selecciona tu nivel.',
      goals: 'Elige al menos un objetivo.',
      pace: 'Usa el formato min:seg, por ejemplo 6:30.',
      distance: 'Ingresa un número, por ejemplo 10.',
    });
  });

  it('rejects an unknown goal', () => {
    expect(parseSportProfileForm({ ...form, goals: ['fly'] }).errors).toEqual({
      goals: 'Hay un objetivo no válido.',
    });
  });

  it('rejects values outside the allowed ranges', () => {
    expect(parseSportProfileForm({ ...form, pace: '2:00', distance: '60' }).errors).toEqual({
      pace: 'El ritmo debe estar entre 2:30 y 20:00 min/km.',
      distance: 'La distancia debe estar entre 1 y 50 km.',
    });
    expect(parseSportProfileForm({ ...form, pace: '20:01', distance: '0,5' }).errors).toEqual({
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

    expect(toSportProfileForm(stored)).toEqual({
      level: 'advanced',
      goals: ['social'],
      pace: '5:00',
      distance: '21',
    });
    expect(parseSportProfileForm(toSportProfileForm(stored))).toEqual({ profile: stored });
  });
});
