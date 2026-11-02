/**
 * RF-07: safety index per segment ("tramo") and time slot ("franja").
 *
 * Each segment starts at 100 points per slot. Every penalty active in the
 * slot (its window overlaps the slot window) subtracts by severity
 * (low −10, medium −20, high −35), floored at 0. Levels: high ≥70,
 * medium 40–69, low <40. A route takes its worst segment per slot.
 * The factors explaining each result are always kept.
 *
 * Penalty sources are pluggable: risk factors today, and later community
 * reports (RF-17) through `extraPenalties`, tagged with their `source`.
 */
import { timeWindowsOverlap, toWindow } from './time';

export const SEVERITIES = ['low', 'medium', 'high'] as const;
export type Severity = (typeof SEVERITIES)[number];
export type SafetyLevel = 'high' | 'medium' | 'low';

const MAX_SCORE = 100;
const SEVERITY_PENALTY: Record<Severity, number> = { low: 10, medium: 20, high: 35 };
const SEVERITY_RANK: Record<Severity, number> = { high: 0, medium: 1, low: 2 };

export interface SafetySlot {
  id: string;
  startTime: string;
  endTime: string;
}

/** A risk factor (or any penalty) with an optional application window. */
export interface SafetyFactorInput {
  type: string;
  severity: Severity;
  description: string;
  startTime?: string;
  endTime?: string;
}

/** Extra penalty source, e.g. `source: 'report'` for community reports. */
export interface SafetyPenalty extends SafetyFactorInput {
  source: string;
}

interface SegmentFactor {
  type: string;
  severity: Severity;
  description: string;
  /** Only present for extra penalty sources (risk factors omit it). */
  source?: string;
}

interface SegmentSlotSafety {
  level: SafetyLevel;
  score: number;
  factors: SegmentFactor[];
}

export type SegmentSafety = Record<string, SegmentSlotSafety>;

interface RouteFactor extends SegmentFactor {
  segmentId: string;
  segmentName: string;
}

interface RouteSlotSafety {
  level: SafetyLevel;
  score: number;
  startTime: string;
  endTime: string;
  worstSegmentId: string;
  factors: RouteFactor[];
}

export type RouteSafety = Record<string, RouteSlotSafety>;

export interface SegmentWithSafety {
  id: string;
  name: string;
  order: number;
  safety: SegmentSafety;
}

export function levelForScore(score: number): SafetyLevel {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

const bySeverity = (a: SegmentFactor, b: SegmentFactor) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];

function toSegmentFactor(penalty: SafetyFactorInput | SafetyPenalty): SegmentFactor {
  const factor: SegmentFactor = { type: penalty.type, severity: penalty.severity, description: penalty.description };
  if ('source' in penalty) factor.source = penalty.source;
  return factor;
}

export function computeSegmentSafety(
  slots: readonly SafetySlot[],
  factors: readonly SafetyFactorInput[],
  extraPenalties: readonly SafetyPenalty[] = [],
): SegmentSafety {
  const penalties = [...factors, ...extraPenalties];
  const result: SegmentSafety = {};
  for (const slot of slots) {
    const slotWindow = toWindow(slot.startTime, slot.endTime);
    const active = penalties.filter((p) => timeWindowsOverlap(slotWindow, toWindow(p.startTime, p.endTime)));
    const penalty = active.reduce((sum, p) => sum + SEVERITY_PENALTY[p.severity], 0);
    const score = Math.max(0, MAX_SCORE - penalty);
    result[slot.id] = { level: levelForScore(score), score, factors: active.map(toSegmentFactor).sort(bySeverity) };
  }
  return result;
}

const FULL_SCORE: SegmentSlotSafety = { level: 'high', score: MAX_SCORE, factors: [] };

/** Route level per slot = worst segment (ties: first in route order). */
export function computeRouteSafety(slots: readonly SafetySlot[], segments: readonly SegmentWithSafety[]): RouteSafety {
  if (segments.length === 0) return {};
  const ordered = [...segments].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  const result: RouteSafety = {};
  for (const slot of slots) {
    let worst = ordered[0];
    const factors: RouteFactor[] = [];
    for (const segment of ordered) {
      const safety = segment.safety[slot.id] ?? FULL_SCORE;
      if (safety.score < (worst.safety[slot.id] ?? FULL_SCORE).score) worst = segment;
      for (const factor of safety.factors) {
        factors.push({ segmentId: segment.id, segmentName: segment.name, ...factor });
      }
    }
    const score = (worst.safety[slot.id] ?? FULL_SCORE).score;
    result[slot.id] = {
      level: levelForScore(score),
      score,
      startTime: slot.startTime,
      endTime: slot.endTime,
      worstSegmentId: worst.id,
      // Stable sort keeps route order within the same severity.
      factors: factors.sort(bySeverity),
    };
  }
  return result;
}
