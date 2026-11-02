'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { RouteInput } from '../domain/route';
import type { RiskFactorInput, TimeSlotInput } from '../domain/schedule';
import type { SegmentInput } from '../domain/segment';
import * as repo from '../infrastructure/routesRepository';

/** Every mutation can change the computed safety, so all route queries share this prefix. */
export const routesQueryKey = ['routes'] as const;

export function useRoutes() {
  return useQuery({ queryKey: [...routesQueryKey, 'list'], queryFn: repo.listRoutes });
}

export function useRoute(routeId: string) {
  return useQuery({ queryKey: [...routesQueryKey, 'detail', routeId], queryFn: () => repo.getRoute(routeId) });
}

export function useSegments(routeId: string) {
  return useQuery({ queryKey: [...routesQueryKey, 'segments', routeId], queryFn: () => repo.listSegments(routeId) });
}

export function useTimeSlots(routeId: string) {
  return useQuery({ queryKey: [...routesQueryKey, 'timeSlots', routeId], queryFn: () => repo.listTimeSlots(routeId) });
}

export function useRiskFactors(routeId: string, segmentId: string) {
  return useQuery({
    queryKey: [...routesQueryKey, 'riskFactors', routeId, segmentId],
    queryFn: () => repo.listRiskFactors(routeId, segmentId),
  });
}

/** Mutation that refreshes every route query (lists, detail, safety) on success. */
function useRoutesMutation<Vars, Res>(mutationFn: (vars: Vars) => Promise<Res>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: routesQueryKey }),
  });
}

type RouteVars = { id?: string; input: RouteInput };

export const useSaveRoute = () =>
  useRoutesMutation(
    ({ id, input }: RouteVars): Promise<{ ok: true; id?: string }> => (id ? repo.updateRoute(id, input) : repo.createRoute(input)),
  );
export const useDeleteRoute = () => useRoutesMutation(repo.deleteRoute);

export const useSaveSegment = () =>
  useRoutesMutation(({ routeId, segmentId, input }: { routeId: string; segmentId?: string; input: SegmentInput }) =>
    segmentId ? repo.updateSegment({ routeId, segmentId }, input) : repo.createSegment(routeId, input),
  );
export const useDeleteSegment = () => useRoutesMutation(repo.deleteSegment);

export const useSaveTimeSlot = () =>
  useRoutesMutation(({ routeId, slotId, input }: { routeId: string; slotId?: string; input: TimeSlotInput }) =>
    slotId ? repo.updateTimeSlot({ routeId, slotId }, input) : repo.createTimeSlot(routeId, input),
  );
export const useDeleteTimeSlot = () => useRoutesMutation(repo.deleteTimeSlot);

export const useSaveRiskFactor = () =>
  useRoutesMutation(
    ({ routeId, segmentId, factorId, input }: { routeId: string; segmentId: string; factorId?: string; input: RiskFactorInput }) =>
      factorId
        ? repo.updateRiskFactor({ routeId, segmentId, factorId }, input)
        : repo.createRiskFactor({ routeId, segmentId }, input),
  );
export const useDeleteRiskFactor = () => useRoutesMutation(repo.deleteRiskFactor);
