import { describe, expect, it } from 'vitest';

import { authErrorMessage, callableErrorMessage } from './errorMessages';

describe('callableErrorMessage', () => {
  it('translates the reason sent by the callables', () => {
    expect(callableErrorMessage({ code: 'functions/failed-precondition', details: { reason: 'role-has-users' } })).toMatch(
      /usuarios asignados/,
    );
    expect(callableErrorMessage({ code: 'functions/failed-precondition', details: { reason: 'self-lockout' } })).toMatch(
      /propio rol/,
    );
  });

  it('falls back to the error code', () => {
    expect(callableErrorMessage({ code: 'functions/permission-denied' })).toMatch(/permiso/);
    expect(callableErrorMessage({ code: 'functions/unavailable' })).toMatch(/conexión/);
    expect(callableErrorMessage(new Error('boom'))).toMatch(/inesperado/);
  });
});

describe('authErrorMessage', () => {
  it('uses a neutral message for wrong credentials', () => {
    expect(authErrorMessage({ code: 'auth/invalid-credential' })).toBe('Correo o contraseña incorrectos.');
    expect(authErrorMessage({ code: 'auth/user-not-found' })).toBe('Correo o contraseña incorrectos.');
  });

  it('explains rate limiting and network errors', () => {
    expect(authErrorMessage({ code: 'auth/too-many-requests' })).toMatch(/intentos/);
    expect(authErrorMessage({ code: 'auth/network-request-failed' })).toMatch(/conexión/);
    expect(authErrorMessage(null)).toMatch(/inesperado/);
  });
});
