import { LatLng } from '../../routes/domain/route';
import { distanceMeters } from './geo';

export type RunStatus = 'idle' | 'running' | 'paused' | 'finished';

/** One GPS reading. `accuracyM` is the radius of uncertainty the device reports. */
export interface PositionFix extends LatLng {
  accuracyM: number | null;
  /** Epoch milliseconds. */
  timestamp: number;
}

/** A point of the distance curve, to measure the current pace over a short window. */
interface Mark {
  at: number;
  distanceM: number;
}

/**
 * A training session measured live. Time only runs while running: a pause closes the open stretch
 * and drops the last fix, so the distance covered while paused (walking back, a car) never counts.
 */
export interface RunState {
  status: RunStatus;
  /** Time of the closed stretches; the open one is added by `elapsedAt`. */
  elapsedMs: number;
  /** When the open stretch started, while running. */
  stretchStart: number | null;
  distanceM: number;
  lastFix: PositionFix | null;
  /** Recent marks (last `PACE_WINDOW_MS`), for the current pace. */
  marks: Mark[];
}

/** Readings less precise than this are ignored (a cold GPS or a tunnel). */
export const MAX_ACCURACY_M = 30;
/** Moves shorter than this are GPS jitter while standing, not running. */
export const MIN_STEP_M = 3;
/** The current pace looks at the last half minute. */
export const PACE_WINDOW_MS = 30_000;
/** Below this distance there is no meaningful pace. */
const MIN_PACE_DISTANCE_M = 10;

export const idleRun = (): RunState => ({
  status: 'idle',
  elapsedMs: 0,
  stretchStart: null,
  distanceM: 0,
  lastFix: null,
  marks: [],
});

export function startRun(now: number): RunState {
  return { ...idleRun(), status: 'running', stretchStart: now, marks: [{ at: now, distanceM: 0 }] };
}

export function addFix(state: RunState, fix: PositionFix): RunState {
  if (state.status !== 'running') return state;
  if (fix.accuracyM !== null && fix.accuracyM > MAX_ACCURACY_M) return state;
  if (!state.lastFix) return { ...state, lastFix: fix };

  const step = distanceMeters(state.lastFix, fix);
  if (step < MIN_STEP_M) return state;

  const distanceM = state.distanceM + step;
  const marks = [...state.marks, { at: fix.timestamp, distanceM }];
  // Keep the newest mark that is older than the window, so the window is always covered.
  const firstInWindow = marks.findIndex((mark) => mark.at >= fix.timestamp - PACE_WINDOW_MS);
  return { ...state, distanceM, lastFix: fix, marks: marks.slice(Math.max(0, firstInWindow - 1)) };
}

export function pauseRun(state: RunState, now: number): RunState {
  if (state.status !== 'running') return state;
  return { ...closeStretch(state, now), status: 'paused', lastFix: null, marks: [] };
}

export function resumeRun(state: RunState, now: number): RunState {
  if (state.status !== 'paused') return state;
  return { ...state, status: 'running', stretchStart: now, marks: [{ at: now, distanceM: state.distanceM }] };
}

export function finishRun(state: RunState, now: number): RunState {
  if (state.status !== 'running' && state.status !== 'paused') return state;
  return { ...closeStretch(state, now), status: 'finished', lastFix: null, marks: [] };
}

/** Running time at `now`, pauses excluded. */
export function elapsedAt(state: RunState, now: number): number {
  const open = state.stretchStart === null ? 0 : Math.max(0, now - state.stretchStart);
  return state.elapsedMs + open;
}

/** Seconds per kilometre for a distance in a time; `null` while the distance is too short. */
export function paceSecondsPerKm(distanceM: number, elapsedMs: number): number | null {
  if (distanceM < MIN_PACE_DISTANCE_M || elapsedMs <= 0) return null;
  return elapsedMs / 1000 / (distanceM / 1000);
}

/** Pace over the last half minute of running. */
export function currentPace(state: RunState): number | null {
  if (state.status !== 'running' || state.marks.length < 2) return null;
  const first = state.marks[0];
  const last = state.marks[state.marks.length - 1];
  return paceSecondsPerKm(last.distanceM - first.distanceM, last.at - first.at);
}

/** "12:05" or "1:02:05". */
export function formatDuration(ms: number): string {
  const total = Math.floor(ms / 1000);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = String(total % 60).padStart(2, '0');
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${seconds}`
    : `${String(minutes).padStart(2, '0')}:${seconds}`;
}

function closeStretch(state: RunState, now: number): RunState {
  return { ...state, elapsedMs: elapsedAt(state, now), stretchStart: null };
}
