import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ProfileStore } from '../../account/application/profile.store';
import { Profile } from '../../account/domain/profile';
import { CitiesStore } from '../../cities/application/cities.store';
import { City } from '../../cities/domain/city';
import { RunnerCity } from './runner-city';

const profile = (cityId: string | null): Profile =>
  ({ uid: 'u1', firstName: 'Ana', cityId }) as Profile;

describe('RunnerCity', () => {
  let stored: ReturnType<typeof signal<Profile | null>>;
  let profileError: ReturnType<typeof signal<string | null>>;
  let profileLoading: ReturnType<typeof signal<boolean>>;
  let cities: ReturnType<typeof signal<City[] | null>>;
  let citiesError: ReturnType<typeof signal<string | null>>;
  let profiles: {
    profile: unknown;
    error: unknown;
    loading: unknown;
    load: ReturnType<typeof vi.fn>;
  };
  let catalogue: { cities: unknown; error: unknown; byId: unknown; load: ReturnType<typeof vi.fn> };
  let city: RunnerCity;

  beforeEach(() => {
    stored = signal<Profile | null>(null);
    profileError = signal<string | null>(null);
    profileLoading = signal(false);
    cities = signal<City[] | null>(null);
    citiesError = signal<string | null>(null);
    profiles = { profile: stored, error: profileError, loading: profileLoading, load: vi.fn() };
    catalogue = {
      cities,
      error: citiesError,
      byId: () => new Map((cities() ?? []).map((c) => [c.id, c])),
      load: vi.fn(),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: ProfileStore, useValue: profiles },
        { provide: CitiesStore, useValue: catalogue },
      ],
    });
    city = TestBed.inject(RunnerCity);
  });

  it('is loading until the profile and the catalogue arrive', () => {
    expect(city.status()).toBe('loading');
    stored.set(profile('loja'));
    expect(city.status()).toBe('loading');
  });

  it('is ready with the id and name of the city', () => {
    stored.set(profile('loja'));
    cities.set([{ id: 'loja', name: 'Loja', province: null }]);

    expect(city.status()).toBe('ready');
    expect(city.cityId()).toBe('loja');
    expect(city.cityName()).toBe('Loja');
  });

  it('has no city when the profile has none or the city left the catalogue', () => {
    cities.set([{ id: 'loja', name: 'Loja', province: null }]);
    stored.set(profile(null));
    expect(city.status()).toBe('no-city');

    stored.set(profile('quito'));
    expect(city.status()).toBe('no-city');
    expect(city.cityId()).toBeNull();
  });

  it('reports a failed load as an error, never as a missing city', () => {
    profileError.set('sin conexión');
    expect(city.status()).toBe('error');
    expect(city.error()).toBe('sin conexión');

    profileError.set(null);
    stored.set(profile('loja'));
    citiesError.set('sin catálogo');
    expect(city.status()).toBe('error');
    expect(city.error()).toBe('sin catálogo');
  });

  it('does not request a profile that is there or on its way', async () => {
    profileLoading.set(true);
    await city.load();
    expect(profiles.load).not.toHaveBeenCalled();

    profileLoading.set(false);
    await city.load();
    expect(profiles.load).toHaveBeenCalledOnce();

    stored.set(profile('loja'));
    await city.load();
    expect(profiles.load).toHaveBeenCalledOnce();
    expect(catalogue.load).toHaveBeenCalledTimes(3);
  });
});
