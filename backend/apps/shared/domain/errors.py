from collections.abc import Mapping
from enum import Enum


class ErrorKind(Enum):
    """Category of a domain failure; the presentation layer maps it to an HTTP status."""

    INVALID_ARGUMENT = "invalid-argument"
    NOT_FOUND = "not-found"
    ALREADY_EXISTS = "already-exists"
    CONFLICT = "conflict"
    FAILED_PRECONDITION = "failed-precondition"
    PERMISSION_DENIED = "permission-denied"


class DomainError(Exception):
    """Business-rule failure.

    `reason` is a stable machine-readable code that clients translate into UI copy;
    the message is developer-facing and must be safe to return to the caller.
    `fields` maps each rejected input field to its own reason code.
    """

    def __init__(
        self,
        kind: ErrorKind,
        reason: str,
        message: str,
        fields: Mapping[str, str] | None = None,
    ) -> None:
        super().__init__(message)
        self.kind = kind
        self.reason = reason
        self.fields = dict(fields or {})


def invalid_fields(fields: Mapping[str, str]) -> DomainError:
    """Input whose values break the rules of a model, field by field."""
    return DomainError(
        ErrorKind.INVALID_ARGUMENT, "invalid-argument", "The request is invalid.", fields
    )
