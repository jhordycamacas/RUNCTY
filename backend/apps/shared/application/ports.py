from collections.abc import Mapping
from typing import Protocol

from apps.shared.domain.models import Principal


class TokenRejected(Exception):
    """The bearer token cannot authenticate the caller.

    `reason` is one of `token-revoked`, `user-disabled`, `token-expired` or `invalid-token`;
    `message` is safe to return to the client.
    """

    def __init__(self, reason: str, message: str) -> None:
        super().__init__(message)
        self.reason = reason
        self.message = message


class TokenVerifier(Protocol):
    def verify(self, token: str) -> Principal:
        """Returns the caller identified by `token` or raises `TokenRejected`."""
        ...


class AuthUserNotFound(Exception):
    """No Firebase Auth account has the given uid."""


class AuthGateway(Protocol):
    """Firebase Auth accounts. Every method raises `AuthUserNotFound` for an unknown uid."""

    def get_custom_claims(self, uid: str) -> Mapping[str, object] | None: ...

    def set_custom_claims(self, uid: str, claims: Mapping[str, object]) -> None: ...

    def revoke_refresh_tokens(self, uid: str) -> None:
        """Ends the sessions of `uid`: tokens issued before this call stop being accepted."""
        ...

    def delete_user(self, uid: str) -> None:
        """Deletes the account and its credentials."""
        ...
