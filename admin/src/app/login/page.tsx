import type { Metadata } from 'next';

import { LoginScreen } from '@/features/auth/presentation/LoginScreen';

export const metadata: Metadata = { title: 'Iniciar sesión · RUNCTY' };

export default function LoginPage() {
  return <LoginScreen />;
}
