import { z } from 'zod';

import { PERMISSIONS, type Permission } from '@/core/permissions/permissions';

/** Doc `roles/{id}` (RF-02). Written only by the role callables. */
export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  system: boolean;
}

export interface RoleFormValues {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

/** Same rule as ROLE_ID_PATTERN in functions/src/roles/roleService.ts. */
const ROLE_ID = /^[a-z][a-z0-9_]{1,31}$/;

const roleFormSchema = z.object({
  id: z.string().regex(ROLE_ID, 'Usa de 2 a 32 minúsculas, números o guion bajo, empezando con una letra.'),
  name: z.string().trim().min(1, 'El nombre es obligatorio.').max(60, 'Máximo 60 caracteres.'),
  description: z.string().trim().max(200, 'Máximo 200 caracteres.'),
  permissions: z.array(z.enum(PERMISSIONS, 'Permiso desconocido.')),
});

export type RoleFormErrors = Partial<Record<keyof RoleFormValues, string>>;

export function parseRoleForm(
  values: RoleFormValues,
): { ok: true; value: Omit<Role, 'system'> } | { ok: false; errors: RoleFormErrors } {
  const result = roleFormSchema.safeParse(values);
  if (result.success) return { ok: true, value: result.data };
  const errors: RoleFormErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] as keyof RoleFormValues;
    errors[key] ??= issue.message;
  }
  return { ok: false, errors };
}

/** Slug suggestion for a new role id: "Soporte técnico" → "soporte_tecnico". */
export function suggestRoleId(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^[^a-z]+/, '')
    .replace(/_+$/, '')
    .slice(0, 32);
}

/** System roles (runner, admin, club_rep) are protected; usage is checked by the server. */
export const canDeleteRole = (role: Pick<Role, 'system'>): boolean => !role.system;
