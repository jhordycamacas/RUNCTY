import { toSummary } from './mappers';

describe('toSummary', () => {
  it('maps a full payload', () => {
    const summary = toSummary({
      generatedAt: '2026-11-17T15:00:00Z',
      truncated: true,
      users: {
        total: 4,
        registeredLast7Days: 2,
        registeredLast30Days: 3,
        signups: {
          daily: [{ start: '2026-11-17', count: 2 }, { start: 'soon', count: 1 }, 7],
          weekly: [{ start: '2026-11-16', count: 2 }],
          monthly: [{ start: '2026-11-01' }],
          before: { daily: 3, weekly: 'many' },
        },
        latest: [
          {
            uid: 'u1',
            firstName: 'Ana',
            lastName: 'Mora',
            cityId: 'loja',
            createdAt: '2026-11-17T17:00:00Z',
          },
          { uid: 'u2', firstName: 7, cityId: '', createdAt: '2026-11-16T10:00:00Z' },
          { uid: 'u3', createdAt: 'yesterday' },
          { firstName: 'Sin uid', createdAt: '2026-11-16T10:00:00Z' },
        ],
        sportProfiles: { completed: 1, percentage: 25 },
        bySportLevel: [{ level: 'beginner', users: 1 }, { level: 7 }, { users: 2 }],
      },
      routes: {
        total: 2,
        active: 1,
        inactive: 1,
        totalKm: 12.5,
        byCity: [{ cityId: 'loja', cityName: 'Loja', count: 2 }],
        safetyLevels: { high: 1, medium: 0, low: 1, unrated: 0 },
        distances: [{ name: 'Jipiro', distanceKm: 3.6 }, { name: 7 }],
      },
      cities: { cities: 1, zones: 2 },
      safety: { activeAlerts: 2, incidentsLast30Days: 'x' },
      byCity: [
        { cityId: 'loja', name: 'Loja', routes: 2, users: 3 },
        { cityId: 'x' },
        { name: 'sin id' },
      ],
    });

    expect(summary.truncated).toBe(true);
    expect(summary.users?.bySportLevel).toEqual([{ level: 'beginner', users: 1 }]);
    expect(summary.byCity).toEqual([
      { cityId: 'loja', name: 'Loja', routes: 2, users: 3 },
      { cityId: 'x', name: 'x', routes: 0, users: 0 },
    ]);
    expect(summary.users?.signups).toEqual({
      daily: [{ start: '2026-11-17', count: 2 }],
      weekly: [{ start: '2026-11-16', count: 2 }],
      monthly: [{ start: '2026-11-01', count: 0 }],
      before: { daily: 3, weekly: 0, monthly: 0 },
    });
    expect(summary.users?.latest).toEqual([
      {
        uid: 'u1',
        firstName: 'Ana',
        lastName: 'Mora',
        cityId: 'loja',
        createdAt: '2026-11-17T17:00:00Z',
      },
      { uid: 'u2', firstName: '', lastName: '', cityId: null, createdAt: '2026-11-16T10:00:00Z' },
    ]);
    expect(summary.safety).toEqual({ activeAlerts: 2, incidentsLast30Days: 0 });
    expect(summary.routes?.byCity[0]).toEqual({ cityId: 'loja', cityName: 'Loja', count: 2 });
    expect(summary.routes?.safetyLevels.low).toBe(1);
    expect(summary.routes?.distances).toEqual([{ name: 'Jipiro', distanceKm: 3.6 }]);
    expect(summary.cities).toEqual({ cities: 1, zones: 2 });
  });

  it('keeps a block the caller may not see as null', () => {
    const summary = toSummary({ generatedAt: '2026-11-17T15:00:00Z', users: null });

    expect(summary.users).toBeNull();
    expect(summary.byCity).toBeNull();
    expect(summary.routes).toBeNull();
    expect(summary.cities).toBeNull();
    expect(summary.safety).toBeNull();
    expect(summary.truncated).toBe(false);
  });

  it('turns malformed numbers into zero and drops malformed list items', () => {
    const summary = toSummary({
      users: {
        total: 'many',
        signups: { weekly: [{ start: 'soon', count: 1 }, { start: '2026-11-16' }, 7] },
      },
    });

    expect(summary.users?.total).toBe(0);
    expect(summary.users?.signups.weekly).toEqual([{ start: '2026-11-16', count: 0 }]);
    expect(summary.users?.sportProfiles).toEqual({ completed: 0, percentage: 0 });
  });

  it('does not fail with an older answer that lacks the new lists', () => {
    const summary = toSummary({
      users: { total: 2, sportProfiles: { completed: 1, percentage: 50 } },
      routes: { total: 1, active: 1 },
    });

    expect(summary.users?.bySportLevel).toEqual([]);
    expect(summary.users?.signups).toEqual({
      daily: [],
      weekly: [],
      monthly: [],
      before: { daily: 0, weekly: 0, monthly: 0 },
    });
    expect(summary.users?.latest).toEqual([]);
    expect(summary.safety).toBeNull();
    expect(summary.byCity).toBeNull();
    expect(summary.routes?.byCity).toEqual([]);
  });

  it('survives a response that is not an object', () => {
    expect(toSummary(null)).toMatchObject({ users: null, routes: null, cities: null });
  });
});
