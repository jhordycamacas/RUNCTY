import { TestBed } from '@angular/core/testing';
import { PositionSource } from '../domain/position-source';
import { PositionFix } from '../domain/run-tracker';
import { FakePositionSource } from '../testing/fake-position-source';
import { RunStore } from './run.store';

const fix = (metersNorth: number, seconds: number): PositionFix => ({
  lat: -2.9 + metersNorth / 111_195,
  lng: -79.0,
  accuracyM: 5,
  timestamp: seconds * 1000,
});

describe('RunStore', () => {
  let gps: FakePositionSource;
  let store: RunStore;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    gps = new FakePositionSource();
    TestBed.configureTestingModule({ providers: [{ provide: PositionSource, useValue: gps }] });
    store = TestBed.inject(RunStore);
  });

  afterEach(() => vi.useRealTimers());

  it('starts running, measures time and distance, and stops the GPS on finish', async () => {
    await store.start();
    expect(store.status()).toBe('running');

    gps.emit(fix(0, 0));
    vi.advanceTimersByTime(30_000);
    gps.emit(fix(100, 30));
    vi.advanceTimersByTime(30_000);
    gps.emit(fix(200, 60));

    expect(store.elapsedMs()).toBe(60_000);
    expect(store.distanceKm()).toBeCloseTo(0.2, 2);
    expect(store.paceSecondsPerKm()).toBeCloseTo(300, 0);

    await store.finish();
    expect(store.status()).toBe('finished');
    expect(gps.watching).toBe(false);
    expect(store.paceSecondsPerKm()).toBeCloseTo(300, 0);
  });

  it('does not count the paused time', async () => {
    await store.start();
    vi.advanceTimersByTime(10_000);
    store.pause();
    vi.advanceTimersByTime(50_000);
    await store.resume();
    vi.advanceTimersByTime(5_000);

    expect(store.status()).toBe('running');
    expect(store.elapsedMs()).toBe(15_000);
  });

  it('stays idle and tells why when the location permission is refused', async () => {
    gps.permission = 'denied';

    await store.start();

    expect(store.status()).toBe('idle');
    expect(store.problem()).toBe('denied');
    expect(gps.watching).toBe(false);
  });

  it('pauses the run when the permission is withdrawn, and keeps going on a lost signal', async () => {
    await store.start();
    gps.fail('unavailable');
    expect(store.status()).toBe('running');
    expect(store.problem()).toBe('unavailable');

    gps.emit(fix(0, 1));
    expect(store.problem()).toBeNull();

    gps.fail('denied');
    expect(store.status()).toBe('paused');
    expect(store.problem()).toBe('denied');
  });

  it('goes back to the start screen after a finished run', async () => {
    await store.start();
    await store.finish();
    store.reset();

    expect(store.status()).toBe('idle');
    expect(store.elapsedMs()).toBe(0);
  });
});
