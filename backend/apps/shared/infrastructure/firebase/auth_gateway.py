from collections.abc import Iterator, Mapping
from contextlib import contextmanager

from firebase_admin import auth

from apps.shared.application.ports import AuthUserNotFound
from apps.shared.infrastructure.firebase.app import auth_client


@contextmanager
def _account(uid: str) -> Iterator[auth.Client]:
    try:
        yield auth_client()
    except auth.UserNotFoundError as error:
        raise AuthUserNotFound(uid) from error


class FirebaseAuthGateway:
    """`AuthGateway` adapter backed by Firebase Auth."""

    def get_custom_claims(self, uid: str) -> Mapping[str, object] | None:
        with _account(uid) as client:
            return client.get_user(uid).custom_claims

    def set_custom_claims(self, uid: str, claims: Mapping[str, object]) -> None:
        with _account(uid) as client:
            client.set_custom_user_claims(uid, dict(claims))

    def revoke_refresh_tokens(self, uid: str) -> None:
        with _account(uid) as client:
            client.revoke_refresh_tokens(uid)

    def delete_user(self, uid: str) -> None:
        with _account(uid) as client:
            client.delete_user(uid)
