/**
 * RF-05 (routes and segments) and RF-07-1..11 (time slots, risk factors and
 * safety index). Pure apart from the injected dependencies: every mutation
 * that can change the index returns one write plan that also rewrites the
 * computed `safety` of every segment and of the route, and the adapter
 * applies it atomically (`mutateRoute` runs inside a Firestore transaction).
 */
import { DomainError } from '../shared/errors';
import { pathLengthM } from './domain/geo';
import {
  asRecord,
  parseDocId,
  parseRiskFactorInput,
  parseRouteInput,
  parseSegmentInput,
  parseTimeSlotInput,
  type LatLng,
  type RiskFactorInput,
  type TimeSlotInput,
} from './domain/inputs';
import { insertAt, moveTo, orderedIds, orderUpdates, removeId } from './domain/reorder';
import { computeRouteSafety, computeSegmentSafety } from './domain/safety';
import { timeWindowsOverlap, toWindow } from './domain/time';

/** Bounds that keep each write plan well under the 500-writes limit. */
export const MAX_SEGMENTS = 50;
export const MAX_TIME_SLOTS = 12;
export const MAX_FACTORS_PER_SEGMENT = 20;

export interface SegmentRecord {
  id: string;
  name: string;
  order: number;
  coordinates: LatLng[];
  lengthM: number;
}

export interface TimeSlotRecord extends TimeSlotInput {
  id: string;
}

export interface RiskFactorRecord extends RiskFactorInput {
  id: string;
}

/** Everything the safety index depends on for one route. */
export interface RouteState {
  segments: SegmentRecord[];
  slots: TimeSlotRecord[];
  /** Risk factors keyed by segment id. */
  factors: Record<string, RiskFactorRecord[]>;
}

export type WriteOp =
  | { op: 'set' | 'update'; path: string; data: Record<string, unknown> }
  | { op: 'delete'; path: string };

/** Planner run by `mutateRoute`; may run more than once (transaction retries). */
type RoutePlan = (state: RouteState | null) => WriteOp[];

export interface RoutesDeps {
  /** `cities/{id}` exists and is a city or a zone. */
  cityExists(cityId: string): Promise<boolean>;
  newId(): string;
  /** Server timestamp sentinel. */
  timestamp(): unknown;
  /** Field-delete sentinel for `update` writes. */
  deleteField(): unknown;
  commit(ops: WriteOp[]): Promise<void>;
  /** Reads the route state (null if the route is missing), plans and writes atomically. */
  mutateRoute(routeId: string, plan: RoutePlan): Promise<void>;
  routeExists(routeId: string): Promise<boolean>;
  /** Deletes the route doc and all its subcollections. */
  deleteRouteTree(routeId: string): Promise<void>;
}

/** Firestore paths; `routes` matches COLLECTIONS.routes in config.ts. */
const routePaths = {
  route: (routeId: string) => `routes/${routeId}`,
  segment: (routeId: string, segmentId: string) => `routes/${routeId}/segments/${segmentId}`,
  timeSlot: (routeId: string, slotId: string) => `routes/${routeId}/timeSlots/${slotId}`,
  riskFactor: (routeId: string, segmentId: string, factorId: string) =>
    `routes/${routeId}/segments/${segmentId}/riskFactors/${factorId}`,
};

type SegmentWrite = { op: 'set' | 'update'; data: Record<string, unknown> };

const notFound = (reason: string, message: string) => new DomainError('not-found', reason, message);
const precondition = (reason: string, message: string) => new DomainError('failed-precondition', reason, message);

function requireState(state: RouteState | null, routeId: string): RouteState {
  if (!state) throw notFound('route-not-found', `Route "${routeId}" does not exist.`);
  return state;
}

function requireSegment(state: RouteState, segmentId: string): SegmentRecord {
  const segment = state.segments.find((s) => s.id === segmentId);
  if (!segment) throw notFound('segment-not-found', `Segment "${segmentId}" does not exist.`);
  return segment;
}

async function requireCity(deps: RoutesDeps, cityId: string): Promise<void> {
  if (!(await deps.cityExists(cityId))) {
    throw notFound('city-not-found', `City or zone "${cityId}" does not exist.`);
  }
}

/**
 * Applies the id order to the segments: changed orders are merged into
 * `writes` and the returned records carry the new contiguous order.
 */
