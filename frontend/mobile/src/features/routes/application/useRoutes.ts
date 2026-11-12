import { useQuery } from '@tanstack/react-query';

import { routeRepository } from '../composition';

const routesQueryKeys = {
  byCity: (cityId: string) => ['routes', 'city', cityId] as const,
  detail: (routeId: string) => ['routes', 'detail', routeId] as const,
  segments: (routeId: string) => ['routes', 'segments', routeId] as const,
};

/** Active routes of the runner's city. Disabled until the city is known. */
export function useCityRoutes(cityId: string | null | undefined) {
  return useQuery({
    queryKey: routesQueryKeys.byCity(cityId ?? ''),
    queryFn: () => routeRepository.listActiveByCity(cityId as string),
    enabled: Boolean(cityId),
    staleTime: 5 * 60_000,
  });
}

export function useRouteDetail(routeId: string) {
  return useQuery({
    queryKey: routesQueryKeys.detail(routeId),
    queryFn: () => routeRepository.getById(routeId),
    staleTime: 5 * 60_000,
  });
}

export function useRouteSegments(routeId: string) {
  return useQuery({
    queryKey: routesQueryKeys.segments(routeId),
    queryFn: () => routeRepository.listSegments(routeId),
    staleTime: 5 * 60_000,
  });
}
