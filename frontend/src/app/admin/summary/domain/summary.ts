/**
 * The admin summary (analytics of the mobile app) as `GET /admin/summary` answers. Every block
 * is `null` when the caller may not see it. Only aggregates travel: no personal data.
 */
export interface WeekCount {
  /** The Monday of the week, `YYYY-MM-DD`. */
  weekStart: string;
  count: number;
}

export interface UsersSummary {
  total: number;
  byRole: Record<string, number>;
  registeredLast7Days: number;
  registeredLast30Days: number;
  /** The last 8 weeks, oldest first. */
  registrationsByWeek: WeekCount[];
  sportProfiles: { completed: number; percentage: number };
  preferences: {
    saved: number;
    appearance: Record<string, number>;
    units: Record<string, number>;
    notificationsEnabled: number;
  };
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
  inactive: number;
  totalKm: number;
  byDifficulty: Record<string, number>;
  bySurface: Record<string, number>;
  byCity: RoutesByCity[];
  /** Routes by their worst level; `unrated` has no stored index. */
  safetyLevels: { high: number; medium: number; low: number; unrated: number };
  /** The longest routes, longest first. */
  distances: RouteDistance[];
  timeSlots: number;
  riskFactors: { total: number; bySeverity: Record<string, number> };
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
}

/** Port of the summary endpoint. */
export abstract class SummaryRepository {
  abstract get(): Promise<Summary>;
}
