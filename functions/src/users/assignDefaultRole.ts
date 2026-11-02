/**
 * Default role assignment for new accounts.
 *
 * Roles live in the `{ role, perms }` custom claims (the only source the
 * security rules trust). The doc field `users/{uid}.role` is a read-only mirror for the
 * clients: it is written after the claim, so a client that sees it can force
 * an ID token refresh and get the new claim.
 */

export const DEFAULT_ROLE = 'runner';

export type Claims = Record<string, unknown>;

export interface RoleAssignment {
  claims: Claims;
  claimsChanged: boolean;
  role: string;
  docChanged: boolean;
}

/** Pure decision: which claims and doc role a user must end up with. */
export function resolveRoleAssignment(existingClaims: Claims | undefined, docRole: unknown): RoleAssignment {
  const current = existingClaims ?? {};
  const existingRole = typeof current.role === 'string' && current.role.length > 0 ? current.role : undefined;
  // An existing claim (e.g. admin) always wins; the doc field is never trusted.
  const role = existingRole ?? DEFAULT_ROLE;

  return {
    // Runners get no admin permissions; see roles/permissions.ts.
    claims: existingRole ? current : { ...current, role, perms: [] },
    claimsChanged: !existingRole,
    role,
    docChanged: docRole !== role,
  };
}

export interface RoleAssignmentDeps {
  getCustomClaims(uid: string): Promise<Claims | undefined>;
  setCustomClaims(uid: string, claims: Claims): Promise<void>;
  setDocRole(uid: string, role: string): Promise<void>;
}

export async function assignDefaultRole(uid: string, docRole: unknown, deps: RoleAssignmentDeps): Promise<string> {
  const decision = resolveRoleAssignment(await deps.getCustomClaims(uid), docRole);

  if (decision.claimsChanged) {
    await deps.setCustomClaims(uid, decision.claims);
  }
  if (decision.docChanged) {
    await deps.setDocRole(uid, decision.role);
  }
  return decision.role;
}
