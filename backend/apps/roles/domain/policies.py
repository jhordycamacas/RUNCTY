"""Who may grant what (SEC-02). Pure rules over the caller's claims."""

from collections.abc import Iterable, Mapping

from apps.roles.domain.models import ROLES_MANAGE
from apps.shared.domain.errors import DomainError, ErrorKind
from apps.shared.domain.models import Principal


def admin_only(message: str) -> DomainError:
    return DomainError(ErrorKind.PERMISSION_DENIED, "admin-only", message)


def assert_can_grant(caller: Principal, permissions: Iterable[str]) -> None:
    """A delegate with `roles.manage` must not be able to escalate to admin.

    `roles.manage` is admin-only, and a non-admin can never grant a permission
    they do not hold themselves.
    """
    if caller.is_admin:
        return
    permissions = tuple(permissions)
    if ROLES_MANAGE in permissions:
        raise admin_only("Only an admin can grant the roles.manage permission.")
    if any(permission not in caller.perms for permission in permissions):
        raise DomainError(
            ErrorKind.PERMISSION_DENIED,
            "permission-escalation",
            "You cannot grant a permission you do not hold.",
        )


def claims_for(
    existing: Mapping[str, object] | None, role: str, permissions: Iterable[str]
) -> dict[str, object]:
    """Custom claims for a role assignment, preserving unrelated claims."""
    return {**(existing or {}), "role": role, "perms": list(permissions)}
