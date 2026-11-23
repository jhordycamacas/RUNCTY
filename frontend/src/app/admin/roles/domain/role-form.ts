import { Permission } from '../../../core/permissions/permissions';
import { Role, RoleCreateInput, sortPermissions } from './role';

const MAX_NAME = 60;
const MAX_DESCRIPTION = 200;
const ROLE_ID = /^[a-z][a-z0-9_]{1,31}$/;

export interface RoleForm {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
}

export type RoleFormField = keyof RoleForm;
type RoleFormErrors = Partial<Record<RoleFormField, string>>;

export const EMPTY_ROLE_FORM: RoleForm = { id: '', name: '', description: '', permissions: [] };

export type RoleFormResult =
  { input: RoleCreateInput; errors?: undefined } | { input?: undefined; errors: RoleFormErrors };

/**
 * Validates the form with the limits of the API. A stored role keeps its id, so the id is only
 * checked when the role is new.
 */
export function parseRoleForm(form: RoleForm, editing: boolean): RoleFormResult {
  const name = form.name.trim();
  const description = form.description.trim();
  const errors: RoleFormErrors = {};

  if (!editing && !ROLE_ID.test(form.id)) {
    errors.id =
      'Usa de 2 a 32 caracteres: minúsculas, números y guion bajo, empezando por una letra.';
  }
  if (!name) errors.name = 'El nombre es obligatorio.';
  else if (name.length > MAX_NAME) errors.name = `El nombre admite máximo ${MAX_NAME} caracteres.`;
  if (description.length > MAX_DESCRIPTION) {
    errors.description = `La descripción admite máximo ${MAX_DESCRIPTION} caracteres.`;
  }
  if (Object.keys(errors).length > 0) return { errors };

  return {
    input: {
      id: form.id,
      name,
      ...(description ? { description } : {}),
      permissions: sortPermissions(form.permissions),
    },
  };
}

export function toRoleForm(role: Role): RoleForm {
  return {
    id: role.id,
    name: role.name,
    description: role.description,
    permissions: [...role.permissions],
  };
}
