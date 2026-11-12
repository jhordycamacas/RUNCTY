from rest_framework.authentication import BaseAuthentication, get_authorization_header
from rest_framework.exceptions import AuthenticationFailed, Throttled

from apps.shared.application.ports import TokenRejected, TokenVerifier
from apps.shared.domain.models import Principal
from apps.shared.presentation.adapters import adapter
from apps.shared.presentation.throttles import FailedAuthenticationThrottle


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

        failures = FailedAuthenticationThrottle()
        if not failures.allow_request(request):
            raise Throttled(failures.wait())
        try:
            (raw_token,) = parts[1:]
            token = raw_token.decode("ascii")
        except ValueError as error:  # wrong number of parts, or non-ASCII bytes
            failures.record_failure()
            raise AuthenticationFailed(
                "Malformed Authorization header.", code="invalid-token"
            ) from error

        verifier: TokenVerifier = adapter("TOKEN_VERIFIER")
        try:
            return verifier.verify(token), None
        except TokenRejected as rejected:
            failures.record_failure()
            raise AuthenticationFailed(rejected.message, code=rejected.reason) from rejected
