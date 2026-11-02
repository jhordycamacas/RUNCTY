'use client';

import { useInfiniteQuery } from '@tanstack/react-query';

import type { UserFilters } from '../domain/userSearch';
import { searchUsers } from '../infrastructure/usersApi';

/** Paginated search; `filters` null means the admin has not searched yet. */
export function useUserSearch(filters: UserFilters | null) {
  return useInfiniteQuery({
    queryKey: ['users', 'search', filters],
    queryFn: ({ pageParam }) => searchUsers(filters ?? {}, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: filters !== null,
  });
}
