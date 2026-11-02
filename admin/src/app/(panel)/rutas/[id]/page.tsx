import type { Metadata } from 'next';

import { RequirePermission } from '@/features/auth/presentation/AdminShell';
import { RouteDetailScreen } from '@/features/routes/presentation/RouteDetailScreen';

export const metadata: Metadata = { title: 'Detalle de ruta · RUNCTY' };

export default async function RouteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <RequirePermission permission="routes.manage">
      <RouteDetailScreen routeId={id} />
    </RequirePermission>
  );
}
