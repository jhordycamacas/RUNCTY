import { describe, expect, it } from 'vitest';

import { COLLECTIONS, USER_PRIVATE_DOCS } from './config';

describe('config constants', () => {
  it('exposes the collection names used by the security rules', () => {
    expect(COLLECTIONS).toEqual({ users: 'users', cities: 'cities', roles: 'roles' });
    expect(USER_PRIVATE_DOCS.preferences).toBe('preferences');
  });
});
