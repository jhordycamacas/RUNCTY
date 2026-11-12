import pytest

from tests.conftest import bearer

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
