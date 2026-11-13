import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FirebaseAuthGateway } from '../auth/firebase-auth.gateway';

/** Adds the Firebase ID token to the API calls; other hosts never receive it. */
export const bearerTokenInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.startsWith(environment.apiBaseUrl)) return next(request);

  return from(inject(FirebaseAuthGateway).getIdToken()).pipe(
    switchMap((token) =>
      next(token ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : request),
    ),
  );
};
