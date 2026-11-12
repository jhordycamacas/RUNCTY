from enum import Enum
from typing import Protocol

from apps.roles.domain.models import Rol


class RoleRepository(Protocol):
    def get(self, role_id: str) -> Rol | None: ...

    def list(self) -> list[Rol]: ...

    def create(self, role: Rol) -> bool:
        """Stores a new role. Returns False, writing nothing, when the id is taken."""
        ...

    def update(self, role: Rol) -> None: ...

    def delete(self, role_id: str) -> None: ...


class RoleChange(Enum):
    APPLIED = "applied"
    PROFILE_MISSING = "profile-missing"
    LAST_ADMIN = "last-admin"


class RoleMembers(Protocol):
    """The users that hold each role, read from the `role` mirror of `users/{uid}`."""

    def ids_with_role(self, role_id: str) -> list[str]: ...

    def has_members(self, role_id: str) -> bool: ...

    def change_role(self, uid: str, role_id: str, *, keep_an_admin: bool) -> RoleChange:
        """Writes the mirror of `uid`, atomically with its checks.

        `PROFILE_MISSING` when `users/{uid}` does not exist. With `keep_an_admin`,
        `LAST_ADMIN` unless the mirror shows an admin other than `uid`.
        """
        ...
