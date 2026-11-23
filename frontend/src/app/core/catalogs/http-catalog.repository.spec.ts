import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { HttpCatalogRepository } from './http-catalog.repository';

describe('HttpCatalogRepository', () => {
  let repository: HttpCatalogRepository;
  let http: HttpTestingController;
  const url = (path: string) => `${environment.apiBaseUrl}${path}`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HttpCatalogRepository, provideHttpClient(), provideHttpClientTesting()],
    });
    repository = TestBed.inject(HttpCatalogRepository);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists a catalog with its inactive options, sorted by order', async () => {
    const listing = repository.list('sportLevels');
    const request = http.expectOne(url('/catalogs/sportLevels'));
    expect(request.request.method).toBe('GET');
    request.flush({
      id: 'sportLevels',
      items: [
        { code: 'b', label: 'B', order: 2, active: false },
        { code: 'a', label: 'A', order: 1, active: true },
      ],
    });

    expect((await listing).map((item) => item.code)).toEqual(['a', 'b']);
  });

  it('replaces a catalog with a PUT of the items and answers what the server stored', async () => {
    const items = [{ code: 'a', label: 'A', order: 1, active: true }];
    const saving = repository.save('sportGoals', items);
    const request = http.expectOne(url('/catalogs/sportGoals'));
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ items });
    request.flush({ id: 'sportGoals', items });

    expect(await saving).toEqual(items);
  });
});