function applyOrder(segments: SegmentRecord[], ids: string[], writes: Map<string, SegmentWrite>): SegmentRecord[] {
  for (const [id, order] of Object.entries(orderUpdates(segments, ids))) {
    const write = writes.get(id) ?? { op: 'update', data: {} };
    write.data.order = order;
    writes.set(id, write);
  }
  const byId = new Map(segments.map((s) => [s.id, s]));
  return ids.map((id, order) => ({ ...(byId.get(id) as SegmentRecord), order }));
}

/**
 * `writes` followed by the recalculated safety of every segment (merged
 * into its pending write) and of the route (RF-07-11).
 */
function withRecalc(
  routeId: string,
  state: RouteState,
  deps: RoutesDeps,
  writes: WriteOp[],
  segmentWrites: Map<string, SegmentWrite> = new Map(),
): WriteOp[] {
  const ts = deps.timestamp();
  const segments = state.segments.map((s) => ({
    id: s.id,
    name: s.name,
    order: s.order,
    safety: computeSegmentSafety(state.slots, state.factors[s.id] ?? []),
  }));
  const ops = [...writes];
  for (const segment of segments) {
    const write = segmentWrites.get(segment.id) ?? { op: 'update', data: {} };
    ops.push({ op: write.op, path: routePaths.segment(routeId, segment.id), data: { ...write.data, safety: segment.safety } });
  }
  ops.push({
    op: 'update',
    path: routePaths.route(routeId),
    data: {
      safety: computeRouteSafety(state.slots, segments),
      safetyUpdatedAt: ts,
      segmentCount: segments.length,
      updatedAt: ts,
    },
  });
  return ops;
}

// ---------- Routes ----------

export async function createRoute(raw: unknown, deps: RoutesDeps): Promise<{ id: string }> {
  const input = parseRouteInput(raw);
  await requireCity(deps, input.cityId);
  const id = deps.newId();
  const ts = deps.timestamp();
  await deps.commit([
    {
      op: 'set',
      path: routePaths.route(id),
      data: { ...input, segmentCount: 0, safety: {}, safetyUpdatedAt: ts, createdAt: ts, updatedAt: ts },
    },
  ]);
  return { id };
}

export async function updateRoute(raw: unknown, deps: RoutesDeps): Promise<void> {
  const id = parseDocId(asRecord(raw).id, 'invalid-route-id');
  const input = parseRouteInput(raw);
  await requireCity(deps, input.cityId);
  await deps.mutateRoute(id, (state) => {
    requireState(state, id);
    return [{ op: 'update', path: routePaths.route(id), data: { ...input, updatedAt: deps.timestamp() } }];
  });
}

/** Cascades to segments, risk factors and time slots. */
export async function deleteRoute(raw: unknown, deps: RoutesDeps): Promise<void> {
  const id = parseDocId(asRecord(raw).id, 'invalid-route-id');
  if (!(await deps.routeExists(id))) throw notFound('route-not-found', `Route "${id}" does not exist.`);
  await deps.deleteRouteTree(id);
}

// ---------- Segments ----------

export async function createSegment(raw: unknown, deps: RoutesDeps): Promise<{ id: string }> {
  const routeId = parseDocId(asRecord(raw).routeId, 'invalid-route-id');
  const input = parseSegmentInput(raw);
  const id = deps.newId();
  await deps.mutateRoute(routeId, (current) => {
    const state = requireState(current, routeId);
    if (state.segments.length >= MAX_SEGMENTS) {
      throw precondition('too-many-segments', `A route can have at most ${MAX_SEGMENTS} segments.`);
    }
    const ts = deps.timestamp();
    const lengthM = pathLengthM(input.coordinates);
    const writes = new Map<string, SegmentWrite>([
      [id, { op: 'set', data: { name: input.name, coordinates: input.coordinates, lengthM, createdAt: ts, updatedAt: ts } }],
    ]);
    const record: SegmentRecord = { id, name: input.name, order: -1, coordinates: input.coordinates, lengthM };
    const ids = insertAt(orderedIds(state.segments), id, input.order);
    const segments = applyOrder([...state.segments, record], ids, writes);
    return withRecalc(routeId, { ...state, segments }, deps, [], writes);
  });
  return { id };
}

