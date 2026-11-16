import { Route, RouteFactor, SafetyLevel, Segment } from '../../../routes/domain/route';
import { ManagedRouteDetail, TimeSlot } from './managed-route';

/**
 * The safety level of a route or segment in one time slot, as the API computed it. A route is
 * never called "segura" or "insegura": each slot shows its level. `null` means not rated yet.
 */
export interface SlotLevel {
  key: string;
  label: string;
  level: SafetyLevel | null;
}

export const slotRangeLabel = (startTime: string, endTime: string): string =>
  `${startTime} – ${endTime}`;

/** The route level per slot, in the API order (by start time). */
export function routeSlotLevels(route: Route): SlotLevel[] {
  return route.safety.map((entry) => ({
    key: entry.slotId,
    label: slotRangeLabel(entry.startTime, entry.endTime),
    level: entry.level,
  }));
}

const slotLabel = (slot: TimeSlot): string => {
  const range = slotRangeLabel(slot.startTime, slot.endTime);
  return slot.label ? `${slot.label} (${range})` : range;
};

/** The segment level for every slot of the route, by start time; a slot it lacks is unrated. */
export function segmentSlotLevels(segment: Segment, slots: readonly TimeSlot[]): SlotLevel[] {
  return slots.map((slot) => ({
    key: slot.id,
    label: slotLabel(slot),
    level: segment.safety[slot.id]?.level ?? null,
  }));
}

/** RF-07-10: the safety index of the route in one slot, exactly as the API computed it. */
export interface SlotSafetySummary {
  key: string;
  label: string;
  level: SafetyLevel;
  score: number;
  /** The segment that sets the route level; null when the API names none. */
  worstSegment: string | null;
  factors: RouteFactor[];
}

/** One entry per rated slot, in the API order; nothing is scored on the client. */
export function safetySummary(detail: ManagedRouteDetail): SlotSafetySummary[] {
  return detail.route.safety.map((entry) => {
    const slot = detail.timeSlots.find((candidate) => candidate.id === entry.slotId);
    const worst = detail.segments.find((segment) => segment.id === entry.worstSegmentId);
    return {
      key: entry.slotId,
      label: slot ? slotLabel(slot) : slotRangeLabel(entry.startTime, entry.endTime),
      level: entry.level,
      score: entry.score,
      worstSegment: worst?.name ?? null,
      factors: entry.factors,
    };
  });
}
