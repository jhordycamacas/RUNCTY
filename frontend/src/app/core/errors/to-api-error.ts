import { HttpErrorResponse } from '@angular/common/http';
import { ApiError } from './api-error';
import { messageForReason, NETWORK_ERROR_MESSAGE, UNEXPECTED_ERROR_MESSAGE } from './error-messages';

interface ErrorBody {
  error?: { reason?: unknown; fields?: unknown };
}

function readFields(value: unknown): Record<string, string> {
  if (typeof value !== 'object' || value === null) return {};
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
  );
}

/** Translates a failed HTTP call into an `ApiError` with a Spanish message. */
export function toApiError(failure: unknown): ApiError {
  if (failure instanceof ApiError) return failure;
  if (!(failure instanceof HttpErrorResponse)) {
    return new ApiError(0, 'unexpected', UNEXPECTED_ERROR_MESSAGE);
  }
  // Status 0: the request never got an answer (offline, CORS, server down).
  if (failure.status === 0) return new ApiError(0, 'network', NETWORK_ERROR_MESSAGE);

  const { error } = (failure.error ?? {}) as ErrorBody;
  const reason = typeof error?.reason === 'string' ? error.reason : 'unexpected';
  return new ApiError(failure.status, reason, messageForReason(reason), readFields(error?.fields));
}
