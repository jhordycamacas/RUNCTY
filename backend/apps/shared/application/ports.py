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
