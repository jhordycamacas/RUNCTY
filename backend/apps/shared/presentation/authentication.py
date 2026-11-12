from django.conf import settings
from django.utils.module_loading import import_string
from rest_framework.authentication import BaseAuthentication, get_authorization_header
from rest_framework.exceptions import AuthenticationFailed

from apps.shared.application.ports import TokenRejected, TokenVerifier
from apps.shared.domain.models import Principal


class BearerTokenAuthentication(BaseAuthentication):
    """Authenticates `Authorization: Bearer <ID token>` through the configured `TokenVerifier`."""

    scheme = "Bearer"

    def authenticate_header(self, request) -> str:
        # Makes DRF answer 401 (not 403) with `WWW-Authenticate` when authentication fails.
        return self.scheme

    def authenticate(self, request) -> tuple[Principal, None] | None:
        parts = get_authorization_header(request).split()
        if not parts or parts[0].lower() != self.scheme.lower().encode():
            return None
        try:
            (raw_token,) = parts[1:]
            token = raw_token.decode("ascii")
        except ValueError as error:  # wrong number of parts, or non-ASCII bytes
            raise AuthenticationFailed(
                "Malformed Authorization header.", code="invalid-token"
            ) from error

        verifier: TokenVerifier = import_string(settings.TOKEN_VERIFIER)()
        try:
            return verifier.verify(token), None
        except TokenRejected as rejected:
            raise AuthenticationFailed(rejected.message, code=rejected.reason) from rejected
