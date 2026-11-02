import { describe, expect, it, vi } from 'vitest';

import { DomainError } from '../shared/errors';
import type { LatLng } from './domain/inputs';
import * as service from './routeService';
import type { RouteState, RoutesDeps, WriteOp } from './routeService';

const TS = 'SERVER_TS';
const DEL = 'DELETE_FIELD';
const coords: LatLng[] = [
  { lat: -3.97, lng: -79.2 },
  { lat: -3.971, lng: -79.2 },
];

function emptyState(): RouteState {
  return { segments: [], slots: [], factors: {} };
}

/** Route r1 with segments a (0), b (1), c (2), a night slot and one factor on b. */
function sampleState(): RouteState {
  return {
    segments: [
      { id: 'a', name: 'Gate', order: 0, coordinates: coords, lengthM: 111 },
      { id: 'b', name: 'Park', order: 1, coordinates: coords, lengthM: 111 },
      { id: 'c', name: 'Lake', order: 2, coordinates: coords, lengthM: 111 },
    ],
    slots: [
      { id: 'morning', startTime: '06:00', endTime: '09:00' },
      { id: 'night', label: 'Night', startTime: '19:00', endTime: '23:00' },
    ],
    factors: {
      b: [{ id: 'f1', type: 'poor_lighting', severity: 'high', description: 'Dark', startTime: '18:00', endTime: '24:00' }],
    },
  };
}

function fakeDeps(state: RouteState | null = sampleState(), overrides: Partial<RoutesDeps> = {}) {
  const committed: WriteOp[] = [];
  let next = 0;
  const deps: RoutesDeps = {
    cityExists: vi.fn(async () => true),
    newId: () => `new-${++next}`,
    timestamp: () => TS,
    deleteField: () => DEL,
    commit: vi.fn(async (ops: WriteOp[]) => {
      committed.push(...ops);
    }),
    mutateRoute: vi.fn(async (_routeId: string, plan: (s: RouteState | null) => WriteOp[]) => {
      committed.push(...plan(state));
    }),
    routeExists: vi.fn(async () => state !== null),
    deleteRouteTree: vi.fn(async () => undefined),
    ...overrides,
  };
  return { deps, committed };
}

const opAt = (ops: WriteOp[], path: string) => ops.find((op) => op.path === path);
const dataAt = (ops: WriteOp[], path: string) => {
  const op = opAt(ops, path);
  if (!op || op.op === 'delete') throw new Error(`No write at ${path}`);
  return op.data;
};

async function expectReason(promise: Promise<unknown>, reason: string): Promise<void> {
  await expect(promise).rejects.toBeInstanceOf(DomainError);
  await expect(promise).rejects.toMatchObject({ reason });
}

const routeInput = (overrides: Record<string, unknown> = {}) => ({
  name: 'Jipiro loop',
  cityId: 'loja',
  start: { lat: -3.97, lng: -79.2, label: 'Gate' },
  end: { lat: -3.98, lng: -79.21, label: 'Lake' },
  distanceKm: 5,
  elevationGainM: 30,
  surface: 'asphalt',
  difficulty: 'beginner',
  ...overrides,
});

describe('createRoute', () => {
  it('creates an active route without segments or safety yet', async () => {
    const { deps, committed } = fakeDeps(null);
    await expect(service.createRoute(routeInput(), deps)).resolves.toEqual({ id: 'new-1' });
    expect(deps.cityExists).toHaveBeenCalledWith('loja');
    expect(committed).toEqual([
      {
        op: 'set',
        path: 'routes/new-1',
        data: expect.objectContaining({
          name: 'Jipiro loop',
          cityId: 'loja',
          description: '',
          active: true,
          segmentCount: 0,
          safety: {},
          safetyUpdatedAt: TS,
          createdAt: TS,
          updatedAt: TS,
        }),
      },
    ]);
  });

  it('rejects an unknown city or zone', async () => {
    const { deps } = fakeDeps(null, { cityExists: vi.fn(async () => false) });
    await expectReason(service.createRoute(routeInput(), deps), 'city-not-found');
    expect(deps.commit).not.toHaveBeenCalled();
  });

  it('validates the payload before touching Firestore', async () => {
    const { deps } = fakeDeps(null);
    await expectReason(service.createRoute(routeInput({ surface: 'ice' }), deps), 'invalid-surface');
    expect(deps.cityExists).not.toHaveBeenCalled();
  });
});

