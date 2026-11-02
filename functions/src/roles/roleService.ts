/**
 * RF-02-1..4: role CRUD and role assignment.
 * Pure apart from the injected dependencies so it is unit-testable; the
 * callables in `roleCallables.ts` only add auth checks and Firebase adapters.
 */
import { claimsFor, type Claims } from '../shared/authz';
import { DomainError, invalidArgument, isUserNotFound } from '../shared/errors';
import { ADMIN_ROLE, ALL_PERMISSIONS, normalizePermissions, type Permission } from './permissions';

/** Lowercase slug: starts with a letter, 2–32 chars of a-z, 0-9 and `_`. */
export const ROLE_ID_PATTERN = /^[a-z][a-z0-9_]{1,31}$/;
const MAX_NAME = 60;
const MAX_DESCRIPTION = 200;
/** Concurrent claim updates while re-syncing a role (Auth Admin API quota friendly). */
const SYNC_CHUNK = 10;

export interface RoleData {
  name: string;
  description: string;
  permissions: Permission[];
}

export interface RoleRecord extends RoleData {
  system: boolean;
}

export interface RoleInput extends RoleData {
  id: string;
}

export interface RolesDeps {
  getRole(id: string): Promise<RoleRecord | null>;
  /** Persists a new role (the adapter adds the timestamps). */
  createRole(id: string, role: RoleRecord): Promise<void>;
  updateRole(id: string, role: RoleData): Promise<void>;
  deleteRole(id: string): Promise<void>;
  /** uids whose user doc mirrors `role == id`. */
  listUserIdsWithRole(id: string): Promise<string[]>;
  hasUsersWithRole(id: string): Promise<boolean>;
  /** Throws `auth/user-not-found` when the uid does not exist. */
  getCustomClaims(uid: string): Promise<Claims | undefined>;
  setCustomClaims(uid: string, claims: Claims): Promise<void>;
  /** Mirrors the role on `users/{uid}`; a missing doc is ignored. */
  setDocRole(uid: string, role: string): Promise<void>;
}

const asRecord = (raw: unknown): Record<string, unknown> =>
  typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};

export function parseRoleId(value: unknown): string {
  if (typeof value !== 'string' || !ROLE_ID_PATTERN.test(value)) {
    throw invalidArgument('invalid-role-id', 'Role id must be a lowercase slug (a-z, 0-9, _), 2-32 chars.');
  }
  return value;
}

export function parseRoleInput(raw: unknown): RoleInput {
  const input = asRecord(raw);
  const id = parseRoleId(input.id);

  const name = typeof input.name === 'string' ? input.name.trim() : '';
  if (name.length === 0 || name.length > MAX_NAME) {
    throw invalidArgument('invalid-role-name', `Role name is required (max ${MAX_NAME} chars).`);
  }

  const description = input.description === undefined ? '' : input.description;
  if (typeof description !== 'string' || description.trim().length > MAX_DESCRIPTION) {
    throw invalidArgument('invalid-role-description', `Description must be text (max ${MAX_DESCRIPTION} chars).`);
  }

  const permissions = normalizePermissions(input.permissions);
  if (!permissions) {
    throw invalidArgument('invalid-permissions', 'Permissions must be a subset of the catalog.');
  }

  return { id, name, description: description.trim(), permissions };
}

const roleNotFound = (id: string) => new DomainError('not-found', 'role-not-found', `Role "${id}" does not exist.`);

export async function createRole(raw: unknown, deps: RolesDeps): Promise<void> {
  const { id, ...data } = parseRoleInput(raw);
  if (await deps.getRole(id)) {
    throw new DomainError('already-exists', 'role-exists', `Role "${id}" already exists.`);
  }
  await deps.createRole(id, { ...data, system: false });
}

export async function updateRole(raw: unknown, deps: RolesDeps): Promise<{ syncedUsers: number }> {
  const { id, ...data } = parseRoleInput(raw);
  if (!(await deps.getRole(id))) throw roleNotFound(id);
  if (id === ADMIN_ROLE && data.permissions.length !== ALL_PERMISSIONS.length) {
    throw new DomainError('failed-precondition', 'admin-permissions', 'The admin role must keep every permission.');
  }

  await deps.updateRole(id, data);
  return { syncedUsers: await syncRoleClaims(id, data.permissions, deps) };
}

/**
 * Re-issues `{ role, perms }` to every user with the role. Users see the new
 * permissions on their next token refresh (at most one hour, or on sign-in).
 */
async function syncRoleClaims(roleId: string, perms: Permission[], deps: RolesDeps): Promise<number> {
  const uids = await deps.listUserIdsWithRole(roleId);
  let synced = 0;
  for (let i = 0; i < uids.length; i += SYNC_CHUNK) {
    const results = await Promise.all(
      uids.slice(i, i + SYNC_CHUNK).map(async (uid) => {
        try {
          const existing = await deps.getCustomClaims(uid);
          await deps.setCustomClaims(uid, claimsFor(existing, roleId, perms));
          return 1;
        } catch (error) {
          // A user deleted from Auth while its doc still exists: nothing to sync.
          if (isUserNotFound(error)) return 0;
          throw error;
        }
      }),
    );
    synced += results.reduce<number>((sum, n) => sum + n, 0);
  }
  return synced;
}

export async function deleteRole(raw: unknown, deps: RolesDeps): Promise<void> {
  const id = parseRoleId(asRecord(raw).id);
  const role = await deps.getRole(id);
  if (!role) throw roleNotFound(id);
  if (role.system) {
    throw new DomainError('failed-precondition', 'system-role', 'System roles cannot be deleted.');
  }
  // RF-02-4: only a role without users can be deleted.
  if (await deps.hasUsersWithRole(id)) {
    throw new DomainError('failed-precondition', 'role-has-users', 'The role still has assigned users.');
  }
  await deps.deleteRole(id);
}

export async function setUserRole(raw: unknown, callerUid: string, deps: RolesDeps): Promise<void> {
  const input = asRecord(raw);
  const uid = input.uid;
  if (typeof uid !== 'string' || uid.length === 0 || uid.length > 128) {
    throw invalidArgument('invalid-argument', 'A valid uid is required.');
  }
  const roleId = parseRoleId(input.roleId);
  const role = await deps.getRole(roleId);
  if (!role) throw roleNotFound(roleId);

  let existing: Claims | undefined;
  try {
    existing = await deps.getCustomClaims(uid);
  } catch (error) {
    if (isUserNotFound(error)) {
      throw new DomainError('not-found', 'user-not-found', 'The user does not exist.');
    }
    throw error;
  }

  // Lockout guard: an admin cannot take away their own admin role, and nobody
  // can remove their own ability to manage roles.
  if (uid === callerUid) {
    const losesAdmin = existing?.role === ADMIN_ROLE && roleId !== ADMIN_ROLE;
    if (losesAdmin || !role.permissions.includes('roles.manage')) {
      throw new DomainError('failed-precondition', 'self-lockout', 'You cannot remove your own admin role.');
    }
  }

  // Claim first, then the doc mirror (same order as assignDefaultRole).
  await deps.setCustomClaims(uid, claimsFor(existing, roleId, role.permissions));
  await deps.setDocRole(uid, roleId);
}
