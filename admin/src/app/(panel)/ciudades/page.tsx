import type { Metadata } from 'next';

import { RequirePermission } from '@/features/auth/presentation/AdminShell';
import { CitiesScreen } from '@/features/cities/presentation/CitiesScreen';

export const metadata: Metadata = { title: 'Ciudades y zonas · RUNCTY' };

export default function CitiesPage() {
  return (
    <RequirePermission permission="cities.manage">
      <CitiesScreen />
    </RequirePermission>
  );
}
