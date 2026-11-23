/**
 * The admin summary (analytics of the mobile app) as `GET /admin/summary` answers. Every block
 * is `null` when the caller may not see it. Only aggregates travel: no personal data.
 */
/** The time ranges of the acquisition chart: 30 days, 12 weeks (Monday first) and 12 months. */
export type SignupRange = 'daily' | 'weekly' | 'monthly';

export interface SignupBucket {
  /** First day of the day, week (a Monday) or month, `YYYY-MM-DD`, in the system time zone. */
  start: string;
  /** New accounts created in the bucket. */
  count: number;
}

/** New accounts per bucket of each range, oldest first, ending with the current bucket. */
export interface Signups {
  daily: SignupBucket[];
  weekly: SignupBucket[];
  monthly: SignupBucket[];
  /** Accounts registered before the first bucket of each range: the base of the accumulated total. */
  before: Record<SignupRange, number>;
}

/** One of the newest accounts: a name and a city, never an email or an id number. */
export interface LatestUser {
  uid: string;
  firstName: string;
  lastName: string;
  cityId: string | null;
  /** ISO instant (UTC). */
  createdAt: string;
}

/** Risk zone alerts in force now and safety incidents dated in the last 30 days. */
export interface SafetySummary {
  activeAlerts: number;
  incidentsLast30Days: number;
}

/** Users whose sport profile holds this level code (a catalog code, possibly no longer listed). */
export interface SportLevelCount {
  level: string;
  users: number;
}

export interface UsersSummary {
  total: number;
  registeredLast7Days: number;
  registeredLast30Days: number;
  signups: Signups;
  /** The newest accounts first (at most 5), for the callers that may read users. */
  latest: LatestUser[];
  sportProfiles: { completed: number; percentage: number };
  /** Most common level first; users without a profile are not listed (total minus completed). */
  bySportLevel: SportLevelCount[];
}

export interface RoutesByCity {
  cityId: string;
  cityName: string;
  count: number;
}

export interface RouteDistance {
  name: string;
  distanceKm: number;
}

export interface RoutesSummary {
  total: number;
  active: number;
  totalKm: number;
  byCity: RoutesByCity[];
  /** Routes by their worst level; `unrated` has no stored index. */
  safetyLevels: { high: number; medium: number; low: number; unrated: number };
  /** The longest routes, longest first. */
  distances: RouteDistance[];
}

/** Routes and users of one city, side by side. */
export interface CityComparison {
  cityId: string;
  name: string;
  routes: number;
  users: number;
}

export interface CitiesSummary {
  cities: number;
  zones: number;
}

export interface Summary {
  generatedAt: string;
  /** A scan reached its cap: the figures are a lower bound. */
  truncated: boolean;
  users: UsersSummary | null;
  routes: RoutesSummary | null;
  cities: CitiesSummary | null;
  /** Needs `routes.manage`; `null` otherwise or in an older answer. */
  safety: SafetySummary | null;
  /** Needs the permissions of both users and routes; `null` otherwise or in an older answer. */
  byCity: CityComparison[] | null;
}

/** Port of the summary endpoint. */
export abstract class SummaryRepository {
  abstract get(): Promise<Summary>;
}
