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

  it('translates the route, segment, time slot and risk factor reasons', () => {
    const reasons = [
      'invalid-route-name',
      'invalid-route-description',
      'invalid-route-start',
      'invalid-route-end',
      'invalid-distance',
      'invalid-elevation-gain',
      'invalid-surface',
      'invalid-difficulty',
      'invalid-active',
      'invalid-route-id',
      'invalid-segment-id',
      'invalid-segment-name',
      'invalid-coordinates',
      'invalid-segment-order',
      'invalid-time-slot-id',
      'invalid-slot-label',
      'invalid-start-time',
      'invalid-end-time',
      'invalid-time-range',
      'invalid-valid-from',
      'invalid-valid-to',
      'invalid-date-range',
      'invalid-risk-factor-id',
      'invalid-factor-type',
      'invalid-severity',
      'invalid-factor-description',
      'route-not-found',
      'segment-not-found',
      'time-slot-not-found',
      'risk-factor-not-found',
      'too-many-segments',
      'too-many-time-slots',
      'too-many-risk-factors',
      'time-slot-overlap',
    ];
    for (const reason of reasons) {
      expect(callableErrorMessage({ code: 'functions/invalid-argument', details: { reason } }), reason).not.toMatch(
        /no son válidos|inesperado/,
      );
    }
    expect(callableErrorMessage({ code: 'functions/failed-precondition', details: { reason: 'time-slot-overlap' } })).toMatch(
      /se cruza/,
    );
    expect(callableErrorMessage({ code: 'functions/failed-precondition', details: { reason: 'too-many-segments' } })).toMatch(/50/);
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
