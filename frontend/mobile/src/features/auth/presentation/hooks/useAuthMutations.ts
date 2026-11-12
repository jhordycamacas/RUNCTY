import { useMutation } from '@tanstack/react-query';

import { registerUser, requestPasswordReset, signIn } from '../../application/authUseCases';
import { authGateway, userDocGateway } from '../../composition';
import type { ForgotPasswordInput, LoginInput, RegisterInput } from '../../domain';
import { useSession } from '../session/SessionProvider';

export function useRegister() {
  const { setRegistrationInProgress } = useSession();
  return useMutation({
    mutationFn: (input: RegisterInput) => {
      setRegistrationInProgress(true);
      return registerUser(input, { auth: authGateway, users: userDocGateway });
    },
    onSettled: () => setRegistrationInProgress(false),
  });
}

export function useSignIn() {
  return useMutation({
    mutationFn: (input: LoginInput) => signIn(input, { auth: authGateway }),
  });
}

export function usePasswordReset() {
  return useMutation({
    mutationFn: (input: ForgotPasswordInput) => requestPasswordReset(input, { auth: authGateway }),
  });
}
