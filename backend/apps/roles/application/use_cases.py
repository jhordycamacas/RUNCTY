"""RF-02: role CRUD and role assignment.

Every use case takes the caller's uid and reads its authority from Firebase Auth: an ID
token can outlive a demotion, the stored claims cannot (NEW-01).
"""

from collections.abc import Mapping
from dataclasses import dataclass, replace

from apps.roles.application.ports import RoleChange, RoleMembers, RoleRepository
from apps.roles.domain.models import ROLES_MANAGE, Rol, parse_role_id
from apps.roles.domain.policies import admin_only, assert_can_grant, claims_for
from apps.shared.application.ports import AuthGateway, AuthUserNotFound
from apps.shared.domain.errors import DomainError, ErrorKind
from apps.shared.domain.models import Principal
from apps.shared.domain.permissions import ADMIN_ROLE

_MAX_UID = 128


@dataclass(frozen=True, slots=True)
class RolesDeps:
    roles: RoleRepository
    members: RoleMembers
    auth: AuthGateway


def _role_manager(uid: str, deps: RolesDeps) -> Principal:
    try:
        claims = deps.auth.get_custom_claims(uid)
    except AuthUserNotFound:
        claims = None
    caller = Principal.from_claims({**(claims or {}), "uid": uid})
    if not caller.has_permission(ROLES_MANAGE):
        raise DomainError(
            ErrorKind.PERMISSION_DENIED, "missing-permission", f"Missing permission {ROLES_MANAGE}."
        )
    return caller


def _existing_role(role_id: str, deps: RolesDeps) -> Rol:
    role = deps.roles.get(role_id)
    if role is None:
        raise DomainError(
            ErrorKind.NOT_FOUND, "role-not-found", f'Role "{role_id}" does not exist.'
        )
    return role


def _precondition(reason: str, message: str) -> DomainError:
    return DomainError(ErrorKind.FAILED_PRECONDITION, reason, message)


def list_roles(roles: RoleRepository) -> list[Rol]:
    return roles.list()


def create_role(raw: Mapping[str, object], caller_uid: str, deps: RolesDeps) -> Rol:
    caller = _role_manager(caller_uid, deps)
    role = Rol.parse(raw)
    assert_can_grant(caller, role.permissions)
    if not deps.roles.create(role):
        raise DomainError(
            ErrorKind.ALREADY_EXISTS, "role-exists", f'Role "{role.id}" already exists.'
        )
    return role


def update_role(raw: Mapping[str, object], caller_uid: str, deps: RolesDeps) -> int:
    """Updates the role and returns how many of its users got their claims re-issued."""
    caller = _role_manager(caller_uid, deps)
    role = Rol.parse(raw)
    current = _existing_role(role.id, deps)
    # NEW-02: a system role reaches every runner or club representative.
    if current.system and not caller.is_admin:
        raise admin_only("Only an admin can edit a system role.")
    assert_can_grant(caller, role.grants_beyond(current))
    if role.breaks_the_admin_role:
        raise _precondition("admin-permissions", "The admin role must keep every permission.")

    deps.roles.update(replace(role, system=current.system))
    return _sync_role_claims(role, deps)


def _sync_role_claims(role: Rol, deps: RolesDeps) -> int:
    """Re-issues `{role, perms}` to every user with the role and revokes their sessions.

    The API verifies tokens with `check_revoked`, so the old claims stop working at once.
    """
    synced = 0
    for uid in deps.members.ids_with_role(role.id):
        try:
            existing = deps.auth.get_custom_claims(uid)
            deps.auth.set_custom_claims(uid, claims_for(existing, role.id, role.permissions))
            deps.auth.revoke_refresh_tokens(uid)
        except AuthUserNotFound:
            # Deleted from Auth while its profile still exists: nothing to sync.
            continue
        synced += 1
    return synced


def delete_role(raw_role_id: object, caller_uid: str, deps: RolesDeps) -> None:
    _role_manager(caller_uid, deps)
    role = _existing_role(parse_role_id(raw_role_id), deps)
    if role.system:
        raise _precondition("system-role", "System roles cannot be deleted.")
    # RF-02-4: only a role without users can be deleted.
    if deps.members.has_members(role.id):
        raise _precondition("role-has-users", "The role still has assigned users.")
    deps.roles.delete(role.id)


def set_user_role(uid: object, raw_role_id: object, caller_uid: str, deps: RolesDeps) -> Rol:
    caller = _role_manager(caller_uid, deps)
    if not isinstance(uid, str) or not 0 < len(uid) <= _MAX_UID:
        raise DomainError(
            ErrorKind.INVALID_ARGUMENT, "invalid-argument", "A valid uid is required."
        )
    role = _existing_role(parse_role_id(raw_role_id), deps)

    try:
        existing = deps.auth.get_custom_claims(uid)
    except AuthUserNotFound as error:
        raise DomainError(
            ErrorKind.NOT_FOUND, "user-not-found", "The user does not exist."
        ) from error
    current_role = (existing or {}).get("role")

    # SEC-02: only an admin can assign or revoke the admin role, and a non-admin
    # cannot hand out permissions they lack.
    if not caller.is_admin and ADMIN_ROLE in (role.id, current_role):
        raise admin_only("Only an admin can assign or revoke the admin role.")
    assert_can_grant(caller, role.permissions)

    # Lockout guard: an admin cannot take away their own admin role, and nobody
    # can remove their own ability to manage roles.
    demotes_admin = current_role == ADMIN_ROLE and role.id != ADMIN_ROLE
    if uid == caller.uid and (demotes_admin or ROLES_MANAGE not in role.permissions):
        raise _precondition("self-lockout", "You cannot remove your own admin role.")

    # The mirror goes first because its transaction holds the last-admin check (SEC-08,
    # NEW-03); the claims follow, and revoking the sessions makes them effective (SEC-03).
    outcome = deps.members.change_role(uid, role.id, keep_an_admin=demotes_admin)
    if outcome is RoleChange.PROFILE_MISSING:
        # NEW-04: without the mirror a later edit of the role could not re-sync this user.
        raise DomainError(
            ErrorKind.NOT_FOUND, "user-profile-missing", "The user has not completed sign-up."
        )
    if outcome is RoleChange.LAST_ADMIN:
        raise _precondition("last-admin", "You cannot remove the last admin.")
    try:
        deps.auth.set_custom_claims(uid, claims_for(existing, role.id, role.permissions))
    except Exception:
        if isinstance(current_role, str):
            # The claims are the authority: put the mirror back in line with them.
            deps.members.change_role(uid, current_role, keep_an_admin=False)
        raise
    deps.auth.revoke_refresh_tokens(uid)
    return role
