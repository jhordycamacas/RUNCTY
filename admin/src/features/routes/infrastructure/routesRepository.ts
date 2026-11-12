'use client';

import { collection, doc, getDoc, getDocs, type DocumentData } from 'firebase/firestore';

import { COLLECTIONS, ROUTE_SUBCOLLECTIONS, callFunction, firestore } from '@/core/firebase/client';

import {
  DIFFICULTIES,
  SURFACES,
  type Difficulty,
  type LatLng,
  type Ruta,
  type RouteInput,
  type RouteSafety,
  type Severity,
  type Surface,
} from '../domain/route';
import type { FactorDeRiesgo, RiskFactorInput, FranjaHoraria, TimeSlotInput } from '../domain/schedule';
import type { Tramo, SegmentInput } from '../domain/segment';

/**
 * Reads are direct Firestore reads (admins with `routes.manage` also see
 * inactive routes); every write goes through the `routes.manage` callables,
 * which recalculate the safety index.
 */
const num = (value: unknown, fallback = 0): number => (typeof value === 'number' && Number.isFinite(value) ? value : fallback);
const str = (value: unknown, fallback = ''): string => (typeof value === 'string' ? value : fallback);
const optStr = (value: unknown): string | undefined => (typeof value === 'string' ? value : undefined);
const record = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
const severity = (value: unknown): Severity => (value === 'high' || value === 'low' ? value : 'medium');

function toPoint(value: unknown) {
  const p = record(value);
  return { label: str(p.label), lat: num(p.lat), lng: num(p.lng) };
}

function toLatLngs(value: unknown): LatLng[] {
  return Array.isArray(value) ? value.map((p) => ({ lat: num(record(p).lat), lng: num(record(p).lng) })) : [];
}

function toRoute(id: string, data: DocumentData): Ruta {
  return {
    id,
    name: str(data.name, id),
    cityId: str(data.cityId),
    description: str(data.description),
    start: toPoint(data.start),
    end: toPoint(data.end),
    distanceKm: num(data.distanceKm),
    elevationGainM: num(data.elevationGainM),
    surface: SURFACES.includes(data.surface) ? (data.surface as Surface) : 'mixed',
    difficulty: DIFFICULTIES.includes(data.difficulty) ? (data.difficulty as Difficulty) : 'intermediate',
    active: data.active === true,
    segmentCount: num(data.segmentCount),
    // Computed by the backend; trusted as written by the callables.
    safety: record(data.safety) as RouteSafety,
  };
}

function toSegment(id: string, data: DocumentData): Tramo {
  return {
    id,
    name: str(data.name, id),
    order: num(data.order, Number.MAX_SAFE_INTEGER),
    coordinates: toLatLngs(data.coordinates),
    lengthM: num(data.lengthM),
    safety: record(data.safety) as Tramo['safety'],
  };
}

const routeRef = (routeId: string) => doc(firestore(), COLLECTIONS.routes, routeId);

export async function listRoutes(): Promise<Ruta[]> {
  const snapshot = await getDocs(collection(firestore(), COLLECTIONS.routes));
  return snapshot.docs.map((d) => toRoute(d.id, d.data())).sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

export async function getRoute(routeId: string): Promise<Ruta | null> {
  const snap = await getDoc(routeRef(routeId));
  return snap.exists() ? toRoute(snap.id, snap.data()) : null;
}

export async function listSegments(routeId: string): Promise<Tramo[]> {
  const snapshot = await getDocs(collection(routeRef(routeId), ROUTE_SUBCOLLECTIONS.segments));
  return snapshot.docs.map((d) => toSegment(d.id, d.data())).sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
}

export async function listTimeSlots(routeId: string): Promise<FranjaHoraria[]> {
  const snapshot = await getDocs(collection(routeRef(routeId), ROUTE_SUBCOLLECTIONS.timeSlots));
  return snapshot.docs
    .map((d): FranjaHoraria => {
      const data = d.data();
      return {
        id: d.id,
        label: optStr(data.label),
        startTime: str(data.startTime),
        endTime: str(data.endTime),
        validFrom: optStr(data.validFrom),
        validTo: optStr(data.validTo),
      };
    })
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

export async function listRiskFactors(routeId: string, segmentId: string): Promise<FactorDeRiesgo[]> {
  const snapshot = await getDocs(
    collection(routeRef(routeId), ROUTE_SUBCOLLECTIONS.segments, segmentId, ROUTE_SUBCOLLECTIONS.riskFactors),
  );
  return snapshot.docs.map((d): FactorDeRiesgo => {
    const data = d.data();
    return {
      id: d.id,
      type: str(data.type, 'other'),
      severity: severity(data.severity),
      description: str(data.description),
      startTime: optStr(data.startTime),
      endTime: optStr(data.endTime),
    };
  });
}

type Ok = { ok: true };
type Created = { ok: true; id: string };

export const createRoute = (input: RouteInput) => callFunction<RouteInput, Created>('createRoute', input);
export const updateRoute = (id: string, input: RouteInput) =>
  callFunction<RouteInput & { id: string }, Ok>('updateRoute', { id, ...input });
/** Cascades to segments, risk factors and time slots. */
export const deleteRoute = (id: string) => callFunction<{ id: string }, Ok>('deleteRoute', { id });

type SegmentRef = { routeId: string; segmentId: string };

export const createSegment = (routeId: string, input: SegmentInput) =>
  callFunction<SegmentInput & { routeId: string }, Created>('createSegment', { routeId, ...input });
export const updateSegment = (ref: SegmentRef, input: SegmentInput) =>
  callFunction<SegmentInput & SegmentRef, Ok>('updateSegment', { ...ref, ...input });
export const deleteSegment = (ref: SegmentRef) => callFunction<SegmentRef, Ok>('deleteSegment', ref);

type SlotRef = { routeId: string; slotId: string };

export const createTimeSlot = (routeId: string, input: TimeSlotInput) =>
  callFunction<TimeSlotInput & { routeId: string }, Created>('createTimeSlot', { routeId, ...input });
export const updateTimeSlot = (ref: SlotRef, input: TimeSlotInput) =>
  callFunction<TimeSlotInput & SlotRef, Ok>('updateTimeSlot', { ...ref, ...input });
export const deleteTimeSlot = (ref: SlotRef) => callFunction<SlotRef, Ok>('deleteTimeSlot', ref);

type FactorRef = SegmentRef & { factorId: string };

export const createRiskFactor = (ref: SegmentRef, input: RiskFactorInput) =>
  callFunction<RiskFactorInput & SegmentRef, Created>('createRiskFactor', { ...ref, ...input });
export const updateRiskFactor = (ref: FactorRef, input: RiskFactorInput) =>
  callFunction<RiskFactorInput & FactorRef, Ok>('updateRiskFactor', { ...ref, ...input });
export const deleteRiskFactor = (ref: FactorRef) => callFunction<FactorRef, Ok>('deleteRiskFactor', ref);
