import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { sportProfileRepository } from '../../composition';
import type { SportProfile } from '../../domain/sportProfile';

const sportProfileQueryKey = (uid: string) => ['sportProfile', uid] as const;

/** RF-01-10 */
export function useSportProfile(uid: string) {
  return useQuery({
    queryKey: sportProfileQueryKey(uid),
    queryFn: () => sportProfileRepository.get(uid),
  });
}

/** RF-01-9 / RF-01-11 */
export function useSaveSportProfile(uid: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (profile: SportProfile) => sportProfileRepository.save(uid, profile),
    onSuccess: (_result, profile) => queryClient.setQueryData(sportProfileQueryKey(uid), profile),
  });
}

/** RF-01-12 */
export function useDeleteSportProfile(uid: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => sportProfileRepository.remove(uid),
    onSuccess: () => queryClient.setQueryData(sportProfileQueryKey(uid), null),
  });
}