describe('updateRoute', () => {
  it('updates the editable fields', async () => {
    const { deps, committed } = fakeDeps();
    await service.updateRoute({ id: 'r1', ...routeInput({ active: false }) }, deps);
    expect(deps.mutateRoute).toHaveBeenCalledWith('r1', expect.any(Function));
    const data = dataAt(committed, 'routes/r1');
    expect(data).toMatchObject({ name: 'Jipiro loop', active: false, updatedAt: TS });
    expect(data).not.toHaveProperty('createdAt');
    expect(data).not.toHaveProperty('safety');
  });

  it('rejects a missing route and malformed ids', async () => {
    await expectReason(service.updateRoute({ id: 'r1', ...routeInput() }, fakeDeps(null).deps), 'route-not-found');
    await expectReason(service.updateRoute({ id: 'a/b', ...routeInput() }, fakeDeps().deps), 'invalid-route-id');
  });

  it('rejects an unknown city', async () => {
    const { deps } = fakeDeps(sampleState(), { cityExists: vi.fn(async () => false) });
    await expectReason(service.updateRoute({ id: 'r1', ...routeInput() }, deps), 'city-not-found');
  });
});

describe('deleteRoute', () => {
  it('deletes the route with all its subcollections', async () => {
    const { deps } = fakeDeps();
    await service.deleteRoute({ id: 'r1' }, deps);
    expect(deps.deleteRouteTree).toHaveBeenCalledWith('r1');
  });

  it('reports a missing route', async () => {
    const { deps } = fakeDeps(null);
    await expectReason(service.deleteRoute({ id: 'r1' }, deps), 'route-not-found');
    expect(deps.deleteRouteTree).not.toHaveBeenCalled();
  });
});

describe('createSegment', () => {
  it('appends the segment, computes its length and safety, and updates the route', async () => {
    const { deps, committed } = fakeDeps();
    await expect(service.createSegment({ routeId: 'r1', name: 'Bridge', coordinates: coords }, deps)).resolves.toEqual({ id: 'new-1' });

    const set = opAt(committed, 'routes/r1/segments/new-1');
    expect(set).toMatchObject({ op: 'set' });
    expect(dataAt(committed, 'routes/r1/segments/new-1')).toMatchObject({
      name: 'Bridge',
      order: 3,
      coordinates: coords,
      lengthM: 111,
      safety: {
        morning: { level: 'high', score: 100, factors: [] },
        night: { level: 'high', score: 100, factors: [] },
      },
      createdAt: TS,
      updatedAt: TS,
    });
    const route = dataAt(committed, 'routes/r1');
    expect(route).toMatchObject({ segmentCount: 4, safetyUpdatedAt: TS, updatedAt: TS });
    expect((route.safety as Record<string, { worstSegmentId: string; score: number }>).night).toMatchObject({
      worstSegmentId: 'b',
      score: 65,
    });
  });

  it('inserts at a given order and shifts the following segments', async () => {
    const { deps, committed } = fakeDeps();
    await service.createSegment({ routeId: 'r1', name: 'Bridge', coordinates: coords, order: 1 }, deps);
    expect(dataAt(committed, 'routes/r1/segments/new-1').order).toBe(1);
    expect(dataAt(committed, 'routes/r1/segments/a')).not.toHaveProperty('order');
    expect(dataAt(committed, 'routes/r1/segments/b').order).toBe(2);
    expect(dataAt(committed, 'routes/r1/segments/c').order).toBe(3);
  });

  it('rejects a missing route', async () => {
    await expectReason(service.createSegment({ routeId: 'r1', name: 'B', coordinates: coords }, fakeDeps(null).deps), 'route-not-found');
  });

  it('caps the number of segments per route', async () => {
    const state = emptyState();
    state.segments = Array.from({ length: service.MAX_SEGMENTS }, (_, i) => ({
      id: `s${i}`,
      name: `S${i}`,
      order: i,
      coordinates: coords,
      lengthM: 1,
    }));
    await expectReason(service.createSegment({ routeId: 'r1', name: 'B', coordinates: coords }, fakeDeps(state).deps), 'too-many-segments');
  });
});

