/** The system parameters, as `GET /settings` answers them (camelCase, same keys as the API). */
export interface SystemSettings {
  penaltyLow: number;
  penaltyMedium: number;
  penaltyHigh: number;
  thresholdHigh: number;
  thresholdMedium: number;
  incidentWindowDays: number;
  incidentMarginMinutes: number;
  timeZone: string;
  nearbyRadiusM: number;
  maxSearchRadiusM: number;
  maxAlertRadiusM: number;
  maxTimeSlotsPerRoute: number;
  maxSegmentsPerRoute: number;
  maxRiskFactorsPerSegment: number;
  routeNameMaxLength: number;
  routeDescriptionMaxLength: number;
  routeMaxDistanceKm: number;
  routeMaxElevationM: number;
  segmentMaxPoints: number;
  paceMinSecPerKm: number;
  paceMaxSecPerKm: number;
  distanceMinKm: number;
  distanceMaxKm: number;
  safeRouteDistanceTolerance: number;
  safeRouteMaxDistanceKm: number;
  countryCode: string;
}

export type SettingKey = keyof SystemSettings;

/** What the system starts with; the same values the backend falls back to. */
export const DEFAULT_SETTINGS: Readonly<SystemSettings> = {
  penaltyLow: 10,
  penaltyMedium: 20,
  penaltyHigh: 35,
  thresholdHigh: 70,
  thresholdMedium: 40,
  incidentWindowDays: 365,
  incidentMarginMinutes: 60,
  timeZone: 'America/Guayaquil',
  nearbyRadiusM: 500,
  maxSearchRadiusM: 50000,
  maxAlertRadiusM: 5000,
  maxTimeSlotsPerRoute: 12,
  maxSegmentsPerRoute: 50,
  maxRiskFactorsPerSegment: 20,
  routeNameMaxLength: 80,
  routeDescriptionMaxLength: 500,
  routeMaxDistanceKm: 500,
  routeMaxElevationM: 10000,
  segmentMaxPoints: 500,
  paceMinSecPerKm: 150,
  paceMaxSecPerKm: 1200,
  distanceMinKm: 1,
  distanceMaxKm: 50,
  safeRouteDistanceTolerance: 0.2,
  safeRouteMaxDistanceKm: 500,
  countryCode: 'EC',
};

/** Tolerant read of a settings body: anything missing or of the wrong type takes its default. */
export function toSystemSettings(raw: unknown): SystemSettings {
  const data = (raw ?? {}) as Record<string, unknown>;
  const read = Object.fromEntries(
    (Object.keys(DEFAULT_SETTINGS) as SettingKey[]).map((key) => {
      const value = data[key];
      const fallback = DEFAULT_SETTINGS[key];
      const valid =
        typeof fallback === 'number'
          ? typeof value === 'number' && Number.isFinite(value)
          : typeof value === 'string' && value !== '';
      return [key, valid ? value : fallback];
    }),
  );
  return read as unknown as SystemSettings;
}
