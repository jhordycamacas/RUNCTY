import {
  PositionProblem,
  PositionSource,
  PositionSourceError,
  StopWatching,
} from '../domain/position-source';
import { PositionFix } from '../domain/run-tracker';

/** A GPS driven by the test: `emit` sends a fix, `fail` a problem. */
export class FakePositionSource extends PositionSource {
  permission: 'granted' | PositionProblem = 'granted';
  watching = false;
  private onFix: ((fix: PositionFix) => void) | null = null;
  private onProblem: ((problem: PositionProblem) => void) | null = null;

  async ensurePermission(): Promise<void> {
    if (this.permission !== 'granted') throw new PositionSourceError(this.permission);
  }

  async watch(
    onFix: (fix: PositionFix) => void,
    onProblem: (problem: PositionProblem) => void,
  ): Promise<StopWatching> {
    this.onFix = onFix;
    this.onProblem = onProblem;
    this.watching = true;
    return async () => {
      this.watching = false;
      this.onFix = null;
      this.onProblem = null;
    };
  }

  emit(fix: PositionFix): void {
    this.onFix?.(fix);
  }

  fail(problem: PositionProblem): void {
    this.onProblem?.(problem);
  }
}
