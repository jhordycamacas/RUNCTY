/**
 * Tolerant mappers for the manager view of `GET /routes/{id}`. Malformed time slots and risk
 * factors are dropped instead of breaking the screen.
 */
import {
  asRecord,
  asString,
  asTime,
  oneOf,
  toList,
  toRoute,
  toSegment,
} from '../../../routes/domain/mappers';
import { SEVERITIES } from '../../../routes/domain/route';
import { ManagedRouteDetail, RiskFactor, TimeSlot } from './managed-route';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const asOptionalString = (value: unknown): string | null =>
  typeof value === 'string' ? value : null;
const asDate = (value: unknown): string | null =>
  typeof value === 'string' && DATE_PATTERN.test(value) ? value : null;

function toTimeSlot(value: unknown): TimeSlot | null {
  const data = asRecord(value);
  const id = asString(data['id']);
  const startTime = asTime(data['startTime']);
  const endTime = asTime(data['endTime']);
  if (!id || !startTime || !endTime) return null;
  return {
    id,
    label: asOptionalString(data['label']),
    startTime,
    endTime,
    validFrom: asDate(data['validFrom']),
    validTo: asDate(data['validTo']),
  };
}

function toRiskFactor(value: unknown): RiskFactor | null {
  const data = asRecord(value);
  const id = asString(data['id']);
  const severity = oneOf(SEVERITIES, data['severity']);
  if (!id || !severity) return null;
  return {
    id,
    type: asString(data['type'], 'other'),
    severity,
    description: asString(data['description']),
    startTime: asTime(data['startTime']),
    endTime: asTime(data['endTime']),
  };
}

/** The manager detail: segments sorted by `order` with their risk factors, slots by start time. */
export function toManagedRouteDetail(raw: unknown): ManagedRouteDetail {
  const data = asRecord(raw);
  const segments = toList(data['segments'], (item) => ({
    ...toSegment(item),
    riskFactors: toList(asRecord(item)['riskFactors'], toRiskFactor),
  })).sort((a, b) => a.order - b.order);
  const timeSlots = toList(data['timeSlots'], toTimeSlot).sort(
    (a, b) => a.startTime.localeCompare(b.startTime) || a.id.localeCompare(b.id),
  );
  return { route: toRoute(raw), segments, timeSlots };
}
