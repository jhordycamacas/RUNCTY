/**
 * Route management (RF-05, RF-07) as the admin area reads and writes it. A manager also sees
 * inactive routes, the time slots and the risk factors of every segment. The safety index is
 * computed by the backend on every change; the client only displays what the API returns.
 */
import {
  LatLng,
  Route,
  RouteDetail,
  RoutePoint,
  Segment,
  Severity,
} from '../../../routes/domain/route';

/** A window of the day the index is computed for. `endTime` may be `24:00` (midnight). */
export interface TimeSlot {
  id: string;
  label: string | null;
  startTime: string;
  endTime: string;
  /** Validity dates as `YYYY-MM-DD`. */
  validFrom: string | null;
  validTo: string | null;
}

/** A risk factor of a segment. Without a window it applies all day. */
export interface RiskFactor {
  id: string;
  /** Kept as-is when the app does not know it. */
  type: string;
  severity: Severity;
  description: string;
  startTime: string | null;
  endTime: string | null;
}

export interface ManagedSegment extends Segment {
  riskFactors: RiskFactor[];
}

/** `GET /routes/{id}` for `routes.manage`: segments in order, slots by start time. */
export interface ManagedRouteDetail extends RouteDetail {
  segments: ManagedSegment[];
  timeSlots: TimeSlot[];
}

/** Body of `POST /routes` and `PUT /routes/{id}`. */
export interface RouteInput {
  name: string;
  cityId: string;
  description: string;
  start: RoutePoint;
  end: RoutePoint;
  distanceKm: number;
  elevationGainM: number;
  surface: string;
  difficulty: string;
  active: boolean;
}

/** Body of the segment writes. `order` is the 0-based target position; absent keeps or appends. */
export interface SegmentInput {
  name: string;
  coordinates: LatLng[];
  order?: number;
}

/** Body of the time slot writes. A PUT without an optional field clears it. */
export interface TimeSlotInput {
  label?: string;
  startTime: string;
  endTime: string;
  validFrom?: string;
  validTo?: string;
}

/** Body of the risk factor writes: both times or none (all day). */
export interface RiskFactorInput {
  /** Free text typed by the admin (1-40 chars). */
  type: string;
  severity: Severity;
  description: string;
  startTime?: string;
  endTime?: string;
}

/**
 * The whole route aggregate, one repository because every mutation runs in one backend
 * transaction that also recalculates the safety index. Creates resolve to the new id.
 */
export abstract class RouteAdminRepository {
  /** Every route, inactive ones included; `null` lists all cities. */
  abstract list(cityId: string | null): Promise<Route[]>;
  /** The route with its segments, risk factors, time slots and current safety index. */
  abstract get(routeId: string): Promise<ManagedRouteDetail>;
  abstract createRoute(input: RouteInput): Promise<string>;
  abstract updateRoute(routeId: string, input: RouteInput): Promise<void>;
  /** Cascades to segments, risk factors and time slots. */
  abstract deleteRoute(routeId: string): Promise<void>;
  abstract createSegment(routeId: string, input: SegmentInput): Promise<string>;
  abstract updateSegment(routeId: string, segmentId: string, input: SegmentInput): Promise<void>;
  /** Also deletes the segment's risk factors. */
  abstract deleteSegment(routeId: string, segmentId: string): Promise<void>;
  abstract createTimeSlot(routeId: string, input: TimeSlotInput): Promise<string>;
  abstract updateTimeSlot(routeId: string, slotId: string, input: TimeSlotInput): Promise<void>;
  abstract deleteTimeSlot(routeId: string, slotId: string): Promise<void>;
  abstract createRiskFactor(
    routeId: string,
    segmentId: string,
    input: RiskFactorInput,
  ): Promise<string>;
  abstract updateRiskFactor(
    routeId: string,
    segmentId: string,
    factorId: string,
    input: RiskFactorInput,
  ): Promise<void>;
  abstract deleteRiskFactor(routeId: string, segmentId: string, factorId: string): Promise<void>;
}
