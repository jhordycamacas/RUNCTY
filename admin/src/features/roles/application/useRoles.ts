'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Role } from '../domain/role';
import { createRole, deleteRole, listRoles, setUserRole, updateRole } from '../infrastructure/rolesApi';

export type SaveRoleResult = { created: true } | { created: false; syncedUsers: number };

const rolesQueryKey = ['roles'] as const;

export function useRoles() {
  return useQuery({ queryKey: rolesQueryKey, queryFn: listRoles });
}

export function useSaveRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ role, isNew }: { role: Omit<Role, 'system'>; isNew: boolean }): Promise<SaveRoleResult> => {
      if (isNew) {
        await createRole(role);
        return { created: true };
      }
      const { syncedUsers } = await updateRole(role);
      return { created: false, syncedUsers };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: rolesQueryKey }),
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRole,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: rolesQueryKey }),
  });
}

export function useSetUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uid, roleId }: { uid: string; roleId: string }) => setUserRole(uid, roleId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });
}
