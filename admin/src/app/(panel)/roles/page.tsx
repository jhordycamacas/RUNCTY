import type { Metadata } from 'next';

import { RequirePermission } from '@/features/auth/presentation/AdminShell';
import { RolesScreen } from '@/features/roles/presentation/RolesScreen';

export const metadata: Metadata = { title: 'Roles · RUNCTY' };

export default function RolesPage() {
  return (
    <RequirePermission permission="roles.manage">
      <RolesScreen />
    </RequirePermission>
  );
}
