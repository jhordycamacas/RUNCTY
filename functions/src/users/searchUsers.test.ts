import { describe, expect, it, vi } from 'vitest';

import { DomainError } from '../shared/errors';
import {
  MAX_PAGE_SIZE,
  buildEqualityFilters,
  matchesNamePrefixes,
  normalizeName,
  parseSearchUsersInput,
  searchUsers,
  toUserSummary,
  type SearchUsersDeps,
  type StoredUser,
} from './searchUsers';

function user(id: string, firstName: string, lastName: string, extra: Partial<StoredUser['data']> = {}): StoredUser {
  return {
    id,
    data: {
      uid: id,
      email: `${id}@runcty.dev`,
      firstName,
      lastName,
      birthDate: '1990-01-01',
      cityId: 'loja',
      role: 'runner',
      idNumber: '1104567890',
      consent: { lopdp: true },
      ...extra,
    },
  };
}

describe('parseSearchUsersInput', () => {
  it('trims filters, lowercases the email and caps the page size', () => {
    expect(parseSearchUsersInput({ firstName: ' Ana ', email: ' Ana@RUNCTY.dev ', limit: 500 })).toEqual({
      filters: { firstName: 'Ana', email: 'ana@runcty.dev' },
      limit: MAX_PAGE_SIZE,
      cursor: undefined,
    });
  });

  it('drops empty filters and defaults the page size', () => {
    expect(parseSearchUsersInput({ lastName: '   ', cityId: '' })).toEqual({ filters: {}, limit: 20, cursor: undefined });
    expect(parseSearchUsersInput(undefined)).toEqual({ filters: {}, limit: 20, cursor: undefined });
  });

  it('rejects malformed filters', () => {
    expect(() => parseSearchUsersInput({ birthDate: '01/01/1990' })).toThrow(DomainError);
    expect(() => parseSearchUsersInput({ idNumber: '123' })).toThrow(DomainError);
    expect(() => parseSearchUsersInput({ firstName: 42 })).toThrow(DomainError);
    expect(() => parseSearchUsersInput({ limit: 0 })).toThrow(DomainError);
    expect(() => parseSearchUsersInput({ cursor: 5 })).toThrow(DomainError);
  });
});

describe('buildEqualityFilters', () => {
  it('maps exact-match filters to Firestore equality filters', () => {
    expect(
      buildEqualityFilters({ email: 'a@b.ec', idNumber: '1104567890', birthDate: '1990-01-01', cityId: 'loja', firstName: 'Ana' }),
    ).toEqual([
      ['email', 'a@b.ec'],
      ['idNumber', '1104567890'],
      ['birthDate', '1990-01-01'],
      ['cityId', 'loja'],
    ]);
  });
});

describe('name matching', () => {
  it('normalizes case and accents', () => {
    expect(normalizeName('  JOSÉ Ñandú ')).toBe('jose nandu');
  });

  it('matches case- and accent-insensitive prefixes', () => {
    const data = user('u1', 'José', 'Ordóñez').data;
    expect(matchesNamePrefixes(data, { firstName: 'jos', lastName: 'ORDO' })).toBe(true);
    expect(matchesNamePrefixes(data, { firstName: 'ose' })).toBe(false);
    expect(matchesNamePrefixes(data, {})).toBe(true);
  });
});

describe('toUserSummary', () => {
  it('returns only the fields the admin panel needs', () => {
    expect(toUserSummary(user('u1', 'Ana', 'Paz'))).toEqual({
      uid: 'u1',
      email: 'u1@runcty.dev',
      firstName: 'Ana',
      lastName: 'Paz',
      birthDate: '1990-01-01',
      cityId: 'loja',
      role: 'runner',
    });
  });
});

describe('searchUsers', () => {
  const all = [user('a', 'Ana', 'Paz'), user('b', 'Bruno', 'Ríos'), user('c', 'Andrés', 'Loja'), user('d', 'Ángela', 'Mora')];

  function pagedDeps(docs: StoredUser[]): SearchUsersDeps {
    return {
      scan: vi.fn(async (_filters, startAfter: string | undefined, batchSize: number) => {
        const from = startAfter ? docs.findIndex((d) => d.id === startAfter) + 1 : 0;
        return docs.slice(from, from + batchSize);
      }),
    };
  }

  it('passes the equality filters to the scan', async () => {
    const deps = pagedDeps(all);
    await searchUsers({ filters: { cityId: 'loja' }, limit: 10 }, deps);
    expect(deps.scan).toHaveBeenCalledWith([['cityId', 'loja']], undefined, expect.any(Number));
  });

  it('filters names in memory and paginates with a cursor', async () => {
    const deps = pagedDeps(all);
    const first = await searchUsers({ filters: { firstName: 'an' }, limit: 2 }, deps);
    expect(first.users.map((u) => u.uid)).toEqual(['a', 'c']);
    expect(first.nextCursor).toBe('c');

    const second = await searchUsers({ filters: { firstName: 'an' }, limit: 2, cursor: first.nextCursor ?? undefined }, deps);
    expect(second.users.map((u) => u.uid)).toEqual(['d']);
    expect(second.nextCursor).toBeNull();
  });

  it('stops at the scan budget and returns a cursor to continue', async () => {
    const many = Array.from({ length: 30 }, (_, i) => user(`u${String(i).padStart(2, '0')}`, 'Zoe', 'X'));
    const deps = pagedDeps(many);
    const result = await searchUsers({ filters: { firstName: 'ana' }, limit: 5 }, deps, { batchSize: 10, maxScanned: 20 });
    expect(result.users).toEqual([]);
    expect(result.nextCursor).toBe('u19');
  });
});