export async function updateSegment(raw: unknown, deps: RoutesDeps): Promise<void> {
  const routeId = parseDocId(asRecord(raw).routeId, 'invalid-route-id');
  const segmentId = parseDocId(asRecord(raw).segmentId, 'invalid-segment-id');
  const input = parseSegmentInput(raw);
  await deps.mutateRoute(routeId, (current) => {
    const state = requireState(current, routeId);
    const segment = requireSegment(state, segmentId);
    const lengthM = pathLengthM(input.coordinates);
    const write: SegmentWrite = {
      op: 'update',
      data: { name: input.name, coordinates: input.coordinates, lengthM, updatedAt: deps.timestamp() },
    };
    const writes = new Map([[segmentId, write]]);
    const currentIds = orderedIds(state.segments);
    const ids = input.order === undefined ? currentIds : moveTo(currentIds, segmentId, input.order);
    const updated = state.segments.map((s) => (s.id === segmentId ? { ...segment, name: input.name, coordinates: input.coordinates, lengthM } : s));
    const segments = applyOrder(updated, ids, writes);
    write.data.order = ids.indexOf(segmentId);
    return withRecalc(routeId, { ...state, segments }, deps, [], writes);
  });
}

/** Also deletes the segment's risk factors and closes the order gap. */
export async function deleteSegment(raw: unknown, deps: RoutesDeps): Promise<void> {
  const routeId = parseDocId(asRecord(raw).routeId, 'invalid-route-id');
  const segmentId = parseDocId(asRecord(raw).segmentId, 'invalid-segment-id');
  await deps.mutateRoute(routeId, (current) => {
    const state = requireState(current, routeId);
    requireSegment(state, segmentId);
    const deletes: WriteOp[] = [
      ...(state.factors[segmentId] ?? []).map((f): WriteOp => ({ op: 'delete', path: routePaths.riskFactor(routeId, segmentId, f.id) })),
      { op: 'delete', path: routePaths.segment(routeId, segmentId) },
    ];
    const writes = new Map<string, SegmentWrite>();
    const remaining = state.segments.filter((s) => s.id !== segmentId);
    const segments = applyOrder(remaining, removeId(orderedIds(state.segments), segmentId), writes);
    const { [segmentId]: _removed, ...factors } = state.factors;
    return withRecalc(routeId, { ...state, segments, factors }, deps, deletes, writes);
  });
}

// ---------- Time slots ----------

function assertNoOverlap(slots: readonly TimeSlotRecord[], candidate: TimeSlotInput, ignoreId?: string): void {
  const window = toWindow(candidate.startTime, candidate.endTime);
  const clash = slots.find((s) => s.id !== ignoreId && timeWindowsOverlap(window, toWindow(s.startTime, s.endTime)));
  if (clash) {
    throw precondition('time-slot-overlap', `Overlaps the time slot ${clash.label ?? `${clash.startTime}-${clash.endTime}`}.`);
  }
}

export async function createTimeSlot(raw: unknown, deps: RoutesDeps): Promise<{ id: string }> {
  const routeId = parseDocId(asRecord(raw).routeId, 'invalid-route-id');
  const input = parseTimeSlotInput(raw);
  const id = deps.newId();
  await deps.mutateRoute(routeId, (current) => {
    const state = requireState(current, routeId);
    if (state.slots.length >= MAX_TIME_SLOTS) {
      throw precondition('too-many-time-slots', `A route can have at most ${MAX_TIME_SLOTS} time slots.`);
    }
    assertNoOverlap(state.slots, input);
    const ts = deps.timestamp();
    const write: WriteOp = { op: 'set', path: routePaths.timeSlot(routeId, id), data: { ...input, createdAt: ts, updatedAt: ts } };
    return withRecalc(routeId, { ...state, slots: [...state.slots, { id, ...input }] }, deps, [write]);
  });
  return { id };
}

export async function updateTimeSlot(raw: unknown, deps: RoutesDeps): Promise<void> {
  const routeId = parseDocId(asRecord(raw).routeId, 'invalid-route-id');
  const slotId = parseDocId(asRecord(raw).slotId, 'invalid-time-slot-id');
  const input = parseTimeSlotInput(raw);
  await deps.mutateRoute(routeId, (current) => {
    const state = requireState(current, routeId);
    if (!state.slots.some((s) => s.id === slotId)) throw notFound('time-slot-not-found', `Time slot "${slotId}" does not exist.`);
    assertNoOverlap(state.slots, input, slotId);
    const write: WriteOp = {
      op: 'update',
      path: routePaths.timeSlot(routeId, slotId),
      data: {
        startTime: input.startTime,
        endTime: input.endTime,
        label: input.label ?? deps.deleteField(),
        validFrom: input.validFrom ?? deps.deleteField(),
        validTo: input.validTo ?? deps.deleteField(),
        updatedAt: deps.timestamp(),
      },
    };
    const slots = state.slots.map((s) => (s.id === slotId ? { id: slotId, ...input } : s));
    return withRecalc(routeId, { ...state, slots }, deps, [write]);
  });
}

