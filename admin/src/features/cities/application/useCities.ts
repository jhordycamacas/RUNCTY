'use client';

import { useQuery } from '@tanstack/react-query';

import { listCityOptions } from '../infrastructure/citiesRepository';

export const citiesQueryKey = ['cities'] as const;

export function useCityOptions() {
  return useQuery({ queryKey: [...citiesQueryKey, 'options'], queryFn: listCityOptions, staleTime: 5 * 60_000 });
}
