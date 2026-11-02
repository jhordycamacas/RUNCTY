import { describe, expect, it } from 'vitest';

import { DomainError } from '../../shared/errors';
import { parseDocId, parseRiskFactorInput, parseRouteInput, parseSegmentInput, parseTimeSlotInput } from './inputs';

function expectReason(fn: () => unknown, reason: string): void {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(DomainError);
    expect(error).toMatchObject({ code: 'invalid-argument', reason });
    return;
  }
  throw new Error(`Expected DomainError ${reason}`);
}

const validRoute = (overrides: Record<string, unknown> = {}) => ({
  name: '  Parque Jipiro loop ',
  cityId: 'loja',
  description: ' Flat loop ',
  start: { lat: -3.97, lng: -79.2, label: 'Main gate' },
  end: { lat: -3.98, lng: -79.21, label: 'Lake' },
  distanceKm: 5.2,
  elevationGainM: 40,
  surface: 'asphalt',
  difficulty: 'beginner',
  active: true,
  ...overrides,
});

describe('parseDocId', () => {
  it('accepts Firestore auto ids and slugs', () => {
    expect(parseDocId('aB3_x-Z9', 'invalid-route-id')).toBe('aB3_x-Z9');
  });

  it('rejects malformed ids with the given reason', () => {
    for (const id of ['', 'a/b', 'x'.repeat(65), 42, undefined, 'a b']) {
      expectReason(() => parseDocId(id, 'invalid-route-id'), 'invalid-route-id');
    }
  });
});

describe('parseRouteInput', () => {
  it('trims and returns a valid route', () => {
    expect(parseRouteInput(validRoute())).toEqual({
      name: 'Parque Jipiro loop',
      cityId: 'loja',
      description: 'Flat loop',
      start: { lat: -3.97, lng: -79.2, label: 'Main gate' },
      end: { lat: -3.98, lng: -79.21, label: 'Lake' },
      distanceKm: 5.2,
      elevationGainM: 40,
      surface: 'asphalt',
      difficulty: 'beginner',
      active: true,
    });
  });

  it('defaults description to empty and active to true', () => {
    const { description: _d, active: _a, ...rest } = validRoute();
    expect(parseRouteInput(rest)).toMatchObject({ description: '', active: true });
  });

  it.each([
    [{ name: ' ' }, 'invalid-route-name'],
    [{ name: 'x'.repeat(81) }, 'invalid-route-name'],
    [{ cityId: 'Loja' }, 'invalid-city-id'],
    [{ description: 5 }, 'invalid-route-description'],
    [{ start: { lat: 91, lng: 0, label: 'x' } }, 'invalid-route-start'],
    [{ start: { lat: 0, lng: 0, label: '' } }, 'invalid-route-start'],
    [{ end: null }, 'invalid-route-end'],
    [{ end: { lat: 0, lng: 181, label: 'x' } }, 'invalid-route-end'],
    [{ distanceKm: 0 }, 'invalid-distance'],
    [{ distanceKm: Number.NaN }, 'invalid-distance'],
    [{ distanceKm: 501 }, 'invalid-distance'],
    [{ elevationGainM: -1 }, 'invalid-elevation-gain'],
    [{ surface: 'gravel' }, 'invalid-surface'],
    [{ difficulty: 'expert' }, 'invalid-difficulty'],
    [{ active: 'yes' }, 'invalid-active'],
  ])('rejects %o with %s', (override, reason) => {
    expectReason(() => parseRouteInput(validRoute(override)), reason);
  });

  it('rejects a non-object payload', () => {
    expectReason(() => parseRouteInput(null), 'invalid-route-name');
  });
});

