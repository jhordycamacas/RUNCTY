import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiClient } from '../../../core/api/api-client';
import { HttpCityAdminRepository } from './http-city-admin.repository';

describe('HttpCityAdminRepository', () => {
  const api = { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() };
  let repository: HttpCityAdminRepository;

  beforeEach(() => {
    vi.resetAllMocks();
    TestBed.configureTestingModule({
      providers: [HttpCityAdminRepository, { provide: ApiClient, useValue: api }],
    });
    repository = TestBed.inject(HttpCityAdminRepository);
  });

  it('lists every city and zone mapped to the domain', async () => {
    api.get.mockReturnValue(
      of({ cities: [{ id: 'loja', name: 'Loja', location: { lat: 1, lng: 2 }, coverage: 'active' }] }),
    );

    const cities = await repository.list();

    expect(api.get).toHaveBeenCalledWith('/cities');
    expect(cities).toEqual([
      {
        id: 'loja',
        name: 'Loja',
        province: '',
        type: 'city',
        parentCityId: null,
        lat: 1,
        lng: 2,
        coverage: 'active',
      },
    ]);
  });

  it('answers an empty list when the body has no cities', async () => {
    api.get.mockReturnValue(of({}));

    expect(await repository.list()).toEqual([]);
  });

  it('creates a city', async () => {
    api.post.mockReturnValue(of({}));
    const input = {
      id: 'cuenca',
      type: 'Región',
      name: 'Cuenca',
      province: 'Azuay',
      location: { lat: -2.9, lng: -79 },
      coverage: 'En estudio',
      parentCityId: null,
    };

    await repository.create(input);

    expect(api.post).toHaveBeenCalledWith('/cities', input);
  });

  it('updates with a PATCH on the encoded id', async () => {
    api.patch.mockReturnValue(of({}));
    const changes = {
      name: 'Centro',
      province: 'Loja',
      type: 'Zona',
      location: { lat: 1, lng: 2 },
      coverage: 'active',
      parentCityId: 'loja',
    };

    await repository.update('loja centro', changes);

    expect(api.patch).toHaveBeenCalledWith('/cities/loja%20centro', changes);
  });

  it('deletes a city', async () => {
    api.delete.mockReturnValue(of(null));

    await repository.delete('loja');

    expect(api.delete).toHaveBeenCalledWith('/cities/loja');
  });
});
