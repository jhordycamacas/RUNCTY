import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { toApiError } from '../errors/to-api-error';

/** Turns every failed API call into an `ApiError` carrying the Spanish message of its reason. */
export const apiErrorInterceptor: HttpInterceptorFn = (request, next) => {
  const call = next(request);
  if (!request.url.startsWith(environment.apiBaseUrl)) return call;
  return call.pipe(catchError((failure) => throwError(() => toApiError(failure))));
};
