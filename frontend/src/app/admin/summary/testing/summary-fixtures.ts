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
      registrationsByWeek: [
        { weekStart: '2026-11-02', count: 1 },
        { weekStart: '2026-11-09', count: 2 },
        { weekStart: '2026-11-16', count: 3 },
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
    byCity: [
      { cityId: 'loja', name: 'Loja', routes: 4, users: 9 },
      { cityId: 'quito', name: 'Quito', routes: 1, users: 3 },
    ],
    ...changes,
  };
}