describe('updateSegment', () => {
  it('updates fields and moves the segment, reordering the others', async () => {
    const { deps, committed } = fakeDeps();
    await service.updateSegment({ routeId: 'r1', segmentId: 'c', name: 'Lake shore', coordinates: coords, order: 0 }, deps);
    expect(dataAt(committed, 'routes/r1/segments/c')).toMatchObject({ name: 'Lake shore', order: 0, lengthM: 111, updatedAt: TS });
    expect(dataAt(committed, 'routes/r1/segments/a').order).toBe(1);
    expect(dataAt(committed, 'routes/r1/segments/b').order).toBe(2);
  });

  it('keeps the order when none is given', async () => {
    const { deps, committed } = fakeDeps();
    await service.updateSegment({ routeId: 'r1', segmentId: 'b', name: 'Park', coordinates: coords }, deps);
    expect(dataAt(committed, 'routes/r1/segments/b').order).toBe(1);
    expect(dataAt(committed, 'routes/r1/segments/a')).not.toHaveProperty('order');
  });

  it('reports a missing segment', async () => {
    await expectReason(
      service.updateSegment({ routeId: 'r1', segmentId: 'zz', name: 'X', coordinates: coords }, fakeDeps().deps),
      'segment-not-found',
    );
  });
});

describe('deleteSegment', () => {
  it('deletes the segment and its risk factors, closes the order gap and recalculates', async () => {
    const { deps, committed } = fakeDeps();
    await service.deleteSegment({ routeId: 'r1', segmentId: 'b' }, deps);
    expect(opAt(committed, 'routes/r1/segments/b')).toEqual({ op: 'delete', path: 'routes/r1/segments/b' });
    expect(opAt(committed, 'routes/r1/segments/b/riskFactors/f1')).toEqual({ op: 'delete', path: 'routes/r1/segments/b/riskFactors/f1' });
    expect(dataAt(committed, 'routes/r1/segments/c').order).toBe(1);
    const route = dataAt(committed, 'routes/r1');
    expect(route.segmentCount).toBe(2);
    expect((route.safety as Record<string, { score: number }>).night.score).toBe(100);
  });

  it('leaves the route without levels when the last segment goes', async () => {
    const state = emptyState();
    state.segments = [{ id: 'a', name: 'A', order: 0, coordinates: coords, lengthM: 1 }];
    state.slots = [{ id: 'morning', startTime: '06:00', endTime: '09:00' }];
    const { deps, committed } = fakeDeps(state);
    await service.deleteSegment({ routeId: 'r1', segmentId: 'a' }, deps);
    expect(dataAt(committed, 'routes/r1')).toMatchObject({ segmentCount: 0, safety: {} });
  });

  it('reports a missing segment', async () => {
    await expectReason(service.deleteSegment({ routeId: 'r1', segmentId: 'zz' }, fakeDeps().deps), 'segment-not-found');
  });
});

