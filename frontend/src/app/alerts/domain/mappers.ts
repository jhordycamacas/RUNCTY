import { asRecord, asString, asTime, oneOf } from '../../routes/domain/mappers';
import { ALERT_SEVERITIES, RiskZoneAlert } from './risk-zone-alert';

const asNumber = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0;

/** Tolerant read of one alert: missing fields fall back to safe values. */
export function toRiskZoneAlert(raw: unknown): RiskZoneAlert {
  const data = asRecord(raw);
  const location = asRecord(data['location']);
  return {
    id: asString(data['id']),
    type: asString(data['type'], 'other'),
    severity: oneOf(ALERT_SEVERITIES, data['severity']) ?? 'media',
    description: asString(data['description']),
    location: { lat: asNumber(location['lat']), lng: asNumber(location['lng']) },
    radiusM: asNumber(data['radiusM']),
    cityId: asString(data['cityId']),
    routeId: asString(data['routeId']) || undefined,
    validFrom: asString(data['validFrom']),
    validTo: asString(data['validTo']),
    startTime: asTime(data['startTime']) ?? undefined,
    endTime: asTime(data['endTime']) ?? undefined,
  };
}
