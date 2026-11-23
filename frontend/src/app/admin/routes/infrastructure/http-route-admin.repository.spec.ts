import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiClient } from '../../../core/api/api-client';
import { RiskFactorInput, RouteInput, SegmentInput, TimeSlotInput } from '../domain/managed-route';
import { HttpRouteAdminRepository } from './http-route-admin.repository';

const ROUTE: RouteInput = {
  name: 'Parque Jipiro',
  cityId: 'loja',
  description: '',
  start: { label: 'Norte', lat: -3.97, lng: -79.2 },
  end: { label: 'Sur', lat: -3.98, lng: -79.21 },
  distanceKm: 3.2,
  elevationGainM: 15,
  surface: 'Asfalto',
  difficulty: 'Principiante',
  active: true,
};
const SEGMENT: SegmentInput = {
  name: 'Orilla',
  coordinates: [
    { lat: -3.97, lng: -79.2 },
    { lat: -3.98, lng: -79.21 },
  ],
  order: 1,
};
const SLOT: TimeSlotInput = { startTime: '18:00', endTime: '20:00' };
const FACTOR: RiskFactorInput = { type: 'Tráfico', severity: 'low', description: 'Cruce' };

describe('HttpRouteAdminRepository', () => {
  const api = { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() };
  let repository: HttpRouteAdminRepository;

  beforeEach(() => {
    vi.resetAllMocks();
    api.post.mockReturnValue(of({ id: 'new' }));
    api.put.mockReturnValue(of(null));
    api.delete.mockReturnValue(of(null));
    TestBed.configureTestingModule({
      providers: [HttpRouteAdminRepository, { provide: ApiClient, useValue: api }],
    });
    repository = TestBed.inject(HttpRouteAdminRepository);
  });

  it('lists the routes of every city, or of one, mapping them to the domain', async () => {
    api.get.mockReturnValue(of({ routes: [{ id: 'r1', name: 'Jipiro', active: false }] }));

    const all = await repository.list(null);
    await repository.list('loja');

    expect(api.get).toHaveBeenNthCalledWith(1, '/routes', {});
    expect(api.get).toHaveBeenNthCalledWith(2, '/routes', { cityId: 'loja' });
    expect(all).toHaveLength(1);
    expect(all[0]).toMatchObject({ id: 'r1', name: 'Jipiro', active: false });
  });

  it('tolerates a response without the routes list', async () => {
    api.get.mockReturnValue(of({}));

    expect(await repository.list(null)).toEqual([]);
  });

  it('reads a route with its time slots and risk factors, encoding the id', async () => {
    api.get.mockReturnValue(
      of({
        id: 'a/b',
        segments: [{ id: 's1', riskFactors: [{ id: 'f1', type: 'Tráfico', severity: 'low' }] }],
        timeSlots: [{ id: 't1', startTime: '06:00', endTime: '09:00' }],
      }),
    );

    const detail = await repository.get('a/b');

    expect(api.get).toHaveBeenCalledWith('/routes/a%2Fb');
    expect(detail.segments[0].riskFactors.map((factor) => factor.id)).toEqual(['f1']);
    expect(detail.timeSlots.map((slot) => slot.id)).toEqual(['t1']);
  });

  it('creates a route and returns its id', async () => {
    expect(await repository.createRoute(ROUTE)).toBe('new');
    expect(api.post).toHaveBeenCalledWith('/routes', ROUTE);
  });

  it('updates and deletes a route', async () => {
    await repository.updateRoute('r1', ROUTE);
    await repository.deleteRoute('r1');

    expect(api.put).toHaveBeenCalledWith('/routes/r1', ROUTE);
    expect(api.delete).toHaveBeenCalledWith('/routes/r1');
  });

  it('creates, updates and deletes a segment', async () => {
    await repository.createSegment('r1', SEGMENT);
    await repository.updateSegment('r1', 's1', SEGMENT);
    await repository.deleteSegment('r1', 's1');

    expect(api.post).toHaveBeenCalledWith('/routes/r1/segments', SEGMENT);
    expect(api.put).toHaveBeenCalledWith('/routes/r1/segments/s1', SEGMENT);
    expect(api.delete).toHaveBeenCalledWith('/routes/r1/segments/s1');
  });

  it('creates, updates and deletes a time slot', async () => {
    await repository.createTimeSlot('r1', SLOT);
    await repository.updateTimeSlot('r1', 't1', SLOT);
    await repository.deleteTimeSlot('r1', 't1');

    expect(api.post).toHaveBeenCalledWith('/routes/r1/time-slots', SLOT);
    expect(api.put).toHaveBeenCalledWith('/routes/r1/time-slots/t1', SLOT);
    expect(api.delete).toHaveBeenCalledWith('/routes/r1/time-slots/t1');
  });

  it('creates, updates and deletes a risk factor of a segment', async () => {
    await repository.createRiskFactor('r1', 's1', FACTOR);
    await repository.updateRiskFactor('r1', 's1', 'f1', FACTOR);
    await repository.deleteRiskFactor('r1', 's1', 'f1');

    expect(api.post).toHaveBeenCalledWith('/routes/r1/segments/s1/risk-factors', FACTOR);
    expect(api.put).toHaveBeenCalledWith('/routes/r1/segments/s1/risk-factors/f1', FACTOR);
    expect(api.delete).toHaveBeenCalledWith('/routes/r1/segments/s1/risk-factors/f1');
  });
});
