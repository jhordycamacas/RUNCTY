'use client';

import { collection, getDocs } from 'firebase/firestore';

import { COLLECTIONS, callFunction, firestore } from '@/core/firebase/client';
import { isPermission } from '@/core/permissions/permissions';

import type { Role } from '../domain/role';

/** Roles are readable by signed-in users; writes go through callables only. */
export async function listRoles(): Promise<Role[]> {
  const snapshot = await getDocs(collection(firestore(), COLLECTIONS.roles));
  return snapshot.docs
    .map((d): Role => {
      const data = d.data();
      return {
        id: d.id,
        name: typeof data.name === 'string' ? data.name : d.id,
        description: typeof data.description === 'string' ? data.description : '',
        permissions: Array.isArray(data.permissions) ? data.permissions.filter(isPermission) : [],
        system: data.system === true,
      };
    })
    .sort((a, b) => Number(b.system) - Number(a.system) || a.name.localeCompare(b.name, 'es'));
}

type RoleWrite = Omit<Role, 'system'>;

export const createRole = (role: RoleWrite) => callFunction<RoleWrite, { ok: true }>('createRole', role);

export const updateRole = (role: RoleWrite) => callFunction<RoleWrite, { syncedUsers: number }>('updateRole', role);

export const deleteRole = (id: string) => callFunction<{ id: string }, { ok: true }>('deleteRole', { id });

export const setUserRole = (uid: string, roleId: string) =>
  callFunction<{ uid: string; roleId: string }, { ok: true }>('setUserRole', { uid, roleId });
