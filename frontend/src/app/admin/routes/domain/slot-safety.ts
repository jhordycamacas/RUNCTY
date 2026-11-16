import { Route, SafetyLevel } from '../../../routes/domain/route';

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
