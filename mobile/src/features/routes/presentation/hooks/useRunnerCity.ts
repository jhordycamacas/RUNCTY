import { useProfile } from '@/features/account/presentation/hooks/useAccount';
import { useSignedInUser } from '@/features/auth';
import { useActiveCities } from '@/features/cities/application/useActiveCities';

export interface RunnerCity {
  /** Null when the profile has no city yet. */
  cityId: string | null;
  cityName: string | null;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

/** City of the signed-in runner (`users/{uid}.cityId`) with its display name. */
export function useRunnerCity(): RunnerCity {
  const user = useSignedInUser();
  const profile = useProfile(user.uid);
  const cities = useActiveCities();
  const cityId = profile.data?.cityId || null;

  return {
    cityId,
    cityName: cities.data?.find((city) => city.id === cityId)?.name ?? null,
    isLoading: profile.isPending,
    isError: profile.isError,
    refetch: () => void profile.refetch(),
  };
}
