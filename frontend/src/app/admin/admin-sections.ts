import { Permission } from '../core/permissions/permissions';

export interface AdminSection {
  /** Route path under `/admin`. */
  path: string;
  label: string;
  icon: string;
  permission: Permission;
}

/** Sections of the admin menu, in landing order: the first one the user may open is the landing. */
export const ADMIN_SECTIONS: readonly AdminSection[] = [
  { path: 'resumen', label: 'Resumen', icon: 'grid-outline', permission: 'admin.access' },
  { path: 'usuarios', label: 'Usuarios', icon: 'people-outline', permission: 'users.read' },
  { path: 'roles', label: 'Roles', icon: 'shield-checkmark-outline', permission: 'roles.manage' },
  { path: 'ciudades', label: 'Ciudades', icon: 'business-outline', permission: 'cities.manage' },
  { path: 'rutas', label: 'Rutas', icon: 'trail-sign-outline', permission: 'routes.manage' },
  {
    path: 'configuracion',
    label: 'Configuración',
    icon: 'settings-outline',
    permission: 'settings.manage',
  },
];
