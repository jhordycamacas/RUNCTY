from collections.abc import Mapping
from dataclasses import dataclass

from apps.shared.domain.permissions import ADMIN_ROLE


@dataclass(frozen=True, slots=True)
class Principal:
    """Authenticated caller. The `{role, perms}` custom claims are the only authority."""

    uid: str
    email: str | None
    email_verified: bool
    role: str | None
    perms: tuple[str, ...]

    @classmethod
    def from_claims(cls, claims: Mapping[str, object]) -> "Principal":
        """Builds the principal from verified ID token claims, ignoring malformed ones."""
        email = claims.get("email")
        role = claims.get("role")
        perms = claims.get("perms")
        return cls(
            uid=str(claims["uid"]),
            email=email if isinstance(email, str) else None,
            email_verified=claims.get("email_verified") is True,
            role=role if isinstance(role, str) else None,
            perms=tuple(p for p in perms if isinstance(p, str)) if isinstance(perms, list) else (),
        )

    @property
    def is_admin(self) -> bool:
        return self.role == ADMIN_ROLE

    def has_permission(self, permission: str) -> bool:
        """The `admin` role is a superuser: it holds every permission regardless of `perms`."""
        return self.is_admin or permission in self.perms
