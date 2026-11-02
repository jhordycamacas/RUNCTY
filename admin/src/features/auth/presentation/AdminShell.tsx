'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { hasPermission, type AccessClaims, type Permission } from '@/core/permissions/permissions';
import { Button } from '@/core/ui/Button';
import { LoadingText } from '@/core/ui/feedback';

import { signOutAdmin } from '../infrastructure/firebaseAdminAuth';
import { useSession } from './SessionProvider';

const NAV: { href: string; label: string; permission: Permission }[] = [
  { href: '/usuarios', label: 'Usuarios', permission: 'users.read' },
  { href: '/roles', label: 'Roles', permission: 'roles.manage' },
  { href: '/ciudades', label: 'Ciudades y zonas', permission: 'cities.manage' },
  { href: '/rutas', label: 'Rutas', permission: 'routes.manage' },
];

/** Protected layout: requires a session with admin.access, then shows the sidebar. */
export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { status, session } = useSession();

  useEffect(() => {
    if (status === 'signedOut') router.replace('/login');
  }, [status, router]);

  if (status !== 'signedIn') {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <LoadingText label="Verificando sesión…" />
      </main>
    );
  }

  const items = NAV.filter((item) => hasPermission(session.claims, item.permission));

  return (
    <div className="flex min-h-screen bg-surface">
      <aside className="flex w-60 shrink-0 flex-col border-r border-line bg-white">
        <div className="border-b border-line px-5 py-4">
          <p className="text-sm font-bold tracking-widest text-brand">RUNCTY</p>
          <p className="text-xs text-muted">Administración</p>
        </div>
        <nav aria-label="Secciones" className="flex-1 p-3">
          <ul className="flex flex-col gap-1">
            {items.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={`flex min-h-11 items-center rounded-md px-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-ink ${
                      active ? 'bg-danger-soft text-primary-hover' : 'text-ink hover:bg-surface'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="border-t border-line p-4">
          <p className="truncate text-xs text-muted" title={session.email}>
            {session.email}
          </p>
          <Button variant="secondary" className="mt-2 w-full" onClick={() => void signOutAdmin()}>
            Cerrar sesión
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-x-auto p-8">{children}</main>
    </div>
  );
}

/** Section guard: renders children only with the permission. */
export function RequirePermission({ permission, children }: { permission: Permission; children: ReactNode }) {
  const { session } = useSession();
  if (!hasPermission(session?.claims ?? null, permission)) {
    return <p className="text-sm text-muted">No tienes permiso para ver esta sección.</p>;
  }
  return <>{children}</>;
}

export function useClaims(): AccessClaims | null {
  return useSession().session?.claims ?? null;
}
