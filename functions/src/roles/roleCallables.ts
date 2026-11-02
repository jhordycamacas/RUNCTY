import { FieldValue } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { onCall } from 'firebase-functions/v2/https';

import { COLLECTIONS, auth, db } from '../config';
import { requirePermission, runDomain } from '../shared/callable';
import { normalizePermissions } from './permissions';
import { createRole as createRoleLogic, deleteRole as deleteRoleLogic, setUserRole as setUserRoleLogic, updateRole as updateRoleLogic, type RolesDeps } from './roleService';

const NOT_FOUND = 5;

/** Firebase adapters for the role logic. */
function rolesDeps(): RolesDeps {
  const roles = () => db().collection(COLLECTIONS.roles);
  const users = () => db().collection(COLLECTIONS.users);

  return {
    async getRole(id) {
      const snap = await roles().doc(id).get();
      if (!snap.exists) return null;
      const data = snap.data() ?? {};
      return {
        name: String(data.name ?? id),
        description: String(data.description ?? ''),
        permissions: normalizePermissions(data.permissions) ?? [],
        system: data.system === true,
      };
    },
    async createRole(id, role) {
      // create() fails if the doc appeared in the meantime.
      await roles()
        .doc(id)
        .create({ ...role, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    },
    async updateRole(id, role) {
      await roles()
        .doc(id)
        .update({ ...role, updatedAt: FieldValue.serverTimestamp() });
    },
    async deleteRole(id) {
      await roles().doc(id).delete();
    },
    async listUserIdsWithRole(id) {
      const snap = await users().where('role', '==', id).select().get();
      return snap.docs.map((d) => d.id);
    },
    async hasUsersWithRole(id) {
      const snap = await users().where('role', '==', id).limit(1).select().get();
      return !snap.empty;
    },
    getCustomClaims: async (uid) => (await auth().getUser(uid)).customClaims,
    setCustomClaims: (uid, claims) => auth().setCustomUserClaims(uid, claims),
    async setDocRole(uid, role) {
      try {
        await users().doc(uid).update({ role, updatedAt: FieldValue.serverTimestamp() });
      } catch (error) {
        if ((error as { code?: number }).code === NOT_FOUND) return;
        throw error;
      }
    },
  };
}

/** RF-02-1 */
export const createRole = onCall(async (request) => {
  const caller = requirePermission(request, 'roles.manage');
  await runDomain(() => createRoleLogic(request.data, rolesDeps()));
  logger.info('Role created', { caller, roleId: (request.data as { id?: unknown })?.id });
  return { ok: true };
});

/** RF-02-3: also re-syncs the claims of every user with the role. */
export const updateRole = onCall(async (request) => {
  const caller = requirePermission(request, 'roles.manage');
  const result = await runDomain(() => updateRoleLogic(request.data, rolesDeps()));
  logger.info('Role updated', { caller, roleId: (request.data as { id?: unknown })?.id, ...result });
  return result;
});

/** RF-02-4: only roles without users; system roles are protected. */
export const deleteRole = onCall(async (request) => {
  const caller = requirePermission(request, 'roles.manage');
  await runDomain(() => deleteRoleLogic(request.data, rolesDeps()));
  logger.info('Role deleted', { caller, roleId: (request.data as { id?: unknown })?.id });
  return { ok: true };
});

export const setUserRole = onCall(async (request) => {
  const caller = requirePermission(request, 'roles.manage');
  await runDomain(() => setUserRoleLogic(request.data, caller, rolesDeps()));
  logger.info('User role changed', { caller, uid: (request.data as { uid?: unknown })?.uid });
  return { ok: true };
});
