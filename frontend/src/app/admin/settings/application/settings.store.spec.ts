import { TestBed } from '@angular/core/testing';
import { ApiError } from '../../../core/errors/api-error';
import { DEFAULT_SETTINGS, SettingsRepository } from '../domain/system-settings';
import {
  FakeSettingsRepository,
  fakeSettingsRepository,
} from '../testing/fake-settings.repository';
import { SettingsStore } from './settings.store';

describe('SettingsStore', () => {
  let repository: FakeSettingsRepository;
  let store: SettingsStore;

  beforeEach(() => {
    repository = fakeSettingsRepository();
    TestBed.configureTestingModule({
      providers: [SettingsStore, { provide: SettingsRepository, useValue: repository }],
    });
    store = TestBed.inject(SettingsStore);
  });

  it('has nothing until the parameters are loaded', async () => {
    expect(store.settings()).toBeNull();

    await store.load();

    expect(store.settings()).toEqual(DEFAULT_SETTINGS);
    expect(store.error()).toBeNull();
  });

  it('keeps the message when loading fails and clears it on the next try', async () => {
    repository.load.mockRejectedValueOnce(new ApiError(0, 'network', 'Sin conexión.'));

    await store.load();
    expect(store.error()).toBe('Sin conexión.');
    expect(store.settings()).toBeNull();

    await store.load();
    expect(store.error()).toBeNull();
    expect(store.settings()).toEqual(DEFAULT_SETTINGS);
  });

  it('keeps what the server answers after saving and returns the recalculated count', async () => {
    repository.save.mockResolvedValue({
      settings: { ...DEFAULT_SETTINGS, penaltyHigh: 50 },
      recalculated: 3,
    });

    expect(await store.save({ penaltyHigh: 50 })).toBe(3);

    expect(repository.save).toHaveBeenCalledWith({ penaltyHigh: 50 });
    expect(store.settings()?.penaltyHigh).toBe(50);
  });

  it('lets a rejection through and keeps the previous parameters', async () => {
    await store.load();
    const rejection = new ApiError(400, 'invalid-argument', 'Revisa los campos.', { timeZone: 'invalid-time-zone' });
    repository.save.mockRejectedValueOnce(rejection);

    await expect(store.save({ timeZone: 'Mars/Base' })).rejects.toBe(rejection);

    expect(store.settings()).toEqual(DEFAULT_SETTINGS);
  });

  it('recalculates the routes and returns how many', async () => {
    repository.recalculateRoutes.mockResolvedValue(9);

    expect(await store.recalculate()).toBe(9);
  });
});
