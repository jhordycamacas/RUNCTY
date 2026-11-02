'use client';

import { callFunction } from '@/core/firebase/client';

import type { UserFilters, UserSearchPage } from '../domain/userSearch';

export const PAGE_SIZE = 20;

/** RF-01-2 through the `searchUsers` callable (requires users.read). */
export function searchUsers(filters: UserFilters, cursor: string | null): Promise<UserSearchPage> {
  return callFunction<UserFilters & { limit: number; cursor?: string }, UserSearchPage>('searchUsers', {
    ...filters,
    limit: PAGE_SIZE,
    ...(cursor ? { cursor } : {}),
  });
}
