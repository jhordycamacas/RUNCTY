from firebase_admin import auth

from apps.shared.application.ports import TokenRejected
from apps.shared.domain.models import Principal
from apps.shared.infrastructure.firebase.app import auth_client

# Ordered from most to least specific: the revoked and expired errors subclass the invalid one.
# The SDK messages are never forwarded; they can describe the project configuration.
_REJECTIONS: tuple[tuple[type[Exception], str, str], ...] = (
    (auth.RevokedIdTokenError, "token-revoked", "The session was revoked. Sign in again."),
    (auth.UserDisabledError, "user-disabled", "The account is disabled."),
    (auth.ExpiredIdTokenError, "token-expired", "The ID token has expired."),
    (auth.InvalidIdTokenError, "invalid-token", "The ID token is invalid."),
    (auth.UserNotFoundError, "invalid-token", "The ID token is invalid."),
)


class FirebaseTokenVerifier:
    """`TokenVerifier` adapter backed by Firebase Auth.

    `check_revoked=True` makes every request fail for revoked sessions and disabled or
    deleted accounts, at the cost of one Auth lookup per request.
    """

    def verify(self, token: str) -> Principal:
        try:
            claims = auth_client().verify_id_token(token, check_revoked=True)
        except tuple(error for error, _, _ in _REJECTIONS) as error:
            reason, message = next(
                (reason, message)
                for kind, reason, message in _REJECTIONS
                if isinstance(error, kind)
            )
            raise TokenRejected(reason, message) from error
        return Principal.from_claims(claims)
