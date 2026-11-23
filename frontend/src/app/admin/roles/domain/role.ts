import { PERMISSIONS, Permission, isPermission } from '../../../core/permissions/permissions';

/** A role as `GET /roles` answers it. System roles cannot be deleted. */
export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  system: boolean;
}

/** The editable fields of a role; an empty description is left out of the request. */
export interface RoleInput {
  name: string;
  description?: string;
  permissions: Permission[];
}

export interface RoleCreateInput extends RoleInput {
  id: string;
}

export abstract class RoleAdminRepository {
  abstract list(): Promise<Role[]>;
  abstract create(input: RoleCreateInput): Promise<void>;
  /** Resolves to how many users got their access re-issued. */
  abstract update(roleId: string, input: RoleInput): Promise<number>;
  abstract delete(roleId: string): Promise<void>;
  abstract setUserRole(uid: string, roleId: string): Promise<void>;
}

/** What each permission of the catalogue grants, in the words of the admin. */
export const PERMISSION_LABELS: Record<Permission, string> = {
  'admin.access': 'Entrar al panel de administración',
  'users.read': 'Consultar usuarios',
  'users.manage': 'Editar y eliminar usuarios',
  'roles.manage': 'Gestionar roles y asignarlos',
  'cities.manage': 'Gestionar ciudades y zonas',
  'routes.manage': 'Gestionar rutas, franjas y factores de riesgo',
  'reports.validate': 'Validar reportes de la comunidad',
  'ads.manage': 'Gestionar anunciantes y campañas',
  'clubs.manage': 'Gestionar clubes y membresías',
  'settings.manage': 'Gestionar la configuración del sistema',
};

export interface PermissionGroup {
  label: string;
  permissions: readonly Permission[];
}

/** The catalogue grouped by area, for the checklist of the role form. */
export const PERMISSION_GROUPS: readonly PermissionGroup[] = [
  { label: 'Acceso', permissions: ['admin.access'] },
  { label: 'Usuarios', permissions: ['users.read', 'users.manage'] },
  { label: 'Roles', permissions: ['roles.manage'] },
  { label: 'Ciudades y rutas', permissions: ['cities.manage', 'routes.manage'] },
  {
    label: 'Comunidad y alianzas',
    permissions: ['reports.validate', 'clubs.manage', 'ads.manage'],
  },
  { label: 'Sistema', permissions: ['settings.manage'] },
];

/** The permissions in catalogue order, so two lists with the same permissions are equal. */
export const sortPermissions = (permissions: readonly Permission[]): Permission[] =>
  PERMISSIONS.filter((permission) => permissions.includes(permission));

/** Tolerant read of one entry of `GET /roles`: permissions outside the catalogue are dropped. */
export function toRole(raw: unknown): Role {
  const data = (raw ?? {}) as Record<string, unknown>;
  const id = typeof data['id'] === 'string' ? data['id'] : '';
  const permissions = Array.isArray(data['permissions'])
    ? data['permissions'].filter(isPermission)
    : [];
  return {
    id,
    name: typeof data['name'] === 'string' && data['name'] ? data['name'] : id,
    description: typeof data['description'] === 'string' ? data['description'] : '',
    permissions: sortPermissions(permissions),
    system: data['system'] === true,
  };
}
