import { FieldValue, type DocumentData, type Transaction } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { onCall } from 'firebase-functions/v2/https';

import { COLLECTIONS, db } from '../config';
import { requirePermission, runDomain } from '../shared/callable';
import { RISK_FACTOR_TYPES, type LatLng, type RiskFactorType } from './domain/inputs';
import { SEVERITIES, type Severity } from './domain/safety';
import * as logic from './routeService';
import type { RiskFactorRecord, RouteState, RoutesDeps, SegmentRecord, TimeSlotRecord, WriteOp } from './routeService';

const SEGMENTS = 'segments';
const TIME_SLOTS = 'timeSlots';
const RISK_FACTORS = 'riskFactors';

const optionalString = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined);

/** Drops undefined keys so records compare like the parsed inputs. */
function compact<T extends object>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as T;
}

function toSegment(id: string, d: DocumentData): SegmentRecord {
  return {
    id,
    name: String(d.name ?? id),
    order: typeof d.order === 'number' ? d.order : Number.MAX_SAFE_INTEGER,
    coordinates: Array.isArray(d.coordinates) ? (d.coordinates as LatLng[]) : [],
    lengthM: typeof d.lengthM === 'number' ? d.lengthM : 0,
  };
}

function toTimeSlot(id: string, d: DocumentData): TimeSlotRecord {
  return compact({
    id,
    label: optionalString(d.label),
    startTime: String(d.startTime),
    endTime: String(d.endTime),
    validFrom: optionalString(d.validFrom),
    validTo: optionalString(d.validTo),
  });
}

/** Null for malformed docs (only the callables write them), so they never break the index. */
function toRiskFactor(id: string, d: DocumentData): RiskFactorRecord | null {
  if (!(RISK_FACTOR_TYPES as readonly unknown[]).includes(d.type) || !(SEVERITIES as readonly unknown[]).includes(d.severity)) {
    return null;
  }
  return compact({
    id,
    type: d.type as RiskFactorType,
    severity: d.severity as Severity,
    description: String(d.description ?? ''),
    startTime: optionalString(d.startTime),
    endTime: optionalString(d.endTime),
  });
}

function apply(tx: Transaction, op: WriteOp): void {
  const ref = db().doc(op.path);
  if (op.op === 'delete') tx.delete(ref);
  else if (op.op === 'set') tx.set(ref, op.data);
  else tx.update(ref, op.data);
}

/** Firebase adapters for the route logic. */
function routesDeps(): RoutesDeps {
  const routes = () => db().collection(COLLECTIONS.routes);

  return {
    async cityExists(cityId) {
      const snap = await db().collection(COLLECTIONS.cities).doc(cityId).get();
      if (!snap.exists) return false;
      const type = snap.get('type') ?? 'city';
      return type === 'city' || type === 'zone';
    },
    newId: () => routes().doc().id,
    timestamp: () => FieldValue.serverTimestamp(),
    deleteField: () => FieldValue.delete(),
    async commit(ops) {
      const batch = db().batch();
      for (const op of ops) {
        const ref = db().doc(op.path);
        if (op.op === 'delete') batch.delete(ref);
        else if (op.op === 'set') batch.set(ref, op.data);
        else batch.update(ref, op.data);
      }
      await batch.commit();
    },
    async mutateRoute(routeId, plan) {
      await db().runTransaction(async (tx) => {
        const routeRef = routes().doc(routeId);
        const routeSnap = await tx.get(routeRef);
        let state: RouteState | null = null;
        if (routeSnap.exists) {
          const [segments, slots] = await Promise.all([
            tx.get(routeRef.collection(SEGMENTS)),
            tx.get(routeRef.collection(TIME_SLOTS)),
          ]);
          const factorSnaps = await Promise.all(segments.docs.map((d) => tx.get(d.ref.collection(RISK_FACTORS))));
          state = {
            segments: segments.docs.map((d) => toSegment(d.id, d.data())),
            slots: slots.docs.map((d) => toTimeSlot(d.id, d.data())),
            factors: Object.fromEntries(
              segments.docs.map((d, i) => [
                d.id,
                factorSnaps[i].docs.map((f) => toRiskFactor(f.id, f.data())).filter((f): f is RiskFactorRecord => f !== null),
              ]),
            ),
          };
        }
        for (const op of plan(state)) apply(tx, op);
      });
    },
    routeExists: async (routeId) => (await routes().doc(routeId).get()).exists,
    deleteRouteTree: (routeId) => db().recursiveDelete(routes().doc(routeId)),
  };
}

/**
 * Callable wrapper: `routes.manage` permission, DomainError mapping and an
 * audit log. Returns `{ ok: true }` plus the logic result (e.g. `{ id }`).
 */
function routeCallable(action: string, run: (raw: unknown, deps: RoutesDeps) => Promise<{ id: string } | void>) {
  return onCall(async (request) => {
    const caller = requirePermission(request, 'routes.manage');
    const result = await runDomain(() => run(request.data, routesDeps()));
    const data = (request.data ?? {}) as Record<string, unknown>;
    logger.info(action, {
      caller,
      routeId: data.routeId ?? data.id ?? result?.id,
      segmentId: data.segmentId,
      slotId: data.slotId,
      factorId: data.factorId,
      createdId: result?.id,
    });
    return { ok: true, ...(result ?? {}) };
  });
}

/** RF-05-1 */
export const createRoute = routeCallable('Route created', logic.createRoute);
/** RF-05-2 */
export const updateRoute = routeCallable('Route updated', logic.updateRoute);
/** RF-05-3: cascades to segments, risk factors and time slots. */
export const deleteRoute = routeCallable('Route deleted', logic.deleteRoute);

/** RF-05-4..6: segments with contiguous order; every change recalculates the index. */
export const createSegment = routeCallable('Segment created', logic.createSegment);
export const updateSegment = routeCallable('Segment updated', logic.updateSegment);
export const deleteSegment = routeCallable('Segment deleted', logic.deleteSegment);

/** RF-07: time slots of a route (no overlaps). */
export const createTimeSlot = routeCallable('Time slot created', logic.createTimeSlot);
export const updateTimeSlot = routeCallable('Time slot updated', logic.updateTimeSlot);
export const deleteTimeSlot = routeCallable('Time slot deleted', logic.deleteTimeSlot);

/** RF-07: risk factors of a segment. */
export const createRiskFactor = routeCallable('Risk factor created', logic.createRiskFactor);
export const updateRiskFactor = routeCallable('Risk factor updated', logic.updateRiskFactor);
export const deleteRiskFactor = routeCallable('Risk factor deleted', logic.deleteRiskFactor);
