import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { DEFAULT_SETTINGS } from '../../../core/settings/system-settings';
import { HttpSettingsRepository } from './http-settings.repository';

describe('HttpSettingsRepository', () => {
  let repository: HttpSettingsRepository;
  let http: HttpTestingController;
  const url = (path: string) => `${environment.apiBaseUrl}${path}`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HttpSettingsRepository, provideHttpClient(), provideHttpClientTesting()],
    });
    repository = TestBed.inject(HttpSettingsRepository);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads the settings, completing what the body lacks with the defaults', async () => {
    const loading = repository.load();
    const request = http.expectOne(url('/settings'));
    expect(request.request.method).toBe('GET');
    request.flush({ settings: { penaltyHigh: 50 } });

    expect(await loading).toEqual({ ...DEFAULT_SETTINGS, penaltyHigh: 50 });
  });

  it('puts only the changes and answers the settings with the recalculated count', async () => {
    const saving = repository.save({ penaltyHigh: 50 });
    const request = http.expectOne(url('/settings'));
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ penaltyHigh: 50 });
    request.flush({ settings: { ...DEFAULT_SETTINGS, penaltyHigh: 50 }, recalculated: 7 });

    expect(await saving).toEqual({
      settings: { ...DEFAULT_SETTINGS, penaltyHigh: 50 },
      recalculated: 7,
    });
  });

  it('counts zero routes when the answer has no count', async () => {
    const saving = repository.save({ countryCode: 'PE' });
    http.expectOne(url('/settings')).flush({ settings: { ...DEFAULT_SETTINGS, countryCode: 'PE' } });

    expect((await saving).recalculated).toBe(0);
  });

  it('asks the server to recalculate every route', async () => {
    const recalculating = repository.recalculateRoutes();
    const request = http.expectOne(url('/admin/recalculate-routes'));
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({});
    request.flush({ recalculated: 4 });

    expect(await recalculating).toBe(4);
  });
});
