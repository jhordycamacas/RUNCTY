import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { PersonalData } from '@/features/auth';

import { changePassword, deleteAccount, updatePersonalData } from '../../application/accountUseCases';
import { accountGateway, authGateway, profileRepository } from '../../composition';
import type { ChangePasswordInput, DeleteAccountInput } from '../../domain';

const profileQueryKey = (uid: string) => ['profile', uid] as const;

export function useProfile(uid: string) {
  return useQuery({
    queryKey: profileQueryKey(uid),
    queryFn: () => profileRepository.get(uid),
  });
}

export function useUpdatePersonalData(uid: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PersonalData) => updatePersonalData(uid, data, { profiles: profileRepository }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: profileQueryKey(uid) }),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: ChangePasswordInput) => changePassword(input, { auth: authGateway }),
  });
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: (input: DeleteAccountInput) =>
      deleteAccount(input, { auth: authGateway, account: accountGateway }),
  });
}