describe('time slots', () => {
  it('creates a slot and adds it to every segment and the route', async () => {
    const { deps, committed } = fakeDeps();
    await expect(
      service.createTimeSlot({ routeId: 'r1', label: 'Noon', startTime: '12:00', endTime: '14:00', validFrom: '2026-11-01' }, deps),
    ).resolves.toEqual({ id: 'new-1' });
    expect(dataAt(committed, 'routes/r1/timeSlots/new-1')).toEqual({
      label: 'Noon',
      startTime: '12:00',
      endTime: '14:00',
      validFrom: '2026-11-01',
      createdAt: TS,
      updatedAt: TS,
    });
    for (const id of ['a', 'b', 'c']) {
      expect(dataAt(committed, `routes/r1/segments/${id}`).safety).toHaveProperty('new-1');
    }
    expect((dataAt(committed, 'routes/r1').safety as Record<string, unknown>)['new-1']).toMatchObject({
      level: 'high',
      startTime: '12:00',
      endTime: '14:00',
    });
  });

  it('rejects a slot overlapping another slot of the route', async () => {
    const { deps, committed } = fakeDeps();
    await expectReason(service.createTimeSlot({ routeId: 'r1', startTime: '08:00', endTime: '10:00' }, deps), 'time-slot-overlap');
    expect(committed).toEqual([]);
  });

  it('allows touching slots', async () => {
    const { deps } = fakeDeps();
    await expect(service.createTimeSlot({ routeId: 'r1', startTime: '09:00', endTime: '19:00' }, deps)).resolves.toEqual({ id: 'new-1' });
  });

  it('updates a slot, ignoring overlap with itself, and recalculates', async () => {
    const { deps, committed } = fakeDeps();
    await service.updateTimeSlot({ routeId: 'r1', slotId: 'morning', startTime: '05:00', endTime: '20:00' }, deps).catch(() => undefined);
    // 05:00-20:00 overlaps the night slot.
    expect(committed).toEqual([]);

    await service.updateTimeSlot({ routeId: 'r1', slotId: 'night', startTime: '17:00', endTime: '24:00' }, deps);
    const slot = dataAt(committed, 'routes/r1/timeSlots/night');
    expect(slot).toEqual({ startTime: '17:00', endTime: '24:00', label: DEL, validFrom: DEL, validTo: DEL, updatedAt: TS });
    expect(opAt(committed, 'routes/r1/timeSlots/night')).toMatchObject({ op: 'update' });
    expect((dataAt(committed, 'routes/r1').safety as Record<string, { startTime: string }>).night.startTime).toBe('17:00');
  });

  it('rejects an overlapping update and a missing slot', async () => {
    await expectReason(
      service.updateTimeSlot({ routeId: 'r1', slotId: 'morning', startTime: '05:00', endTime: '20:00' }, fakeDeps().deps),
      'time-slot-overlap',
    );
    await expectReason(
      service.updateTimeSlot({ routeId: 'r1', slotId: 'zz', startTime: '01:00', endTime: '02:00' }, fakeDeps().deps),
      'time-slot-not-found',
    );
  });

  it('deletes a slot and drops it from the computed safety', async () => {
    const { deps, committed } = fakeDeps();
    await service.deleteTimeSlot({ routeId: 'r1', slotId: 'night' }, deps);
    expect(opAt(committed, 'routes/r1/timeSlots/night')).toEqual({ op: 'delete', path: 'routes/r1/timeSlots/night' });
    expect(Object.keys(dataAt(committed, 'routes/r1/segments/b').safety as object)).toEqual(['morning']);
    expect(Object.keys(dataAt(committed, 'routes/r1').safety as object)).toEqual(['morning']);
  });

  it('caps the number of slots per route', async () => {
    const state = emptyState();
    state.slots = Array.from({ length: service.MAX_TIME_SLOTS }, (_, i) => ({
      id: `t${i}`,
      startTime: `${String(i).padStart(2, '0')}:00`,
      endTime: `${String(i).padStart(2, '0')}:30`,
    }));
    await expectReason(
      service.createTimeSlot({ routeId: 'r1', startTime: '23:00', endTime: '23:30' }, fakeDeps(state).deps),
      'too-many-time-slots',
    );
  });
});

