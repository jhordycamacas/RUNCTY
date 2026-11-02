/**
 * RF-05 / RF-07: validation of the admin payloads for routes, segments,
 * time slots and risk factors. Every failure is an `invalid-argument`
 * DomainError with a stable `reason` the admin panel translates.
 */
import { CITY_ID_PATTERN } from '../../cities/deleteCity';
import { invalidArgument } from '../../shared/errors';
import { SEVERITIES, type Severity } from './safety';
import { isIsoDate, parseTime } from './time';

export const SURFACES = ['asphalt', 'trail', 'mixed', 'track'] as const;
export const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;
export const RISK_FACTOR_TYPES = [
  'poor_lighting',
  'traffic',
  'isolated_area',
  'harassment',
  'uneven_terrain',
  'flood_risk',
  'other',
] as const;

export type Surface = (typeof SURFACES)[number];
export type Difficulty = (typeof DIFFICULTIES)[number];
export type RiskFactorType = (typeof RISK_FACTOR_TYPES)[number];

/** Firestore auto ids (20 chars) and slugs used by the seed. */
const DOC_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
const MAX_NAME = 80;
const MAX_LABEL = 80;
const MAX_DESCRIPTION = 500;
const MAX_FACTOR_DESCRIPTION = 200;
const MAX_SLOT_LABEL = 40;
const MAX_DISTANCE_KM = 500;
const MAX_ELEVATION_M = 10000;
const MIN_POINTS = 2;
const MAX_POINTS = 500;

export interface LatLng {
  lat: number;
  lng: number;
}

export interface RoutePoint extends LatLng {
  label: string;
}

export interface RouteInput {
  name: string;
  cityId: string;
  description: string;
  start: RoutePoint;
  end: RoutePoint;
  distanceKm: number;
  elevationGainM: number;
  surface: Surface;
  difficulty: Difficulty;
  active: boolean;
}

export interface SegmentInput {
  name: string;
  coordinates: LatLng[];
  /** Target position (0-based); undefined keeps / appends. */
  order: number | undefined;
}

export interface TimeSlotInput {
  label?: string;
  startTime: string;
  endTime: string;
  validFrom?: string;
  validTo?: string;
}

export interface RiskFactorInput {
  type: RiskFactorType;
  severity: Severity;
  description: string;
  startTime?: string;
  endTime?: string;
}

export const asRecord = (raw: unknown): Record<string, unknown> =>
  typeof raw === 'object' && raw !== null && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};

const isFiniteNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

const oneOf = <T extends string>(values: readonly T[], v: unknown): v is T =>
  typeof v === 'string' && (values as readonly string[]).includes(v);

function requiredText(value: unknown, max: number, reason: string, message: string): string {
  const text = typeof value === 'string' ? value.trim() : '';
  if (text.length === 0 || text.length > max) throw invalidArgument(reason, message);
  return text;
}

function optionalText(value: unknown, max: number, reason: string, message: string): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string' || value.trim().length > max) throw invalidArgument(reason, message);
  return value.trim();
}

export function parseDocId(value: unknown, reason: string): string {
  if (typeof value !== 'string' || !DOC_ID_PATTERN.test(value)) {
    throw invalidArgument(reason, 'A valid id is required.');
  }
  return value;
}

