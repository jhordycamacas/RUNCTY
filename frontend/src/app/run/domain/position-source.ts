import { PositionFix } from './run-tracker';

/** Why live tracking cannot run: the user said no, or the device cannot locate itself. */
export type PositionProblem = 'denied' | 'unavailable';

export class PositionSourceError extends Error {
  constructor(readonly problem: PositionProblem) {
    super(problem);
    this.name = 'PositionSourceError';
  }
}

/** Stops a running watch. */
export type StopWatching = () => Promise<void>;

/** The device GPS, as the tracker needs it. */
export abstract class PositionSource {
  /**
   * Makes sure the app may read the location, asking the user when the system allows it.
   * Rejects with `PositionSourceError`.
   */
  abstract ensurePermission(): Promise<void>;
  /** Streams fixes until stopped; failures arrive through `onProblem`. */
  abstract watch(
    onFix: (fix: PositionFix) => void,
    onProblem: (problem: PositionProblem) => void,
  ): Promise<StopWatching>;
}
