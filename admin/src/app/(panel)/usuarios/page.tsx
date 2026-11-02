import type { Metadata } from 'next';

import { RequirePermission } from '@/features/auth/presentation/AdminShell';
import { UsersScreen } from '@/features/users/presentation/UsersScreen';

export const metadata: Metadata = { title: 'Usuarios · RUNCTY' };

export default function UsersPage() {
  return (
    <RequirePermission permission="users.read">
      <UsersScreen />
    </RequirePermission>
  );
}