export async function deleteTimeSlot(raw: unknown, deps: RoutesDeps): Promise<void> {
  const routeId = parseDocId(asRecord(raw).routeId, 'invalid-route-id');
  const slotId = parseDocId(asRecord(raw).slotId, 'invalid-time-slot-id');
  await deps.mutateRoute(routeId, (current) => {
    const state = requireState(current, routeId);
    if (!state.slots.some((s) => s.id === slotId)) throw notFound('time-slot-not-found', `Time slot "${slotId}" does not exist.`);
    const slots = state.slots.filter((s) => s.id !== slotId);
    return withRecalc(routeId, { ...state, slots }, deps, [{ op: 'delete', path: routePaths.timeSlot(routeId, slotId) }]);
  });
}

// ---------- Risk factors ----------

function requireFactor(state: RouteState, segmentId: string, factorId: string): void {
  if (!(state.factors[segmentId] ?? []).some((f) => f.id === factorId)) {
    throw notFound('risk-factor-not-found', `Risk factor "${factorId}" does not exist.`);
  }
}

function factorIds(raw: unknown, withFactor: boolean) {
  const input = asRecord(raw);
  return {
    routeId: parseDocId(input.routeId, 'invalid-route-id'),
    segmentId: parseDocId(input.segmentId, 'invalid-segment-id'),
    factorId: withFactor ? parseDocId(input.factorId, 'invalid-risk-factor-id') : '',
  };
}

export async function createRiskFactor(raw: unknown, deps: RoutesDeps): Promise<{ id: string }> {
  const { routeId, segmentId } = factorIds(raw, false);
  const input = parseRiskFactorInput(raw);
  const id = deps.newId();
  await deps.mutateRoute(routeId, (current) => {
    const state = requireState(current, routeId);
    requireSegment(state, segmentId);
    const existing = state.factors[segmentId] ?? [];
    if (existing.length >= MAX_FACTORS_PER_SEGMENT) {
      throw precondition('too-many-risk-factors', `A segment can have at most ${MAX_FACTORS_PER_SEGMENT} risk factors.`);
    }
    const ts = deps.timestamp();
    const write: WriteOp = { op: 'set', path: routePaths.riskFactor(routeId, segmentId, id), data: { ...input, createdAt: ts, updatedAt: ts } };
    const factors = { ...state.factors, [segmentId]: [...existing, { id, ...input }] };
    return withRecalc(routeId, { ...state, factors }, deps, [write]);
  });
  return { id };
}

export async function updateRiskFactor(raw: unknown, deps: RoutesDeps): Promise<void> {
  const { routeId, segmentId, factorId } = factorIds(raw, true);
  const input = parseRiskFactorInput(raw);
  await deps.mutateRoute(routeId, (current) => {
    const state = requireState(current, routeId);
    requireSegment(state, segmentId);
    requireFactor(state, segmentId, factorId);
    const write: WriteOp = {
      op: 'update',
      path: routePaths.riskFactor(routeId, segmentId, factorId),
      data: {
        type: input.type,
        severity: input.severity,
        description: input.description,
        startTime: input.startTime ?? deps.deleteField(),
        endTime: input.endTime ?? deps.deleteField(),
        updatedAt: deps.timestamp(),
      },
    };
    const factors = {
      ...state.factors,
      [segmentId]: (state.factors[segmentId] ?? []).map((f) => (f.id === factorId ? { id: factorId, ...input } : f)),
    };
    return withRecalc(routeId, { ...state, factors }, deps, [write]);
  });
}

export async function deleteRiskFactor(raw: unknown, deps: RoutesDeps): Promise<void> {
  const { routeId, segmentId, factorId } = factorIds(raw, true);
  await deps.mutateRoute(routeId, (current) => {
    const state = requireState(current, routeId);
    requireSegment(state, segmentId);
    requireFactor(state, segmentId, factorId);
    const factors = { ...state.factors, [segmentId]: (state.factors[segmentId] ?? []).filter((f) => f.id !== factorId) };
    return withRecalc(routeId, { ...state, factors }, deps, [
      { op: 'delete', path: routePaths.riskFactor(routeId, segmentId, factorId) },
    ]);
  });
}
