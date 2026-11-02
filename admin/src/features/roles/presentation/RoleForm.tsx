'use client';

import { useState, type FormEvent } from 'react';

import { callableErrorMessage } from '@/core/errors/errorMessages';
import { PERMISSIONS, permissionLabel } from '@/core/permissions/permissions';
import { Button } from '@/core/ui/Button';
import { Alert } from '@/core/ui/feedback';
import { TextField } from '@/core/ui/fields';

import { useSaveRole } from '../application/useRoles';
import { parseRoleForm, suggestRoleId, type Role, type RoleFormErrors, type RoleFormValues } from '../domain/role';

interface RoleFormProps {
  /** Role to edit; undefined creates a new one. */
  role?: Role;
  onDone(message: string): void;
  onCancel(): void;
}

export function RoleForm({ role, onDone, onCancel }: RoleFormProps) {
  const isNew = !role;
  const [values, setValues] = useState<RoleFormValues>({
    id: role?.id ?? '',
    name: role?.name ?? '',
    description: role?.description ?? '',
    permissions: role?.permissions ?? [],
  });
  const [idTouched, setIdTouched] = useState(false);
  const [errors, setErrors] = useState<RoleFormErrors>({});
  const save = useSaveRole();
  // The admin role always keeps every permission (enforced by the server too).
  const lockedPermissions = role?.id === 'admin';

  function togglePermission(permission: string, checked: boolean) {
    setValues((v) => ({
      ...v,
      permissions: checked ? [...v.permissions, permission] : v.permissions.filter((p) => p !== permission),
    }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseRoleForm(values);
    if (!parsed.ok) {
      setErrors(parsed.errors);
      return;
    }
    setErrors({});
    try {
      const result = await save.mutateAsync({ role: parsed.value, isNew });
      if (!result.created) {
        onDone(`Rol actualizado. Permisos sincronizados para ${result.syncedUsers} usuario(s); se aplican al renovar su sesión.`);
      } else {
        onDone('Rol creado.');
      }
    } catch {
      // The mutation error is rendered below.
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4 rounded-lg border border-line bg-white p-6">
      <h2 className="text-lg font-bold text-ink">{isNew ? 'Nuevo rol' : `Editar rol: ${role.name}`}</h2>
      {save.isError ? <Alert>{callableErrorMessage(save.error)}</Alert> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          label="Nombre"
          value={values.name}
          maxLength={60}
          error={errors.name}
          onChange={(e) => {
            const name = e.target.value;
            setValues((v) => ({ ...v, name, id: isNew && !idTouched ? suggestRoleId(name) : v.id }));
          }}
        />
        <TextField
          label="Identificador"
          value={values.id}
          disabled={!isNew}
          error={errors.id}
          hint="Minúsculas, números y guion bajo. No se puede cambiar después."
          onChange={(e) => {
            setIdTouched(true);
            setValues((v) => ({ ...v, id: e.target.value }));
          }}
        />
      </div>
      <TextField
        label="Descripción (opcional)"
        value={values.description}
        maxLength={200}
        error={errors.description}
        onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
      />

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium text-ink">Permisos</legend>
        {lockedPermissions ? (
          <p className="text-xs text-muted">El rol Administrador conserva todos los permisos.</p>
        ) : null}
        <div className="grid gap-2 md:grid-cols-2">
          {PERMISSIONS.map((permission) => (
            <label key={permission} className="flex min-h-11 items-center gap-3 rounded-md border border-line px-3 text-sm">
              <input
                type="checkbox"
                className="size-4 accent-primary focus-visible:outline-2 focus-visible:outline-ink"
                checked={values.permissions.includes(permission)}
                disabled={lockedPermissions}
                onChange={(e) => togglePermission(permission, e.target.checked)}
              />
              <span>
                {permissionLabel(permission)} <span className="text-xs text-muted">({permission})</span>
              </span>
            </label>
          ))}
        </div>
        {errors.permissions ? <p className="text-xs font-medium text-primary">{errors.permissions}</p> : null}
      </fieldset>

      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel} disabled={save.isPending}>
          Cancelar
        </Button>
        <Button type="submit" loading={save.isPending}>
          {isNew ? 'Crear rol' : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  );
}
