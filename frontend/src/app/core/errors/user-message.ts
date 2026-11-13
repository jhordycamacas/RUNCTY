import { ApiError } from './api-error';
import { AuthErrorContext, mapAuthError } from './auth-errors';

/** Spanish text for any error a screen can catch: API errors first, then Firebase Auth ones. */
export function userMessage(error: unknown, context: AuthErrorContext = 'default'): string {
  return error instanceof ApiError ? error.message : mapAuthError(error, context);
}
