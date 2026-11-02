'use client';

import { useState } from 'react';

import { callableErrorMessage } from '@/core/errors/errorMessages';
import { Button } from '@/core/ui/Button';
import type { Role } from '@/features/roles/domain/role';
import { useSetUserRole } from '@/features/roles/application/useRoles';

import { fullName, type UserSummary } from '../domain/userSearch';

interface UsersTableProps {
  users: UserSummary[];
  cityNames: Map<string, string>;
  roles: Role[];
  canManageRoles: boolean;
}

export function UsersTable({ users, cityNames, roles, canManageRoles }: UsersTableProps) {
  const roleNames = new Map(roles.map((r) => [r.id, r.name]));
  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-white">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Resultados de la búsqueda de usuarios</caption>
        <thead className="border-b border-line bg-surface text-xs uppercase text-muted">
          <tr>
            <th scope="col" className="px-4 py-3">Nombre</th>
            <th scope="col" className="px-4 py-3">Correo</th>
            <th scope="col" className="px-4 py-3">Nacimiento</th>
            <th scope="col" className="px-4 py-3">Ciudad</th>
            <th scope="col" className="px-4 py-3">Rol</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.uid} className="border-b border-line last:border-0">
              <td className="px-4 py-3 font-medium text-ink">{fullName(user)}</td>
              <td className="px-4 py-3">{user.email}</td>
              <td className="px-4 py-3">{user.birthDate || '—'}</td>
              <td className="px-4 py-3">{cityNames.get(user.cityId) ?? (user.cityId || '—')}</td>
              <td className="px-4 py-3">
                {canManageRoles && roles.length > 0 ? (
                  <RoleCell user={user} roles={roles} />
                ) : (
                  (roleNames.get(user.role) ?? user.role) || 'Sin rol'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RoleCell({ user, roles }: { user: UserSummary; roles: Role[] }) {
  const [roleId, setRoleId] = useState(user.role);
  const mutation = useSetUserRole();
  const changed = roleId !== user.role;
  const selectId = `role-${user.uid}`;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <label htmlFor={selectId} className="sr-only">
          Rol de {fullName(user)}
        </label>
        <select
          id={selectId}
          value={roleId}
          onChange={(e) => {
            mutation.reset();
            setRoleId(e.target.value);
          }}
          className="min-h-11 rounded-md border border-line bg-white px-2 text-sm focus-visible:outline-2 focus-visible:outline-ink"
        >
          {roles.some((r) => r.id === user.role) ? null : <option value={user.role}>{user.role || 'Sin rol'}</option>}
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        {changed ? (
          <Button loading={mutation.isPending} onClick={() => mutation.mutate({ uid: user.uid, roleId })}>
            Aplicar
          </Button>
        ) : null}
      </div>
      {mutation.isError ? <p className="text-xs font-medium text-primary">{callableErrorMessage(mutation.error)}</p> : null}
      {mutation.isSuccess && !changed ? <p className="text-xs text-success">Rol actualizado.</p> : null}
    </div>
  );
}
