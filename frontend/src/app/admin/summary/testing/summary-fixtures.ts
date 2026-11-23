import { Summary } from '../domain/summary';

/** A complete summary, for the specs. Override only what a test is about. */
export function summaryFixture(changes: Partial<Summary> = {}): Summary {
  return {
    generatedAt: '2026-11-17T15:00:00Z',
    truncated: false,
    users: {
      total: 12,
      registeredLast7Days: 3,
      registeredLast30Days: 9,
      signups: {
        daily: [
          { start: '2026-11-16', count: 0 },
          { start: '2026-11-17', count: 2 },
        ],
        weekly: [
          { start: '2026-11-02', count: 1 },
          { start: '2026-11-09', count: 2 },
          { start: '2026-11-16', count: 3 },
        ],
        monthly: [
          { start: '2026-10-01', count: 4 },
          { start: '2026-11-01', count: 5 },
        ],
        before: { daily: 10, weekly: 6, monthly: 3 },
      },
      latest: [
        {
          uid: 'u1',
          firstName: 'Ana',
          lastName: 'Mora',
          cityId: 'loja',
          createdAt: '2026-11-17T12:00:00Z',
        },
        {
          uid: 'u2',
          firstName: 'Luis',
          lastName: 'Paz',
          cityId: null,
          createdAt: '2026-11-10T12:00:00Z',
        },
      ],
      sportProfiles: { completed: 6, percentage: 50 },
      bySportLevel: [
        { level: 'beginner', users: 3 },
        { level: 'advanced', users: 2 },
        { level: 'legacy-code', users: 1 },
      ],
    },
    routes: {
      total: 5,
      active: 4,
      totalKm: 41.3,
      byCity: [{ cityId: 'loja', cityName: 'Loja', count: 5 }],
      safetyLevels: { high: 2, medium: 1, low: 1, unrated: 1 },
      distances: [
        { name: 'Jipiro', distanceKm: 10.8 },
        { name: 'Tebaida', distanceKm: 2.8 },
      ],
    },
    cities: { cities: 1, zones: 2 },
    safety: { activeAlerts: 2, incidentsLast30Days: 7 },
    byCity: [
      { cityId: 'loja', name: 'Loja', routes: 4, users: 9 },
      { cityId: 'quito', name: 'Quito', routes: 1, users: 3 },
    ],
    ...changes,
  };
}
