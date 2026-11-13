import { HttpErrorResponse } from '@angular/common/http';
import { ApiError } from './api-error';
import { NETWORK_ERROR_MESSAGE, UNEXPECTED_ERROR_MESSAGE } from './error-messages';
import { toApiError } from './to-api-error';

const failure = (status: number, error: unknown) => new HttpErrorResponse({ status, error });

describe('toApiError', () => {
  it('maps a known reason to its Spanish message', () => {
    const error = toApiError(failure(409, { error: { reason: 'role-exists', message: 'x' } }));

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(409);
    expect(error.reason).toBe('role-exists');
    expect(error.message).toBe('Ya existe un rol con ese identificador.');
  });

  it('keeps the per-field reasons of a rejected body', () => {
    const error = toApiError(
      failure(400, {
        error: { reason: 'invalid-argument', fields: { name: 'max-length', 'a.b': 'invalid-format', n: 3 } },
      }),
    );

    expect(error.fields).toEqual({ name: 'max-length', 'a.b': 'invalid-format' });
  });

  it('falls back to the generic message for an unknown reason', () => {
    const error = toApiError(failure(500, { error: { reason: 'brand-new-code' } }));

    expect(error.reason).toBe('brand-new-code');
    expect(error.message).toBe(UNEXPECTED_ERROR_MESSAGE);
  });

  it('survives a body that is not the API error shape', () => {
    expect(toApiError(failure(502, '<html>bad gateway</html>')).message).toBe(UNEXPECTED_ERROR_MESSAGE);
    expect(toApiError(failure(500, null)).reason).toBe('unexpected');
  });

  it('reports a network failure when the server cannot be reached', () => {
    const error = toApiError(failure(0, new ProgressEvent('error')));

    expect(error.status).toBe(0);
    expect(error.reason).toBe('network');
    expect(error.message).toBe(NETWORK_ERROR_MESSAGE);
  });

  it('returns an ApiError untouched and wraps anything else', () => {
    const original = new ApiError(403, 'permission-denied', 'x');

    expect(toApiError(original)).toBe(original);
    expect(toApiError(new Error('boom')).reason).toBe('unexpected');
  });
});
