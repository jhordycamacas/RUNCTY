import re
from collections.abc import Mapping
from dataclasses import dataclass

from apps.shared.domain.errors import DomainError, ErrorKind
from apps.shared.domain.permissions import ADMIN_ROLE, ALL_PERMISSIONS, normalize_permissions

# Lowercase slug: starts with a letter, 2-32 characters of a-z, 0-9 and `_`.
_ROLE_ID = re.compile(r"[a-z][a-z0-9_]{1,31}")
_MAX_NAME = 60
_MAX_DESCRIPTION = 200

ROLES_MANAGE = "roles.manage"


def _invalid(reason: str, message: str) -> DomainError:
    return DomainError(ErrorKind.INVALID_ARGUMENT, reason, message)


def parse_role_id(value: object) -> str:
    if not isinstance(value, str) or not _ROLE_ID.fullmatch(value):
        raise _invalid(
            "invalid-role-id", "Role id must be a lowercase slug (a-z, 0-9, _), 2-32 chars."
        )
    return value


@dataclass(frozen=True, slots=True)
class Rol:
    """Document `roles/{id}`: a named set of catalogue permissions (RF-02)."""

    id: str
    name: str
    description: str
    permissions: tuple[str, ...]
    # Seeded roles: they cannot be deleted and only an admin edits them.
    system: bool = False

    @classmethod
    def parse(cls, raw: Mapping[str, object]) -> "Rol":
        """Validates client input for a role. The result is never a system role."""
        role_id = parse_role_id(raw.get("id"))

        name = raw.get("name")
        name = name.strip() if isinstance(name, str) else ""
        if not name or len(name) > _MAX_NAME:
            raise _invalid("invalid-role-name", f"Role name is required (max {_MAX_NAME} chars).")

        description = raw.get("description", "")
        if not isinstance(description, str) or len(description.strip()) > _MAX_DESCRIPTION:
            raise _invalid(
                "invalid-role-description",
                f"Description must be text (max {_MAX_DESCRIPTION} chars).",
            )

        permissions = normalize_permissions(raw.get("permissions"))
        if permissions is None:
            raise _invalid("invalid-permissions", "Permissions must be a subset of the catalog.")

        return cls(role_id, name, description.strip(), permissions)

    @classmethod
    def from_document(cls, role_id: str, data: Mapping[str, object]) -> "Rol":
        """Tolerant read: a malformed stored field falls back to a harmless value."""
        name = data.get("name")
        description = data.get("description")
        return cls(
            id=role_id,
            name=name if isinstance(name, str) else role_id,
            description=description if isinstance(description, str) else "",
            permissions=normalize_permissions(data.get("permissions")) or (),
            system=data.get("system") is True,
        )

    def to_document(self) -> dict[str, object]:
        return {
            "name": self.name,
            "description": self.description,
            "permissions": list(self.permissions),
            "system": self.system,
        }

    def grants_beyond(self, current: "Rol") -> tuple[str, ...]:
        """Permissions that editing `current` into this role hands out.

        Keeping or removing a permission is free; `roles.manage` always counts.
        """
        return tuple(
            permission
            for permission in self.permissions
            if permission == ROLES_MANAGE or permission not in current.permissions
        )

    @property
    def breaks_the_admin_role(self) -> bool:
        """The admin role must keep every permission of the catalogue."""
        return self.id == ADMIN_ROLE and len(self.permissions) != len(ALL_PERMISSIONS)
