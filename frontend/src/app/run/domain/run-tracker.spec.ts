import { distanceMeters } from './geo';
import {
  PositionFix,
  addFix,
  currentPace,
  elapsedAt,
  finishRun,
  formatDuration,
  idleRun,
  paceSecondsPerKm,
  pauseRun,
  resumeRun,
  startRun,
} from './run-tracker';

/** A fix `metersNorth` north of the origin, `seconds` after the start. */
const fix = (metersNorth: number, seconds: number, accuracyM: number | null = 5): PositionFix => ({
  lat: -2.9 + metersNorth / 111_195,
  lng: -79.0,
  accuracyM,
  timestamp: seconds * 1000,
});

const run = (...fixes: PositionFix[]) => fixes.reduce(addFix, startRun(0));

describe('distanceMeters', () => {
  it('measures the great-circle distance (one thousandth of a degree north is about 111 m)', () => {
    expect(distanceMeters({ lat: 0, lng: 0 }, { lat: 0.001, lng: 0 })).toBeCloseTo(111.19, 1);
    expect(distanceMeters({ lat: -2.9, lng: -79 }, { lat: -2.9, lng: -79 })).toBe(0);
  });
});

describe('run tracker', () => {
  it('adds up the distance between fixes', () => {
    const state = run(fix(0, 0), fix(100, 30), fix(250, 60));

    expect(state.distanceM).toBeCloseTo(250, 0);
  });

  it('ignores imprecise fixes and standing-still jitter', () => {
    const state = run(fix(0, 0), fix(200, 10, 80), fix(1, 20), fix(50, 30));

    expect(state.distanceM).toBeCloseTo(50, 0);
  });

  it('counts no fix before the start or after the finish', () => {
    expect(addFix(idleRun(), fix(0, 0))).toEqual(idleRun());
    const finished = finishRun(run(fix(0, 0), fix(100, 30)), 30_000);

    expect(addFix(finished, fix(500, 60)).distanceM).toBeCloseTo(100, 0);
  });

  it('leaves the paused time out of the elapsed time', () => {
    let state = startRun(0);
    state = pauseRun(state, 60_000);
    expect(elapsedAt(state, 200_000)).toBe(60_000);

    state = resumeRun(state, 200_000);
    expect(elapsedAt(state, 230_000)).toBe(90_000);

    state = finishRun(state, 260_000);
    expect(state.status).toBe('finished');
    expect(elapsedAt(state, 999_000)).toBe(120_000);
  });

  it('does not count the distance moved while paused', () => {
    let state = run(fix(0, 0), fix(100, 30));
    state = pauseRun(state, 30_000);
    state = addFix(state, fix(600, 60));
    state = resumeRun(state, 90_000);
    state = [fix(600, 90), fix(700, 120)].reduce(addFix, state);

    expect(state.distanceM).toBeCloseTo(200, 0);
  });

  it('computes the pace in seconds per kilometre', () => {
    expect(paceSecondsPerKm(1000, 300_000)).toBe(300);
    expect(paceSecondsPerKm(2500, 750_000)).toBe(300);
    expect(paceSecondsPerKm(5, 10_000)).toBeNull();
  });

  it('reads the current pace over the last half minute', () => {
    // 100 m every 30 s for a minute (5:00/km), then 100 m in 20 s (3:20/km).
    const state = run(fix(0, 0), fix(100, 30), fix(200, 60), fix(300, 80));

    expect(currentPace(state)).toBeCloseTo(250, 0);
    expect(currentPace(pauseRun(state, 80_000))).toBeNull();
  });

  it('formats the running time as minutes and seconds, with hours when needed', () => {
    expect(formatDuration(0)).toBe('00:00');
    expect(formatDuration(65_400)).toBe('01:05');
    expect(formatDuration(3_725_000)).toBe('1:02:05');
  });
});
