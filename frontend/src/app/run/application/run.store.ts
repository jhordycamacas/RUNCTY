import { Injectable, computed, inject, signal } from '@angular/core';
import {
  PositionProblem,
  PositionSource,
  PositionSourceError,
  StopWatching,
} from '../domain/position-source';
import {
  RunState,
  addFix,
  currentPace,
  elapsedAt,
  finishRun,
  idleRun,
  pauseRun,
  paceSecondsPerKm,
  resumeRun,
  startRun,
} from '../domain/run-tracker';

/** How often the clock on screen moves. */
const TICK_MS = 1000;

/**
 * The live training session (the «Correr» tab). It lives at app level so the run keeps going
 * while the runner looks at another tab. Nothing is saved to the server yet (EP-12, Sprint 4).
 */
@Injectable({ providedIn: 'root' })
export class RunStore {
  private readonly source = inject(PositionSource);

  private readonly state = signal<RunState>(idleRun());
  private readonly now = signal(Date.now());
  private readonly trouble = signal<PositionProblem | null>(null);
  private readonly busy = signal(false);
  private stopWatching: StopWatching | null = null;
  private ticker: ReturnType<typeof setInterval> | null = null;

  readonly status = computed(() => this.state().status);
  readonly elapsedMs = computed(() => elapsedAt(this.state(), this.now()));
  readonly distanceKm = computed(() => this.state().distanceM / 1000);
  /** Seconds per km over the last half minute while running; the average once finished. */
  readonly paceSecondsPerKm = computed(() =>
    this.state().status === 'finished'
      ? paceSecondsPerKm(this.state().distanceM, this.elapsedMs())
      : currentPace(this.state()),
  );
  /** The ground covered, one line per running period. */
  readonly path = computed(() => this.state().path);
  /** The runner's last counted position while running; none while paused or stopped. */
  readonly position = computed(() => this.state().lastFix);
  /** `denied`: no permission; `unavailable`: no GPS signal right now. */
  readonly problem = this.trouble.asReadonly();
  /** True while asking for the permission and starting the GPS. */
  readonly starting = this.busy.asReadonly();

  async start(): Promise<void> {
    if (this.status() === 'running' || this.status() === 'paused') return;
    if (await this.beginWatching()) {
      this.state.set(startRun(Date.now()));
      this.startTicking();
    }
  }

  pause(): void {
    this.state.update((state) => pauseRun(state, Date.now()));
    this.stopTicking();
  }

  /** Continues a paused run; after a refused permission it asks again first. */
  async resume(): Promise<void> {
    if (this.status() !== 'paused') return;
    if (!this.stopWatching && !(await this.beginWatching())) return;
    this.state.update((state) => resumeRun(state, Date.now()));
    this.startTicking();
  }

  async finish(): Promise<void> {
    this.state.update((state) => finishRun(state, Date.now()));
    this.stopTicking();
    await this.release();
  }

  /** Back to the start screen after a finished run. */
  reset(): void {
    this.state.set(idleRun());
    this.trouble.set(null);
  }

  /** Asks for the permission and starts the GPS; false (with the problem set) when it cannot. */
  private async beginWatching(): Promise<boolean> {
    if (this.busy()) return false;
    this.busy.set(true);
    this.trouble.set(null);
    try {
      await this.source.ensurePermission();
      this.stopWatching = await this.source.watch(
        (fix) => {
          this.trouble.set(null);
          this.state.update((state) => addFix(state, fix));
        },
        (problem) => this.onProblem(problem),
      );
      return true;
    } catch (error) {
      this.trouble.set(error instanceof PositionSourceError ? error.problem : 'unavailable');
      return false;
    } finally {
      this.busy.set(false);
    }
  }

  private onProblem(problem: PositionProblem): void {
    this.trouble.set(problem);
    // Without permission there is nothing more to measure; a lost signal may come back.
    if (problem === 'denied') {
      this.pause();
      void this.release();
    }
  }

  private async release(): Promise<void> {
    const stop = this.stopWatching;
    this.stopWatching = null;
    await stop?.();
  }

  private startTicking(): void {
    this.now.set(Date.now());
    this.ticker ??= setInterval(() => this.now.set(Date.now()), TICK_MS);
  }

  private stopTicking(): void {
    this.now.set(Date.now());
    if (this.ticker) clearInterval(this.ticker);
    this.ticker = null;
  }
}
