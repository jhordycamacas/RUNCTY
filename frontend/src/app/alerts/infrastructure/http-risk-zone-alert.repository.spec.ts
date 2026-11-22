import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ApiClient } from '../../core/api/api-client';
import { ApiError } from '../../core/errors/api-error';
import { HttpRiskZoneAlertRepository } from './http-risk-zone-alert.repository';

describe('HttpRiskZoneAlertRepository', () => {
  let get: ReturnType<typeof vi.fn>;
  let repository: HttpRiskZoneAlertRepository;

  beforeEach(() => {
    get = vi.fn();
    TestBed.configureTestingModule({
      providers: [HttpRiskZoneAlertRepository, { provide: ApiClient, useValue: { get } }],
    });
    repository = TestBed.inject(HttpRiskZoneAlertRepository);
  });

  it('lists the active alerts of a city and maps them to the domain', async () => {
    get.mockReturnValue(
      of({
        alerts: [
          {
            id: 'a1',
            type: 'robbery',
            severity: 'alta',
            description: 'Robos al anochecer',
            location: { lat: -4, lng: -79.2 },
            radiusM: 300,
            cityId: 'loja',
            validFrom: '2026-11-20',
            validTo: '2026-11-30',
            startTime: '18:00',
            endTime: '21:00',
          },
        ],
      }),
    );

    const alerts = await repository.listActive('loja');

    expect(get).toHaveBeenCalledWith('/risk-zone-alerts', { cityId: 'loja', active: true });
    expect(alerts).toEqual([
      expect.objectContaining({ id: 'a1', severity: 'alta', radiusM: 300, startTime: '18:00' }),
    ]);
    expect(alerts[0].routeId).toBeUndefined();
  });

  it('reads an unknown severity as medium and drops malformed times', async () => {
    get.mockReturnValue(of({ alerts: [{ id: 'a2', severity: 'extrema', startTime: '7pm' }] }));

    const [alert] = await repository.listActive('loja');

    expect(alert.severity).toBe('media');
    expect(alert.startTime).toBeUndefined();
  });

  it('answers "no alerts" while the endpoint is not deployed (404)', async () => {
    get.mockReturnValue(throwError(() => new ApiError(404, 'not-found', 'No encontrado.')));

    expect(await repository.listActive('loja')).toEqual([]);
  });

  it('lets any other failure through', async () => {
    get.mockReturnValue(throwError(() => new ApiError(0, 'network', 'Sin conexión.')));

    await expect(repository.listActive('loja')).rejects.toThrow('Sin conexión.');
  });
});
