from enum import Enum


class ErrorKind(Enum):
    """Category of a domain failure; the presentation layer maps it to an HTTP status."""

    INVALID_ARGUMENT = "invalid-argument"
    NOT_FOUND = "not-found"
    ALREADY_EXISTS = "already-exists"
    FAILED_PRECONDITION = "failed-precondition"
    PERMISSION_DENIED = "permission-denied"


class DomainError(Exception):
    """Business-rule failure.

    `reason` is a stable machine-readable code that clients translate into UI copy;
    the message is developer-facing and must be safe to return to the caller.
    """

    def __init__(self, kind: ErrorKind, reason: str, message: str) -> None:
        super().__init__(message)
        self.kind = kind
        self.reason = reason
