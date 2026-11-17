import { toSummary } from './mappers';

describe('toSummary', () => {
  it('maps a full payload', () => {
    const summary = toSummary({
      generatedAt: '2026-11-17T15:00:00Z',
      truncated: true,
      users: {
        total: 4,
        byRole: { runner: 3, admin: 1 },
        registeredLast7Days: 2,
        registeredLast30Days: 3,
        registrationsByWeek: [{ weekStart: '2026-11-16', count: 2 }],
        sportProfiles: { completed: 1, percentage: 25 },
        preferences: {
          saved: 2,
          appearance: { light: 1, dark: 1 },
          units: { metric: 2 },
          notificationsEnabled: 1,
        },
      },
      routes: {
        total: 2,
        active: 1,
        inactive: 1,
        totalKm: 12.5,
        byDifficulty: { beginner: 2 },
        bySurface: { asphalt: 2 },
        byCity: [{ cityId: 'loja', cityName: 'Loja', count: 2 }],
        safetyLevels: { high: 1, medium: 0, low: 1, unrated: 0 },
        timeSlots: 3,
        riskFactors: { total: 2, bySeverity: { high: 2 } },
      },
      cities: { cities: 1, zones: 2 },
    });

    expect(summary.truncated).toBe(true);
    expect(summary.users?.byRole).toEqual({ runner: 3, admin: 1 });
    expect(summary.users?.registrationsByWeek).toEqual([{ weekStart: '2026-11-16', count: 2 }]);
    expect(summary.routes?.byCity[0]).toEqual({ cityId: 'loja', cityName: 'Loja', count: 2 });
    expect(summary.routes?.safetyLevels.low).toBe(1);
    expect(summary.cities).toEqual({ cities: 1, zones: 2 });
  });

  it('keeps a block the caller may not see as null', () => {
    const summary = toSummary({ generatedAt: '2026-11-17T15:00:00Z', users: null });

    expect(summary.users).toBeNull();
    expect(summary.routes).toBeNull();
    expect(summary.cities).toBeNull();
    expect(summary.truncated).toBe(false);
  });

  it('turns malformed numbers into zero and drops malformed list items', () => {
    const summary = toSummary({
      users: {
        total: 'many',
        byRole: { runner: 'x', admin: 2 },
        registrationsByWeek: [{ weekStart: 'soon', count: 1 }, { weekStart: '2026-11-16' }, 7],
      },
    });

    expect(summary.users?.total).toBe(0);
    expect(summary.users?.byRole).toEqual({ admin: 2 });
    expect(summary.users?.registrationsByWeek).toEqual([{ weekStart: '2026-11-16', count: 0 }]);
    expect(summary.users?.sportProfiles).toEqual({ completed: 0, percentage: 0 });
  });

  it('survives a response that is not an object', () => {
    expect(toSummary(null)).toMatchObject({ users: null, routes: null, cities: null });
  });
});
