import { UNEXPECTED_ERROR_MESSAGE, messageForReason } from './error-messages';

describe('messageForReason', () => {
  it.each([
    'role-exists',
    'role-has-users',
    'system-role',
    'admin-permissions',
    'permission-escalation',
    'last-admin',
    'self-lockout',
    'user-profile-missing',
    'invalid-cursor',
    'city-exists',
    'city-has-routes',
    'city-has-zones',
    'invalid-parent-city',
  ])('has a Spanish message for "%s"', (reason) => {
    expect(messageForReason(reason)).not.toBe(UNEXPECTED_ERROR_MESSAGE);
  });

  it('names the identifier when a city or zone already exists', () => {
    expect(messageForReason('city-exists')).toContain('identificador');
  });

  it('falls back to the generic message for an unknown code', () => {
    expect(messageForReason('something-new')).toBe(UNEXPECTED_ERROR_MESSAGE);
  });
});
