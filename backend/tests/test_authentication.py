import pytest
from rest_framework.throttling import SimpleRateThrottle

from tests.conftest import bearer
from tests.fakes import FakeTokenVerifier

ME = "/api/v1/me"


def test_missing_header_is_unauthenticated(client):
    response = client.get(ME)

    assert response.status_code == 401
    assert response["WWW-Authenticate"] == "Bearer"
    assert response.json() == {
        "error": {
            "reason": "unauthenticated",
            "message": "Authentication credentials were not provided.",
        }
    }


def test_other_schemes_are_treated_as_unauthenticated(client):
    response = client.get(ME, HTTP_AUTHORIZATION="Basic dXNlcjpwYXNz")

    assert response.status_code == 401
    assert response.json()["error"]["reason"] == "unauthenticated"


@pytest.mark.parametrize("header", ["Bearer", "Bearer one two", "Bearer t\xf8ken"])
def test_malformed_bearer_header_is_an_invalid_token(client, header):
    response = client.get(ME, HTTP_AUTHORIZATION=header)

    assert response.status_code == 401
    assert response.json()["error"]["reason"] == "invalid-token"


@pytest.mark.parametrize(
    ("token", "reason"),
    [
        ("revoked-token", "token-revoked"),
        ("disabled-token", "user-disabled"),
        ("expired-token", "token-expired"),
        ("garbage", "invalid-token"),
    ],
)
def test_rejected_tokens_return_401_with_a_stable_reason(client, token, reason):
    response = client.get(ME, **bearer(token))

    assert response.status_code == 401
    assert response["WWW-Authenticate"] == "Bearer"
    assert response.json() == {"error": {"reason": reason, "message": f"Rejected: {reason}."}}


def test_scheme_is_case_insensitive(client):
    response = client.get(ME, HTTP_AUTHORIZATION="bearer runner-token")

    assert response.status_code == 200


class TestFailedAuthenticationThrottle:
    @pytest.fixture(autouse=True)
    def _two_failures_per_minute(self, monkeypatch):
        monkeypatch.setitem(SimpleRateThrottle.THROTTLE_RATES, "auth-failed", "2/min")

    def test_an_address_is_blocked_after_too_many_rejected_tokens(self, client):
        assert client.get(ME, **bearer("garbage")).status_code == 401
        assert client.get(ME, **bearer("expired-token")).status_code == 401

        response = client.get(ME, **bearer("garbage"))

        assert response.status_code == 429
        assert int(response["Retry-After"]) > 0
        assert response.json()["error"]["reason"] == "rate-limited"

    def test_a_blocked_address_is_rejected_before_the_token_is_verified(self, client, monkeypatch):
        for _ in range(2):
            client.get(ME, **bearer("garbage"))
        verified = []
        monkeypatch.setattr(FakeTokenVerifier, "verify", lambda self, token: verified.append(token))

        assert client.get(ME, **bearer("runner-token")).status_code == 429
        assert verified == []

    def test_malformed_headers_count_as_failures(self, client):
        for _ in range(2):
            client.get(ME, HTTP_AUTHORIZATION="Bearer one two")

        assert client.get(ME, **bearer("runner-token")).status_code == 429

    def test_failures_are_tracked_per_address(self, client):
        for _ in range(2):
            client.get(ME, **bearer("garbage"), REMOTE_ADDR="10.0.0.1")

        assert client.get(ME, **bearer("garbage"), REMOTE_ADDR="10.0.0.1").status_code == 429
        assert client.get(ME, **bearer("runner-token"), REMOTE_ADDR="10.0.0.2").status_code == 200

    def test_accepted_and_anonymous_requests_do_not_use_the_budget(self, client):
        for _ in range(3):
            assert client.get(ME, **bearer("runner-token")).status_code == 200
            assert client.get(ME).status_code == 401

        assert client.get(ME, **bearer("garbage")).status_code == 401
