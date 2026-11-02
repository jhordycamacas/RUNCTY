import { useQuery } from '@tanstack/react-query';

import { cityRepository } from '../composition';

export const citiesQueryKey = ['cities', 'active'] as const;

/** Active cities for pickers (sign-up, profile). Public catalog data. */
export function useActiveCities() {
  return useQuery({
    queryKey: citiesQueryKey,
    queryFn: () => cityRepository.listActive(),
    staleTime: 10 * 60_000,
  });
}
