/** Tolerant mappers of `GET /admin/summary`: a malformed value becomes zero, never an error. */
import { asRecord } from '../../../routes/domain/mappers';
import { CitiesSummary, RoutesSummary, Summary, UsersSummary, WeekCount } from './summary';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const count = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0;

/** The numeric entries of a dictionary, for example the routes by difficulty. */
function counts(value: unknown): Record<string, number> {
  return Object.fromEntries(
    Object.entries(asRecord(value)).filter(
      (entry): entry is [string, number] =>
        typeof entry[1] === 'number' && Number.isFinite(entry[1]),
    ),
  );
}

function toWeeks(value: unknown): WeekCount[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const week = asRecord(item);
    const start = week['weekStart'];
    return typeof start === 'string' && DATE_PATTERN.test(start)
      ? [{ weekStart: start, count: count(week['count']) }]
      : [];
  });
}

function toUsers(value: unknown): UsersSummary | null {
  if (value === null || typeof value !== 'object') return null;
  const data = asRecord(value);
  const profiles = asRecord(data['sportProfiles']);
  const preferences = asRecord(data['preferences']);
  return {
    total: count(data['total']),
    byRole: counts(data['byRole']),
    registeredLast7Days: count(data['registeredLast7Days']),
    registeredLast30Days: count(data['registeredLast30Days']),
    registrationsByWeek: toWeeks(data['registrationsByWeek']),
    sportProfiles: {
      completed: count(profiles['completed']),
      percentage: count(profiles['percentage']),
    },
    preferences: {
      saved: count(preferences['saved']),
      appearance: counts(preferences['appearance']),
      units: counts(preferences['units']),
      notificationsEnabled: count(preferences['notificationsEnabled']),
    },
  };
}

function toRoutes(value: unknown): RoutesSummary | null {
  if (value === null || typeof value !== 'object') return null;
  const data = asRecord(value);
  const levels = asRecord(data['safetyLevels']);
  const factors = asRecord(data['riskFactors']);
  const byCity = Array.isArray(data['byCity']) ? data['byCity'] : [];
  return {
    total: count(data['total']),
    active: count(data['active']),
    inactive: count(data['inactive']),
    totalKm: count(data['totalKm']),
    byDifficulty: counts(data['byDifficulty']),
    bySurface: counts(data['bySurface']),
    byCity: byCity.flatMap((item) => {
      const city = asRecord(item);
      const id = city['cityId'];
      return typeof id === 'string'
        ? [
            {
              cityId: id,
              cityName: typeof city['cityName'] === 'string' ? city['cityName'] : id,
              count: count(city['count']),
            },
          ]
        : [];
    }),
    safetyLevels: {
      high: count(levels['high']),
      medium: count(levels['medium']),
      low: count(levels['low']),
      unrated: count(levels['unrated']),
    },
    timeSlots: count(data['timeSlots']),
    riskFactors: { total: count(factors['total']), bySeverity: counts(factors['bySeverity']) },
  };
}

function toCities(value: unknown): CitiesSummary | null {
  if (value === null || typeof value !== 'object') return null;
  const data = asRecord(value);
  return { cities: count(data['cities']), zones: count(data['zones']) };
}

export function toSummary(value: unknown): Summary {
  const data = asRecord(value);
  return {
    generatedAt: typeof data['generatedAt'] === 'string' ? data['generatedAt'] : '',
    truncated: data['truncated'] === true,
    users: toUsers(data['users']),
    routes: toRoutes(data['routes']),
    cities: toCities(data['cities']),
  };
}
