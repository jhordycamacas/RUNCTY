import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { HttpProfilePhotoRepository } from './http-profile-photo.repository';

const PHOTO = 'data:image/jpeg;base64,AAAA';

describe('HttpProfilePhotoRepository', () => {
  let repository: HttpProfilePhotoRepository;
  let http: HttpTestingController;
  const url = `${environment.apiBaseUrl}/users/me/photo`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HttpProfilePhotoRepository, provideHttpClient(), provideHttpClientTesting()],
    });
    repository = TestBed.inject(HttpProfilePhotoRepository);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('gets the photo', async () => {
    const reading = repository.get();
    const request = http.expectOne(url);
    expect(request.request.method).toBe('GET');
    request.flush({ photo: PHOTO });

    expect(await reading).toBe(PHOTO);
  });

  it('answers null when there is no photo', async () => {
    const reading = repository.get();
    http.expectOne(url).flush({ photo: null });

    expect(await reading).toBeNull();
  });

  it('puts the data URL and answers what the server stored', async () => {
    const saving = repository.save(PHOTO);
    const request = http.expectOne(url);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ photo: PHOTO });
    request.flush({ photo: PHOTO });

    expect(await saving).toBe(PHOTO);
  });

  it('deletes the photo', async () => {
    const removing = repository.remove();
    const request = http.expectOne(url);
    expect(request.request.method).toBe('DELETE');
    request.flush(null, { status: 204, statusText: 'No Content' });

    await expect(removing).resolves.toBeUndefined();
  });
});
