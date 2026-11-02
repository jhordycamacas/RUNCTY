import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getPreferences, resetPreferences, savePreferences } from '../../application/preferencesUseCases';
import { preferencesDeps } from '../../composition';
import type { Preferences } from '../../domain';

const preferencesQueryKey = (uid: string) => ['preferences', uid] as const;

/** RF-01-14: Firestore preferences, or the defaults when there is no doc. */
export function usePreferences(uid: string | null) {
  return useQuery({
    queryKey: preferencesQueryKey(uid ?? ''),
    queryFn: () => getPreferences(uid ?? '', preferencesDeps),
    enabled: uid !== null,
  });
}

/** RF-01-13 / RF-01-15 */
export function useSavePreferences(uid: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (preferences: Preferences) => savePreferences(uid, preferences, preferencesDeps),
    onSuccess: (_result, preferences) => queryClient.setQueryData(preferencesQueryKey(uid), preferences),
  });
}

/** RF-01-16 */
export function useResetPreferences(uid: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => resetPreferences(uid, preferencesDeps),
    onSuccess: (defaults) => queryClient.setQueryData(preferencesQueryKey(uid), defaults),
  });
}
