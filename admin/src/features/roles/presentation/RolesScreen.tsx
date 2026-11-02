'use client';

import { useState } from 'react';

import { callableErrorMessage } from '@/core/errors/errorMessages';
import { permissionLabel } from '@/core/permissions/permissions';
import { Button } from '@/core/ui/Button';
import { ConfirmDialog } from '@/core/ui/ConfirmDialog';
import { Alert, Badge, LoadingText, PageHeader } from '@/core/ui/feedback';

import { useDeleteRole, useRoles } from '../application/useRoles';
import { canDeleteRole, type Role } from '../domain/role';
import { RoleForm } from './RoleForm';

type Editing = { mode: 'create' } | { mode: 'edit'; role: Role } | null;

/** RF-02-1..4: list, create, edit permissions and delete roles. */
export function RolesScreen() {
  const roles = useRoles();
  const remove = useDeleteRole();
  const [editing, setEditing] = useState<Editing>(null);
  const [toDelete, setToDelete] = useState<Role | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await remove.mutateAsync(toDelete.id);
      setNotice(`Rol "${toDelete.name}" eliminado.`);
      setToDelete(null);
    } catch {
      // Shown in the dialog.
    }
  }

  return (
    <section>
      <PageHeader
        title="Roles"
        description="Define qué puede hacer cada tipo de usuario. Solo se elimina un rol sin usuarios asignados."
        actions={
          editing ? null : (
            <Button
              onClick={() => {
                setNotice(null);
                setEditing({ mode: 'create' });
              }}
            >
              Nuevo rol
            </Button>
          )
        }
      />

      {notice ? (
        <div className="mb-4">
          <Alert tone="success">{notice}</Alert>
        </div>
      ) : null}

      {editing ? (
        <div className="mb-6">
          <RoleForm
            key={editing.mode === 'edit' ? editing.role.id : 'new'}
            role={editing.mode === 'edit' ? editing.role : undefined}
            onCancel={() => setEditing(null)}
            onDone={(message) => {
              setEditing(null);
              setNotice(message);
            }}
          />
        </div>
      ) : null}

      {roles.isPending ? <LoadingText /> : null}
      {roles.isError ? <Alert>{callableErrorMessage(roles.error)}</Alert> : null}

      {roles.data ? (
        <ul className="flex flex-col gap-3">
          {roles.data.map((role) => (
            <li key={role.id} className="rounded-lg border border-line bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="flex items-center gap-2 text-base font-bold text-ink">
                    {role.name}
                    {role.system ? <Badge>Sistema</Badge> : null}
                  </h2>
                  <p className="text-xs text-muted">{role.id}</p>
                  {role.description ? <p className="mt-1 text-sm text-ink">{role.description}</p> : null}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setNotice(null);
                      setEditing({ mode: 'edit', role });
                    }}
                  >
                    Editar
                  </Button>
                  {canDeleteRole(role) ? (
                    <Button
                      variant="danger"
                      onClick={() => {
                        remove.reset();
                        setToDelete(role);
                      }}
                    >
                      Eliminar
                    </Button>
                  ) : null}
                </div>
              </div>
              <p className="mt-3 text-sm text-muted">
                {role.permissions.length === 0
                  ? 'Sin permisos de administración.'
                  : role.permissions.map(permissionLabel).join(' · ')}
              </p>
            </li>
          ))}
        </ul>
      ) : null}

      <ConfirmDialog
        open={toDelete !== null}
        title="Eliminar rol"
        confirmLabel="Eliminar"
        loading={remove.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => void confirmDelete()}
      >
        <p>
          ¿Eliminar el rol <strong>{toDelete?.name}</strong>? Esta acción no se puede deshacer.
        </p>
        {remove.isError ? (
          <div className="mt-3">
            <Alert>{callableErrorMessage(remove.error)}</Alert>
          </div>
        ) : null}
      </ConfirmDialog>
    </section>
  );
}
