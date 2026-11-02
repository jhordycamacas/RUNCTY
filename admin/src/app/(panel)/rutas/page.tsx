import type { Metadata } from 'next';

import { RequirePermission } from '@/features/auth/presentation/AdminShell';
import { RoutesScreen } from '@/features/routes/presentation/RoutesScreen';

export const metadata: Metadata = { title: 'Rutas · RUNCTY' };

export default function RoutesPage() {
  return (
    <RequirePermission permission="routes.manage">
      <RoutesScreen />
    </RequirePermission>
  );
}
