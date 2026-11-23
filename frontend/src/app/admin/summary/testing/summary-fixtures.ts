import { Summary } from '../domain/summary';

/** A complete summary, for the specs. Override only what a test is about. */
export function summaryFixture(changes: Partial<Summary> = {}): Summary {
  return {
    generatedAt: '2026-11-17T15:00:00Z',
    truncated: false,
    users: {
      total: 12,
      byRole: { runner: 10, admin: 2 },
      registeredLast7Days: 3,
      registeredLast30Days: 9,
      registrationsByWeek: [
        { weekStart: '2026-11-02', count: 1 },
        { weekStart: '2026-11-09', count: 2 },
        { weekStart: '2026-11-16', count: 3 },
      ],
      sportProfiles: { completed: 6, percentage: 50 },
      preferences: {
        saved: 8,
        appearance: { system: 2, light: 5, dark: 1 },
        units: { metric: 8, imperial: 0 },
        notificationsEnabled: 6,
      },
    },
    routes: {
      total: 5,
      active: 4,
      inactive: 1,
      totalKm: 41.3,
      byDifficulty: { Principiante: 2, Intermedio: 2, Avanzado: 1 },
      bySurface: { Asfalto: 3, Sendero: 1, Mixto: 1 },
      byCity: [{ cityId: 'loja', cityName: 'Loja', count: 5 }],
      safetyLevels: { high: 2, medium: 1, low: 1, unrated: 1 },
      distances: [
        { name: 'Jipiro', distanceKm: 10.8 },
        { name: 'Tebaida', distanceKm: 2.8 },
      ],
      timeSlots: 8,
      riskFactors: { total: 6, bySeverity: { low: 2, medium: 3, high: 1 } },
    },
    cities: { cities: 1, zones: 2 },
    ...changes,
  };
}
