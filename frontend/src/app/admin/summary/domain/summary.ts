/**
 * The admin summary (analytics of the mobile app) as `GET /admin/summary` answers. Every block
 * is `null` when the caller may not see it. Only aggregates travel: no personal data.
 */
export interface WeekCount {
  /** The Monday of the week, `YYYY-MM-DD`. */
  weekStart: string;
  count: number;
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
  /** The last 8 weeks, oldest first. */
  registrationsByWeek: WeekCount[];
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
  /** Needs the permissions of both users and routes; `null` otherwise or in an older answer. */
  byCity: CityComparison[] | null;
}

/** Port of the summary endpoint. */
export abstract class SummaryRepository {
  abstract get(): Promise<Summary>;
}
