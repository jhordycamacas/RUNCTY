/** Tolerant mappers of `GET /admin/summary`: a malformed value becomes zero, never an error. */
import { asRecord } from '../../../routes/domain/mappers';
import {
  CitiesSummary,
  CityComparison,
  LatestUser,
  RoutesSummary,
  SafetySummary,
  SignupBucket,
  Signups,
  SportLevelCount,
  Summary,
  UsersSummary,
} from './summary';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const count = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0;

const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

function toBuckets(value: unknown): SignupBucket[] {
  return list(value).flatMap((item) => {
    const bucket = asRecord(item);
    const start = bucket['start'];
    return typeof start === 'string' && DATE_PATTERN.test(start)
      ? [{ start, count: count(bucket['count']) }]
      : [];
  });
}

function toSignups(value: unknown): Signups {
  const data = asRecord(value);
  const before = asRecord(data['before']);
  return {
    daily: toBuckets(data['daily']),
    weekly: toBuckets(data['weekly']),
    monthly: toBuckets(data['monthly']),
    before: {
      daily: count(before['daily']),
      weekly: count(before['weekly']),
      monthly: count(before['monthly']),
    },
  };
}

const text = (value: unknown): string => (typeof value === 'string' ? value : '');

function toLatest(value: unknown): LatestUser[] {
  return list(value).flatMap((item) => {
    const user = asRecord(item);
    const uid = user['uid'];
    const created = user['createdAt'];
    if (typeof uid !== 'string' || !uid) return [];
    if (typeof created !== 'string' || Number.isNaN(Date.parse(created))) return [];
    const city = user['cityId'];
    return [
      {
        uid,
        firstName: text(user['firstName']),
        lastName: text(user['lastName']),
        cityId: typeof city === 'string' && city ? city : null,
        createdAt: created,
      },
    ];
  });
}

function toSafety(value: unknown): SafetySummary | null {
  if (value === null || typeof value !== 'object') return null;
  const data = asRecord(value);
  return {
    activeAlerts: count(data['activeAlerts']),
    incidentsLast30Days: count(data['incidentsLast30Days']),
  };
}

function toSportLevels(value: unknown): SportLevelCount[] {
  return list(value).flatMap((item) => {
    const entry = asRecord(item);
    const level = entry['level'];
    return typeof level === 'string' && level ? [{ level, users: count(entry['users']) }] : [];
  });
}

function toCityComparison(value: unknown): CityComparison[] | null {
  if (!Array.isArray(value)) return null;
  return value.flatMap((item) => {
    const city = asRecord(item);
    const id = city['cityId'];
    if (typeof id !== 'string') return [];
    return [
      {
        cityId: id,
        name: typeof city['name'] === 'string' ? city['name'] : id,
        routes: count(city['routes']),
        users: count(city['users']),
      },
    ];
  });
}

function toUsers(value: unknown): UsersSummary | null {
  if (value === null || typeof value !== 'object') return null;
  const data = asRecord(value);
  const profiles = asRecord(data['sportProfiles']);
  return {
    total: count(data['total']),
    registeredLast7Days: count(data['registeredLast7Days']),
    registeredLast30Days: count(data['registeredLast30Days']),
    signups: toSignups(data['signups']),
    latest: toLatest(data['latest']),
    sportProfiles: {
      completed: count(profiles['completed']),
      percentage: count(profiles['percentage']),
    },
    bySportLevel: toSportLevels(data['bySportLevel']),
  };
}

function toRoutes(value: unknown): RoutesSummary | null {
  if (value === null || typeof value !== 'object') return null;
  const data = asRecord(value);
  const levels = asRecord(data['safetyLevels']);
  return {
    total: count(data['total']),
    active: count(data['active']),
    totalKm: count(data['totalKm']),
    byCity: list(data['byCity']).flatMap((item) => {
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
    distances: list(data['distances']).flatMap((item) => {
      const route = asRecord(item);
      return typeof route['name'] === 'string'
        ? [{ name: route['name'], distanceKm: count(route['distanceKm']) }]
        : [];
    }),
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
    safety: toSafety(data['safety']),
    byCity: toCityComparison(data['byCity']),
  };
}
