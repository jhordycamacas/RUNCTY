"""Error responses: `{"error": {"reason": "<stable-code>", "message": "<safe text>"}}`.

Clients branch on `reason` and translate it; `message` is developer-facing.
"""

import logging

from django.core.exceptions import PermissionDenied as DjangoPermissionDenied
from django.http import Http404, JsonResponse
from rest_framework import exceptions
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler

from apps.shared.domain.errors import DomainError, ErrorKind

logger = logging.getLogger(__name__)

_DOMAIN_STATUS = {
    ErrorKind.INVALID_ARGUMENT: 400,
    ErrorKind.FAILED_PRECONDITION: 400,
    ErrorKind.PERMISSION_DENIED: 403,
    ErrorKind.NOT_FOUND: 404,
    ErrorKind.ALREADY_EXISTS: 409,
}

# DRF error codes whose hyphenated form is not the reason the clients already know.
_REASON_OVERRIDES = {"not_authenticated": "unauthenticated", "throttled": "rate-limited"}

_INTERNAL = ("internal", "Internal server error.")
_NOT_FOUND = ("not-found", "Not found.")


def _body(reason: str, message: str) -> dict:
    return {"error": {"reason": reason, "message": message}}


def _describe(exc: exceptions.APIException) -> tuple[str, str]:
    if exc.status_code >= 500:
        return _INTERNAL
    if isinstance(exc, exceptions.ValidationError):
        return "invalid-argument", "The request is invalid."
    code = exc.get_codes()
    return _REASON_OVERRIDES.get(code, code.replace("_", "-")), str(exc.detail)


def exception_handler(exc: Exception, context: dict) -> Response:
    """DRF `EXCEPTION_HANDLER`: every failure inside a view leaves through here."""
    if isinstance(exc, DomainError):
        return Response(_body(exc.reason, str(exc)), status=_DOMAIN_STATUS[exc.kind])

    # Replace Django's exceptions with DRF's so their internal messages are not returned.
    if isinstance(exc, Http404):
        exc = exceptions.NotFound(_NOT_FOUND[1])
    elif isinstance(exc, DjangoPermissionDenied):
        exc = exceptions.PermissionDenied()

    # The DRF handler adds the WWW-Authenticate and Retry-After headers.
    response = drf_exception_handler(exc, context)
    if response is None:
        logger.error("Unhandled error in %s", type(context["view"]).__name__, exc_info=exc)
        return Response(_body(*_INTERNAL), status=500)
    response.data = _body(*_describe(exc))
    return response


def not_found(request, exception) -> JsonResponse:
    """Django `handler404`: unknown URLs never reach a DRF view."""
    return JsonResponse(_body(*_NOT_FOUND), status=404)


def server_error(request) -> JsonResponse:
    """Django `handler500`: failures outside DRF views (middleware, URL resolution)."""
    return JsonResponse(_body(*_INTERNAL), status=500)