describe('risk factors', () => {
  it('creates a factor and recalculates the segment and route', async () => {
    const { deps, committed } = fakeDeps();
    await expect(
      service.createRiskFactor({ routeId: 'r1', segmentId: 'a', type: 'traffic', severity: 'medium', description: 'Busy road' }, deps),
    ).resolves.toEqual({ id: 'new-1' });
    expect(dataAt(committed, 'routes/r1/segments/a/riskFactors/new-1')).toEqual({
      type: 'traffic',
      severity: 'medium',
      description: 'Busy road',
      createdAt: TS,
      updatedAt: TS,
    });
    const segmentSafety = dataAt(committed, 'routes/r1/segments/a').safety as Record<string, { score: number }>;
    expect(segmentSafety.morning.score).toBe(80);
    const route = dataAt(committed, 'routes/r1').safety as Record<string, { score: number; worstSegmentId: string; factors: unknown[] }>;
    expect(route.morning).toMatchObject({ score: 80, worstSegmentId: 'a' });
    expect(route.night).toMatchObject({ score: 65, worstSegmentId: 'b' });
    expect(route.night.factors).toHaveLength(2);
  });

  it('updates a factor', async () => {
    const { deps, committed } = fakeDeps();
    await service.updateRiskFactor(
      { routeId: 'r1', segmentId: 'b', factorId: 'f1', type: 'poor_lighting', severity: 'low', description: 'Dim' },
      deps,
    );
    expect(dataAt(committed, 'routes/r1/segments/b/riskFactors/f1')).toEqual({
      type: 'poor_lighting',
      severity: 'low',
      description: 'Dim',
      startTime: DEL,
      endTime: DEL,
      updatedAt: TS,
    });
    expect(opAt(committed, 'routes/r1/segments/b/riskFactors/f1')?.op).toBe('update');
    expect((dataAt(committed, 'routes/r1').safety as Record<string, { score: number }>).morning.score).toBe(90);
  });

  it('deletes a factor and recalculates', async () => {
    const { deps, committed } = fakeDeps();
    await service.deleteRiskFactor({ routeId: 'r1', segmentId: 'b', factorId: 'f1' }, deps);
    expect(opAt(committed, 'routes/r1/segments/b/riskFactors/f1')?.op).toBe('delete');
    expect((dataAt(committed, 'routes/r1').safety as Record<string, { score: number }>).night.score).toBe(100);
  });

  it('reports missing segments and factors', async () => {
    const payload = { routeId: 'r1', type: 'traffic', severity: 'low', description: 'x' };
    await expectReason(service.createRiskFactor({ ...payload, segmentId: 'zz' }, fakeDeps().deps), 'segment-not-found');
    await expectReason(service.updateRiskFactor({ ...payload, segmentId: 'a', factorId: 'f1' }, fakeDeps().deps), 'risk-factor-not-found');
    await expectReason(service.deleteRiskFactor({ routeId: 'r1', segmentId: 'b', factorId: 'zz' }, fakeDeps().deps), 'risk-factor-not-found');
    await expectReason(service.deleteRiskFactor({ routeId: 'r1', segmentId: 'b', factorId: 'f1' }, fakeDeps(null).deps), 'route-not-found');
  });

  it('caps the number of factors per segment', async () => {
    const state = sampleState();
    state.factors.a = Array.from({ length: service.MAX_FACTORS_PER_SEGMENT }, (_, i) => ({
      id: `f${i}`,
      type: 'other' as const,
      severity: 'low' as const,
      description: 'x',
    }));
    await expectReason(
      service.createRiskFactor({ routeId: 'r1', segmentId: 'a', type: 'traffic', severity: 'low', description: 'x' }, fakeDeps(state).deps),
      'too-many-risk-factors',
    );
  });
});
