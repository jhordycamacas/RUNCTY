import { TestBed } from '@angular/core/testing';
import { ApiError } from '../../../core/errors/api-error';
import { route, segment } from '../../../routes/domain/testing/fixtures';
import {
  RiskFactorInput,
  RouteAdminRepository,
  SegmentInput,
  TimeSlotInput,
} from '../domain/managed-route';
import {
  FakeRouteAdminRepository,
  fakeRouteAdminRepository,
  managedDetail,
} from '../testing/fake-route-admin.repository';
import { RouteDetailStore } from './route-detail.store';

const INPUT: SegmentInput = {
  name: 'Orilla',
  coordinates: [
    { lat: -3.9, lng: -79.2 },
    { lat: -3.91, lng: -79.21 },
  ],
};

describe('RouteDetailStore', () => {
  let repository: FakeRouteAdminRepository;
  let store: RouteDetailStore;

  beforeEach(() => {
    repository = fakeRouteAdminRepository();
    repository.get.mockResolvedValue(
      managedDetail(route('r1'), { segments: [{ ...segment('s1'), riskFactors: [] }] }),
    );
    TestBed.configureTestingModule({
      providers: [RouteDetailStore, { provide: RouteAdminRepository, useValue: repository }],
    });
    store = TestBed.inject(RouteDetailStore);
  });

  it('loads the route with its segments and safety', async () => {
    await store.load('r1');

    expect(repository.get).toHaveBeenCalledWith('r1');
    expect(store.detail()?.segments.map((s) => s.id)).toEqual(['s1']);
    expect(store.loading()).toBe(false);
  });

  it('keeps the error of a failed load to offer a retry', async () => {
    repository.get.mockRejectedValueOnce(
      new ApiError(404, 'route-not-found', 'La ruta ya no existe.'),
    );

    await store.load('r1');

    expect(store.detail()).toBeNull();
    expect(store.error()).toBe('La ruta ya no existe.');

    await store.reload();
    expect(store.error()).toBeNull();
    expect(store.detail()).not.toBeNull();
  });

  it('creates a segment and reloads the detail with the recalculated safety', async () => {
    await store.load('r1');

    await store.saveSegment(null, INPUT);

    expect(repository.createSegment).toHaveBeenCalledWith('r1', INPUT);
    expect(repository.get).toHaveBeenCalledTimes(2);
  });

  it('updates and deletes a segment, reloading after each change', async () => {
    await store.load('r1');

    await store.saveSegment('s1', INPUT);
    await store.deleteSegment('s1');

    expect(repository.updateSegment).toHaveBeenCalledWith('r1', 's1', INPUT);
    expect(repository.deleteSegment).toHaveBeenCalledWith('r1', 's1');
    expect(repository.get).toHaveBeenCalledTimes(3);
  });

  it('rejects with the API error and does not reload when a change fails', async () => {
    await store.load('r1');
    repository.deleteSegment.mockRejectedValueOnce(
      new ApiError(404, 'segment-not-found', 'El tramo ya no existe.'),
    );

    await expect(store.deleteSegment('s1')).rejects.toThrow('El tramo ya no existe.');
    expect(repository.get).toHaveBeenCalledOnce();
  });

  it('creates, updates and deletes a time slot, reloading the recalculated safety each time', async () => {
    const slotInput: TimeSlotInput = { startTime: '05:00', endTime: '07:00' };
    await store.load('r1');

    await store.saveTimeSlot(null, slotInput);
    await store.saveTimeSlot('t1', slotInput);
    await store.deleteTimeSlot('t1');

    expect(repository.createTimeSlot).toHaveBeenCalledWith('r1', slotInput);
    expect(repository.updateTimeSlot).toHaveBeenCalledWith('r1', 't1', slotInput);
    expect(repository.deleteTimeSlot).toHaveBeenCalledWith('r1', 't1');
    expect(repository.get).toHaveBeenCalledTimes(4);
  });

  it('creates, updates and deletes a risk factor of a segment, reloading each time', async () => {
    const factorInput: RiskFactorInput = {
      type: 'Tráfico',
      severity: 'medium',
      description: 'Cruce sin semáforo',
    };
    await store.load('r1');

    await store.saveRiskFactor('s1', null, factorInput);
    await store.saveRiskFactor('s1', 'f1', factorInput);
    await store.deleteRiskFactor('s1', 'f1');

    expect(repository.createRiskFactor).toHaveBeenCalledWith('r1', 's1', factorInput);
    expect(repository.updateRiskFactor).toHaveBeenCalledWith('r1', 's1', 'f1', factorInput);
    expect(repository.deleteRiskFactor).toHaveBeenCalledWith('r1', 's1', 'f1');
    expect(repository.get).toHaveBeenCalledTimes(4);
  });

  it('keeps the shown detail when the reload after a change fails', async () => {
    await store.load('r1');
    repository.get.mockRejectedValueOnce(new ApiError(0, 'network', 'Sin conexión.'));

    await store.saveSegment(null, INPUT);

    expect(store.detail()).not.toBeNull();
    expect(store.error()).toBe('Sin conexión.');
  });
});
