import { describe, expect, it, vi } from 'vitest';

import {
  RECENT_SIGN_IN_MAX_AGE_SEC,
  deleteUserAccount,
  isRecentSignIn,
  type DeleteAccountDeps,
} from './deleteAccount';

const NOW_MS = 1_800_000_000_000;
const nowSec = NOW_MS / 1000;

function fakeDeps(overrides: Partial<DeleteAccountDeps> = {}): DeleteAccountDeps {
  return {
    deleteUserData: vi.fn(async () => undefined),
    deleteAuthUser: vi.fn(async () => undefined),
    ...overrides,
  };
}

describe('isRecentSignIn', () => {
  it('accepts a sign-in within the allowed window', () => {
    expect(isRecentSignIn(nowSec - 30, NOW_MS)).toBe(true);
    expect(isRecentSignIn(nowSec - RECENT_SIGN_IN_MAX_AGE_SEC, NOW_MS)).toBe(true);
  });

  it('rejects an old or missing sign-in time', () => {
    expect(isRecentSignIn(nowSec - RECENT_SIGN_IN_MAX_AGE_SEC - 1, NOW_MS)).toBe(false);
    expect(isRecentSignIn(undefined, NOW_MS)).toBe(false);
    expect(isRecentSignIn('soon', NOW_MS)).toBe(false);
  });
});

describe('deleteUserAccount', () => {
  it('deletes the Firestore data first and then the auth user', async () => {
    const order: string[] = [];
    const deps = fakeDeps({
      deleteUserData: vi.fn(async () => {
        order.push('data');
      }),
      deleteAuthUser: vi.fn(async () => {
        order.push('auth');
      }),
    });

    await deleteUserAccount('u1', deps);

    expect(deps.deleteUserData).toHaveBeenCalledWith('u1');
    expect(deps.deleteAuthUser).toHaveBeenCalledWith('u1');
    // Data first: if the auth deletion fails the user can still sign in and retry.
    expect(order).toEqual(['data', 'auth']);
  });

  it('keeps the auth user when the data deletion fails', async () => {
    const deps = fakeDeps({
      deleteUserData: vi.fn(async () => {
        throw new Error('firestore down');
      }),
    });
    await expect(deleteUserAccount('u1', deps)).rejects.toThrow('firestore down');
    expect(deps.deleteAuthUser).not.toHaveBeenCalled();
  });

  it('is idempotent when the auth user is already gone', async () => {
    const deps = fakeDeps({
      deleteAuthUser: vi.fn(async () => {
        throw Object.assign(new Error('gone'), { code: 'auth/user-not-found' });
      }),
    });
    await expect(deleteUserAccount('u1', deps)).resolves.toBeUndefined();
  });

  it('propagates other auth errors', async () => {
    const deps = fakeDeps({
      deleteAuthUser: vi.fn(async () => {
        throw Object.assign(new Error('boom'), { code: 'auth/internal-error' });
      }),
    });
    await expect(deleteUserAccount('u1', deps)).rejects.toThrow('boom');
  });
});
