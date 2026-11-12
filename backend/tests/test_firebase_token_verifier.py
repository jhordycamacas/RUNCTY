import pytest
from firebase_admin import auth

from apps.shared.application.ports import TokenRejected
from apps.shared.domain.models import Principal
from apps.shared.infrastructure.firebase import token_verifier
from apps.shared.infrastructure.firebase.token_verifier import FirebaseTokenVerifier


class StubAuthClient:
    def __init__(self, outcome):
        self.outcome = outcome
        self.calls = []

    def verify_id_token(self, token, check_revoked=False):
        self.calls.append((token, check_revoked))
        if isinstance(self.outcome, Exception):
            raise self.outcome
        return self.outcome


@pytest.fixture
def stub_auth(monkeypatch):
    def install(outcome) -> StubAuthClient:
        stub = StubAuthClient(outcome)
        monkeypatch.setattr(token_verifier, "auth_client", lambda: stub)
        return stub

    return install


def test_verifies_with_revocation_check_and_maps_claims(stub_auth):
    stub = stub_auth(
        {"uid": "u1", "email": "a@example.com", "email_verified": True, "role": "admin"}
    )

    principal = FirebaseTokenVerifier().verify("id-token")

    assert stub.calls == [("id-token", True)]
    assert principal == Principal(
        uid="u1", email="a@example.com", email_verified=True, role="admin", perms=()
    )


@pytest.mark.parametrize(
    ("error", "reason"),
    [
        (auth.RevokedIdTokenError("revoked: internal detail"), "token-revoked"),
        (auth.UserDisabledError("disabled: internal detail"), "user-disabled"),
        (auth.ExpiredIdTokenError("expired: internal detail", cause=None), "token-expired"),
        (auth.InvalidIdTokenError("bad aud: internal detail"), "invalid-token"),
        (auth.UserNotFoundError("no user: internal detail"), "invalid-token"),
    ],
)
def test_maps_firebase_rejections_to_stable_reasons_without_leaking(stub_auth, error, reason):
    stub_auth(error)

    with pytest.raises(TokenRejected) as rejected:
        FirebaseTokenVerifier().verify("id-token")

    assert rejected.value.reason == reason
    assert "internal detail" not in rejected.value.message


def test_infrastructure_failures_are_not_reported_as_rejections(stub_auth):
    stub_auth(auth.CertificateFetchError("network down", cause=None))

    with pytest.raises(auth.CertificateFetchError):
        FirebaseTokenVerifier().verify("id-token")
