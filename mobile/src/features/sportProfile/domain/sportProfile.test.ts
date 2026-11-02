import {
  formatPace,
  parsePace,
  sportProfileFormSchema,
  sportProfileSchema,
  toSportProfileForm,
} from './sportProfile';

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

describe('sportProfileSchema (stored entity)', () => {
  const valid = { level: 'beginner', goals: ['health'], usualPaceSecPerKm: 420, preferredDistanceKm: 5 };

  it('accepts a valid profile', () => {
    expect(sportProfileSchema.safeParse(valid).success).toBe(true);
  });

  it('enforces the level enum, known goals and numeric ranges', () => {
    expect(sportProfileSchema.safeParse({ ...valid, level: 'pro' }).success).toBe(false);
    expect(sportProfileSchema.safeParse({ ...valid, goals: ['fly'] }).success).toBe(false);
    expect(sportProfileSchema.safeParse({ ...valid, goals: [] }).success).toBe(false);
    expect(sportProfileSchema.safeParse({ ...valid, usualPaceSecPerKm: 149 }).success).toBe(false);
    expect(sportProfileSchema.safeParse({ ...valid, usualPaceSecPerKm: 1201 }).success).toBe(false);
    expect(sportProfileSchema.safeParse({ ...valid, preferredDistanceKm: 0.5 }).success).toBe(false);
    expect(sportProfileSchema.safeParse({ ...valid, preferredDistanceKm: 51 }).success).toBe(false);
  });
});

describe('sportProfileFormSchema', () => {
  const form = { level: 'intermediate', goals: ['racePrep', 'pace'], pace: '5:45', distance: '10,5' };

  it('converts the form into the stored profile', () => {
    expect(sportProfileFormSchema.parse(form)).toEqual({
      level: 'intermediate',
      goals: ['racePrep', 'pace'],
      usualPaceSecPerKm: 345,
      preferredDistanceKm: 10.5,
    });
  });

  it('explains each invalid field in Spanish', () => {
    const result = sportProfileFormSchema.safeParse({ level: '', goals: [], pace: '5', distance: 'diez' });
    const messages = result.error?.issues.map((i) => i.message);
    expect(messages).toEqual(
      expect.arrayContaining([
        'Selecciona tu nivel.',
        'Elige al menos un objetivo.',
        'Usa el formato min:seg, por ejemplo 6:30.',
        'Ingresa un número, por ejemplo 10.',
      ]),
    );
  });

  it('rejects values outside the allowed ranges', () => {
    const result = sportProfileFormSchema.safeParse({ ...form, pace: '2:00', distance: '60' });
    const messages = result.error?.issues.map((i) => i.message);
    expect(messages).toEqual(
      expect.arrayContaining([
        'El ritmo debe estar entre 2:30 y 20:00 min/km.',
        'La distancia debe estar entre 1 y 50 km.',
      ]),
    );
  });

  it('round-trips a stored profile into form values', () => {
    const stored = { level: 'advanced' as const, goals: ['social' as const], usualPaceSecPerKm: 300, preferredDistanceKm: 21 };
    expect(toSportProfileForm(stored)).toEqual({ level: 'advanced', goals: ['social'], pace: '5:00', distance: '21' });
    expect(sportProfileFormSchema.parse(toSportProfileForm(stored))).toEqual(stored);
  });
});