function parseLatLng(raw: unknown): LatLng | null {
  const point = asRecord(raw);
  const { lat, lng } = point;
  if (!isFiniteNumber(lat) || !isFiniteNumber(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

function parseRoutePoint(raw: unknown, reason: string): RoutePoint {
  const point = parseLatLng(raw);
  const label = asRecord(raw).label;
  const text = typeof label === 'string' ? label.trim() : '';
  if (!point || text.length === 0 || text.length > MAX_LABEL) {
    throw invalidArgument(reason, `A point needs valid lat/lng and a label (max ${MAX_LABEL} chars).`);
  }
  return { ...point, label: text };
}

export function parseRouteInput(raw: unknown): RouteInput {
  const input = asRecord(raw);
  const name = requiredText(input.name, MAX_NAME, 'invalid-route-name', `Route name is required (max ${MAX_NAME} chars).`);

  if (typeof input.cityId !== 'string' || !CITY_ID_PATTERN.test(input.cityId)) {
    throw invalidArgument('invalid-city-id', 'A valid city id is required.');
  }
  const description =
    optionalText(input.description, MAX_DESCRIPTION, 'invalid-route-description', `Description must be text (max ${MAX_DESCRIPTION} chars).`) ?? '';
  const start = parseRoutePoint(input.start, 'invalid-route-start');
  const end = parseRoutePoint(input.end, 'invalid-route-end');

  const { distanceKm, elevationGainM } = input;
  if (!isFiniteNumber(distanceKm) || distanceKm <= 0 || distanceKm > MAX_DISTANCE_KM) {
    throw invalidArgument('invalid-distance', `Distance must be greater than 0 and at most ${MAX_DISTANCE_KM} km.`);
  }
  if (!isFiniteNumber(elevationGainM) || elevationGainM < 0 || elevationGainM > MAX_ELEVATION_M) {
    throw invalidArgument('invalid-elevation-gain', `Elevation gain must be between 0 and ${MAX_ELEVATION_M} m.`);
  }
  if (!oneOf(SURFACES, input.surface)) throw invalidArgument('invalid-surface', 'Unknown surface.');
  if (!oneOf(DIFFICULTIES, input.difficulty)) throw invalidArgument('invalid-difficulty', 'Unknown difficulty.');

  const active = input.active === undefined ? true : input.active;
  if (typeof active !== 'boolean') throw invalidArgument('invalid-active', 'active must be a boolean.');

  return {
    name,
    cityId: input.cityId,
    description,
    start,
    end,
    distanceKm,
    elevationGainM,
    surface: input.surface,
    difficulty: input.difficulty,
    active,
  };
}

export function parseSegmentInput(raw: unknown): SegmentInput {
  const input = asRecord(raw);
  const name = requiredText(input.name, MAX_NAME, 'invalid-segment-name', `Segment name is required (max ${MAX_NAME} chars).`);

  const points = Array.isArray(input.coordinates) ? input.coordinates.map(parseLatLng) : [];
  if (points.length < MIN_POINTS || points.length > MAX_POINTS || points.some((p) => p === null)) {
    throw invalidArgument('invalid-coordinates', `A segment needs ${MIN_POINTS}-${MAX_POINTS} valid coordinates.`);
  }

  const { order } = input;
  if (order !== undefined && (!Number.isInteger(order) || (order as number) < 0)) {
    throw invalidArgument('invalid-segment-order', 'Order must be a non-negative integer.');
  }

  return { name, coordinates: points as LatLng[], order: order as number | undefined };
}

/** Optional "HH:MM" window: both bounds or none, start < end. */
function parseWindow(input: Record<string, unknown>, required: boolean): { startTime?: string; endTime?: string } {
  const { startTime, endTime } = input;
  if (!required && startTime === undefined && endTime === undefined) return {};
  if (!required && (startTime === undefined || endTime === undefined)) {
    throw invalidArgument('invalid-time-range', 'Provide both start and end time, or neither.');
  }
  const start = parseTime(startTime);
  if (start === null || start >= 24 * 60) throw invalidArgument('invalid-start-time', 'Start time must be HH:MM (00:00-23:59).');
  const end = parseTime(endTime);
  if (end === null) throw invalidArgument('invalid-end-time', 'End time must be HH:MM (00:00-24:00).');
  if (start >= end) throw invalidArgument('invalid-time-range', 'Start time must be before end time (same day).');
  return { startTime: startTime as string, endTime: endTime as string };
}

export function parseTimeSlotInput(raw: unknown): TimeSlotInput {
  const input = asRecord(raw);
  const label = optionalText(input.label, MAX_SLOT_LABEL, 'invalid-slot-label', `Label must be text (max ${MAX_SLOT_LABEL} chars).`);
  const { startTime, endTime } = parseWindow(input, true) as { startTime: string; endTime: string };

  const { validFrom, validTo } = input;
  if (validFrom !== undefined && !isIsoDate(validFrom)) throw invalidArgument('invalid-valid-from', 'validFrom must be YYYY-MM-DD.');
  if (validTo !== undefined && !isIsoDate(validTo)) throw invalidArgument('invalid-valid-to', 'validTo must be YYYY-MM-DD.');
  if (validFrom !== undefined && validTo !== undefined && validFrom > validTo) {
    throw invalidArgument('invalid-date-range', 'validFrom must not be after validTo.');
  }

  const slot: TimeSlotInput = { startTime, endTime };
  if (label) slot.label = label;
  if (validFrom !== undefined) slot.validFrom = validFrom;
  if (validTo !== undefined) slot.validTo = validTo;
  return slot;
}

export function parseRiskFactorInput(raw: unknown): RiskFactorInput {
  const input = asRecord(raw);
  if (!oneOf(RISK_FACTOR_TYPES, input.type)) throw invalidArgument('invalid-factor-type', 'Unknown risk factor type.');
  if (!oneOf(SEVERITIES, input.severity)) throw invalidArgument('invalid-severity', 'Severity must be low, medium or high.');
  const description = requiredText(
    input.description,
    MAX_FACTOR_DESCRIPTION,
    'invalid-factor-description',
    `Description is required (max ${MAX_FACTOR_DESCRIPTION} chars).`,
  );
  return { type: input.type, severity: input.severity, description, ...parseWindow(input, false) };
}
