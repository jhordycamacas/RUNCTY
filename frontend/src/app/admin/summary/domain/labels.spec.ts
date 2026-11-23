import { bucketLabel, bucketTitle, greeting, recentDate, SIGNUP_RANGES } from './labels';

describe('summary labels', () => {
  it('greets by the hour of the day', () => {
    expect([greeting(8), greeting(15), greeting(21)]).toEqual([
      'Buenos días',
      'Buenas tardes',
      'Buenas noches',
    ]);
  });

  it('names the three ranges of the acquisition chart in plain words', () => {
    expect(SIGNUP_RANGES.map((range) => [range.id, range.label])).toEqual([
      ['daily', '30 días'],
      ['weekly', '12 semanas'],
      ['monthly', '12 meses'],
    ]);
  });

  describe('bucketLabel', () => {
    it('writes a day and a week as the day and the short month, with no time zone shift', () => {
      expect(bucketLabel('daily', '2026-11-17')).toBe('17 nov');
      expect(bucketLabel('weekly', '2026-09-28')).toBe('28 sept');
    });

    it('writes a month as its short name and adds the year only to January', () => {
      expect(bucketLabel('monthly', '2026-11-01')).toBe('nov');
      expect(bucketLabel('monthly', '2026-01-01')).toBe('ene 2026');
    });
  });

  describe('bucketTitle', () => {
    it('spells out the day, the week and the month for the tooltip', () => {
      expect(bucketTitle('daily', '2026-11-17')).toContain('17 nov');
      expect(bucketTitle('weekly', '2026-11-16')).toBe('Semana del 16 nov');
      expect(bucketTitle('monthly', '2026-11-01')).toBe('noviembre de 2026');
    });
  });

  describe('recentDate', () => {
    const now = new Date(2026, 10, 23, 15, 0); // local 23 Nov 2026
    const at = (month: number, day: number, year = 2026) =>
      new Date(year, month, day, 12).toISOString();

    it('says today and yesterday', () => {
      expect(recentDate(at(10, 23), now)).toBe('hoy');
      expect(recentDate(at(10, 22), now)).toBe('ayer');
    });

    it('counts the days up to a week', () => {
      expect(recentDate(at(10, 21), now)).toBe('hace 2 días');
      expect(recentDate(at(10, 17), now)).toBe('hace 6 días');
    });

    it('falls back to the short date, with the year when it is not this one', () => {
      expect(recentDate(at(10, 10), now)).toBe('10 nov');
      expect(recentDate(at(11, 5, 2025), now)).toBe('5 dic 2025');
    });

    it('keeps a clock in the future from reading as negative days', () => {
      expect(recentDate(at(10, 24), now)).toBe('hoy');
    });
  });
});
