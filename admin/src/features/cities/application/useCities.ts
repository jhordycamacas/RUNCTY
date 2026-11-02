'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { CityData } from '../domain/city';
import { createCity, deleteCity, listCities, listCityOptions, updateCity } from '../infrastructure/citiesRepository';

export const citiesQueryKey = ['cities'] as const;

export function useCities() {
  return useQuery({ queryKey: [...citiesQueryKey, 'all'], queryFn: listCities });
}

export function useCityOptions() {
  return useQuery({ queryKey: [...citiesQueryKey, 'options'], queryFn: listCityOptions, staleTime: 5 * 60_000 });
}

export function useSaveCity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, city, isNew }: { id: string; city: CityData; isNew: boolean }) =>
      isNew ? createCity(id, city) : updateCity(id, city),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: citiesQueryKey }),
  });
}

export function useDeleteCity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCity,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: citiesQueryKey }),
  });
}
