"""Default role of a new account.

Roles live in the `{role, perms}` custom claims, the only authority. The document field
`users/{uid}.role` is a read-only mirror, written after the claim.
"""

from collections.abc import Mapping
from dataclasses import dataclass

DEFAULT_ROLE = "runner"


@dataclass(frozen=True, slots=True)
class RoleAssignment:
    claims: Mapping[str, object]
    claims_changed: bool
    role: str
    doc_changed: bool


def resolve_role_assignment(
    existing_claims: Mapping[str, object] | None, doc_role: object
) -> RoleAssignment:
    """Pure decision: which claims and mirrored role an account must end up with."""
    current = dict(existing_claims or {})
    claimed = current.get("role")
    # An existing claim (an admin, for instance) always wins; the document is never trusted.
    existing_role = claimed if isinstance(claimed, str) and claimed else None
    role = existing_role or DEFAULT_ROLE
    return RoleAssignment(
        # Runners get no admin permissions.
        claims=current if existing_role else {**current, "role": role, "perms": []},
        claims_changed=existing_role is None,
        role=role,
        doc_changed=doc_role != role,
    )
