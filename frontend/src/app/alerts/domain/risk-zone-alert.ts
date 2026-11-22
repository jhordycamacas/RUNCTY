import { LatLng } from '../../routes/domain/route';

export const ALERT_SEVERITIES = ['alta', 'media', 'baja'] as const;
export type AlertSeverity = (typeof ALERT_SEVERITIES)[number];

/**
 * A risk zone in force (RF-07-12 to RF-07-15): a circle around a place, for a period and,
 * optionally, a daily time window, maybe tied to one route.
 */
export interface RiskZoneAlert {
  id: string;
  /** Kind of risk, e.g. `robbery`; unknown kinds read as a generic risk zone. */
  type: string;
  severity: AlertSeverity;
  description: string;
  location: LatLng;
  radiusM: number;
  cityId: string;
  routeId?: string;
  /** ISO dates (`2026-11-22`) of the period in force. */
  validFrom: string;
  validTo: string;
  /** Daily window `HH:mm`, when the risk only applies at some hours. */
  startTime?: string;
  endTime?: string;
}

export abstract class RiskZoneAlertRepository {
  /** Alerts in force now in the city; empty when there are none. */
  abstract listActive(cityId: string): Promise<RiskZoneAlert[]>;
}