describe('parseSegmentInput', () => {
  const coordinates = [
    { lat: -3.97, lng: -79.2 },
    { lat: -3.971, lng: -79.201 },
  ];

  it('returns name, coordinates and the optional order', () => {
    expect(parseSegmentInput({ name: ' Bridge ', coordinates, order: 2 })).toEqual({ name: 'Bridge', coordinates, order: 2 });
    expect(parseSegmentInput({ name: 'Bridge', coordinates })).toEqual({ name: 'Bridge', coordinates, order: undefined });
  });

  it('drops extra keys from coordinates', () => {
    const parsed = parseSegmentInput({ name: 'A', coordinates: [{ lat: 1, lng: 2, x: 3 }, { lat: 1, lng: 3 }] });
    expect(parsed.coordinates[0]).toEqual({ lat: 1, lng: 2 });
  });

  it.each([
    [{ name: '' }, 'invalid-segment-name'],
    [{ coordinates: [{ lat: 0, lng: 0 }] }, 'invalid-coordinates'],
    [{ coordinates: 'x' }, 'invalid-coordinates'],
    [{ coordinates: [{ lat: 0, lng: 0 }, { lat: 'a', lng: 0 }] }, 'invalid-coordinates'],
    [{ coordinates: Array.from({ length: 501 }, () => ({ lat: 0, lng: 0 })) }, 'invalid-coordinates'],
    [{ order: -1 }, 'invalid-segment-order'],
    [{ order: 1.5 }, 'invalid-segment-order'],
  ])('rejects %o with %s', (override, reason) => {
    expectReason(() => parseSegmentInput({ name: 'A', coordinates, ...override }), reason);
  });
});

describe('parseTimeSlotInput', () => {
  it('returns a valid slot with optional fields', () => {
    expect(parseTimeSlotInput({ label: ' Night ', startTime: '19:00', endTime: '24:00', validFrom: '2026-11-01', validTo: '2026-12-31' })).toEqual({
      label: 'Night',
      startTime: '19:00',
      endTime: '24:00',
      validFrom: '2026-11-01',
      validTo: '2026-12-31',
    });
    expect(parseTimeSlotInput({ startTime: '06:00', endTime: '09:00' })).toEqual({ startTime: '06:00', endTime: '09:00' });
  });

  it.each([
    [{ startTime: '6:00' }, 'invalid-start-time'],
    [{ startTime: '24:00', endTime: '24:00' }, 'invalid-start-time'],
    [{ endTime: '25:00' }, 'invalid-end-time'],
    [{ startTime: '09:00', endTime: '09:00' }, 'invalid-time-range'],
    [{ startTime: '10:00', endTime: '09:00' }, 'invalid-time-range'],
    [{ label: 'x'.repeat(41) }, 'invalid-slot-label'],
    [{ validFrom: '2026-02-30' }, 'invalid-valid-from'],
    [{ validTo: 'tomorrow' }, 'invalid-valid-to'],
    [{ validFrom: '2026-12-31', validTo: '2026-01-01' }, 'invalid-date-range'],
  ])('rejects %o with %s', (override, reason) => {
    expectReason(() => parseTimeSlotInput({ startTime: '06:00', endTime: '09:00', ...override }), reason);
  });
});

describe('parseRiskFactorInput', () => {
  it('returns a factor with or without a window', () => {
    expect(parseRiskFactorInput({ type: 'traffic', severity: 'high', description: ' Busy ', startTime: '17:00', endTime: '19:00' })).toEqual({
      type: 'traffic',
      severity: 'high',
      description: 'Busy',
      startTime: '17:00',
      endTime: '19:00',
    });
    expect(parseRiskFactorInput({ type: 'other', severity: 'low', description: 'Dogs' })).toEqual({
      type: 'other',
      severity: 'low',
      description: 'Dogs',
    });
  });

  it.each([
    [{ type: 'crime' }, 'invalid-factor-type'],
    [{ severity: 'extreme' }, 'invalid-severity'],
    [{ description: ' ' }, 'invalid-factor-description'],
    [{ description: 'x'.repeat(201) }, 'invalid-factor-description'],
    [{ startTime: '17:00' }, 'invalid-time-range'],
    [{ endTime: '17:00' }, 'invalid-time-range'],
    [{ startTime: '18:00', endTime: '17:00' }, 'invalid-time-range'],
    [{ startTime: 'x', endTime: '17:00' }, 'invalid-start-time'],
  ])('rejects %o with %s', (override, reason) => {
    expectReason(() => parseRiskFactorInput({ type: 'traffic', severity: 'low', description: 'Busy', ...override }), reason);
  });
});
