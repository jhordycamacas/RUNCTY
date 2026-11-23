import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { DEFAULT_SETTINGS } from './system-settings';
import { SystemSettingsStore } from './system-settings.store';

describe('SystemSettingsStore', () => {
  let store: SystemSettingsStore;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    store = TestBed.inject(SystemSettingsStore);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('starts with the defaults', () => {
    expect(store.settings()).toEqual(DEFAULT_SETTINGS);
  });

  it('reads the parameters the admin configured', async () => {
    const loading = store.load();
    http
      .expectOne(`${environment.apiBaseUrl}/settings`)
      .flush({ settings: { paceMinSecPerKm: 180, distanceMaxKm: 42 } });
    await loading;

    expect(store.settings().paceMinSecPerKm).toBe(180);
    expect(store.settings().distanceMaxKm).toBe(42);
    expect(store.settings().paceMaxSecPerKm).toBe(DEFAULT_SETTINGS.paceMaxSecPerKm);
  });

  it('keeps the defaults when the call fails', async () => {
    const loading = store.load();
    http
      .expectOne(`${environment.apiBaseUrl}/settings`)
      .flush({}, { status: 500, statusText: 'Server Error' });
    await loading;

    expect(store.settings()).toEqual(DEFAULT_SETTINGS);
  });
});
