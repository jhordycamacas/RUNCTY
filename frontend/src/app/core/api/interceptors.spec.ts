import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FirebaseAuthGateway } from '../auth/firebase-auth.gateway';
import { FakeFirebaseAuthGateway } from '../auth/testing/fake-firebase-auth.gateway';
import { ApiError } from '../errors/api-error';
import { ApiClient } from './api-client';
import { apiErrorInterceptor } from './api-error.interceptor';
import { bearerTokenInterceptor } from './bearer-token.interceptor';

describe('API interceptors', () => {
  let gateway: FakeFirebaseAuthGateway;
  let http: HttpTestingController;

  /** The token is read asynchronously, so the request reaches the backend a tick later. */
  const sentRequest = (url: string) =>
    vi.waitFor(() => {
      const [match] = http.match(url);
      if (!match) throw new Error('request not sent yet');
      return match;
    });

  beforeEach(() => {
    gateway = new FakeFirebaseAuthGateway();
    gateway.user = true;
    TestBed.configureTestingModule({
      providers: [
        { provide: FirebaseAuthGateway, useValue: gateway },
        provideHttpClient(withInterceptors([bearerTokenInterceptor, apiErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('adds Authorization: Bearer <token> when a user is signed in', async () => {
    const pending = firstValueFrom(TestBed.inject(ApiClient).get('/me'));
    const request = await sentRequest(`${environment.apiBaseUrl}/me`);

    expect(request.request.headers.get('Authorization')).toBe('Bearer token');
    request.flush({});
    await pending;
  });

  it('sends no header when nobody is signed in (public endpoints)', async () => {
    gateway.user = false;
    const pending = firstValueFrom(TestBed.inject(ApiClient).get('/cities'));
    const request = await sentRequest(`${environment.apiBaseUrl}/cities`);

    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush([]);
    await pending;
  });

  it('never sends the token to other hosts', async () => {
    const pending = firstValueFrom(TestBed.inject(HttpClient).get('https://other.example.com/x'));
    const request = await sentRequest('https://other.example.com/x');

    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
    await pending;
  });

  it('turns an API failure into an ApiError with the Spanish message', async () => {
    const pending = firstValueFrom(TestBed.inject(ApiClient).post('/roles', {}));
    const request = await sentRequest(`${environment.apiBaseUrl}/roles`);
    request.flush(
      { error: { reason: 'role-exists', message: 'x' } },
      { status: 409, statusText: 'Conflict' },
    );

    const error = await pending.catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).message).toBe('Ya existe un rol con ese identificador.');
  });

  it('sends query parameters', async () => {
    const pending = firstValueFrom(
      TestBed.inject(ApiClient).get('/users', { limit: 20, q: 'ana' }),
    );
    const request = await sentRequest(`${environment.apiBaseUrl}/users?limit=20&q=ana`);

    request.flush({});
    await pending;
  });
});
