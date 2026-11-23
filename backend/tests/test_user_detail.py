"""RF-01: the admin reads the profile of one account (`GET /users/<uid>`)."""

import pytest
from rest_framework.throttling import SimpleRateThrottle

from apps.users.application.use_cases import get_user_detail
from tests.conftest import bearer
from tests.fakes import InMemorySportProfileRepository, InMemoryUserRepository

SPORT_PROFILE = {
    "level": "intermediate",
    "goals": ["health", "pace"],
    "usualPaceSecPerKm": 390.0,
    "preferredDistanceKm": 10.5,
}
ANA = {
    "uid": "ana-1",
    "email": "ana@runcty.dev",
    "firstName": "Ana",
    "lastName": "Paz",
    "birthDate": "1990-01-01",
    "cityId": "loja",
    "role": "runner",
    "idNumber": "1104567890",
    "consent": {"lopdp": True},
}
ANA_SERIALIZED = {
    "uid": "ana-1",
    "email": "ana@runcty.dev",
    "firstName": "Ana",
    "lastName": "Paz",
    "birthDate": "1990-01-01",
    "cityId": "loja",
    "role": "runner",
    "idNumber": "1104567890",
}
URL = "/api/v1/users/ana-1"


@pytest.fixture
def ana(firebase) -> None:
    firebase.users["ana-1"] = dict(ANA)


class TestGetUserDetail:
    def test_joins_the_profile_and_the_sport_profile(self, firebase, ana):
        firebase.private[("ana-1", "sportProfile")] = SPORT_PROFILE

        detail = get_user_detail(
            "ana-1", InMemoryUserRepository(firebase), InMemorySportProfileRepository(firebase)
        )

        assert detail.user.uid == "ana-1"
        assert detail.sport_profile.level == "intermediate"

    def test_an_account_without_sport_profile_has_none(self, firebase, ana):
        detail = get_user_detail(
            "ana-1", InMemoryUserRepository(firebase), InMemorySportProfileRepository(firebase)
        )

        assert detail.sport_profile is None


class TestUserDetailEndpoint:
    def test_anonymous_callers_are_unauthenticated(self, client, ana):
        assert client.get(URL).status_code == 401

    @pytest.mark.parametrize("token", ["runner-token", "club-rep-token"])
    def test_requires_users_read(self, client, ana, token):
        response = client.get(URL, **bearer(token))

        assert response.status_code == 403
        assert response.json()["error"]["reason"] == "missing-permission"
        assert "ana@runcty.dev" not in response.content.decode()

    def test_returns_the_profile_with_the_sport_profile(self, client, firebase, ana):
        firebase.private[("ana-1", "sportProfile")] = SPORT_PROFILE

        response = client.get(URL, **bearer("user-reader-token"))

        assert response.status_code == 200
        assert response.json() == {
            "user": ANA_SERIALIZED,
            "sportProfile": SPORT_PROFILE,
            "rating": None,
        }

    def test_the_sport_profile_is_null_when_the_account_has_none(self, client, ana):
        response = client.get(URL, **bearer("admin-token"))

        assert response.status_code == 200
        assert response.json() == {"user": ANA_SERIALIZED, "sportProfile": None, "rating": None}

    def test_never_returns_the_photo_or_the_preferences(self, client, firebase, ana):
        firebase.private[("ana-1", "photo")] = {"data": "data:image/png;base64,AAAA"}
        firebase.private[("ana-1", "preferences")] = {"language": "es"}

        response = client.get(URL, **bearer("admin-token"))

        assert "base64" not in response.content.decode()
        assert "language" not in response.content.decode()

    def test_an_unknown_account_is_not_found(self, client):
        response = client.get("/api/v1/users/ghost", **bearer("admin-token"))

        assert response.status_code == 404
        assert response.json()["error"]["reason"] == "user-not-found"

    def test_a_too_long_uid_is_invalid(self, client):
        response = client.get(f"/api/v1/users/{'x' * 129}", **bearer("admin-token"))

        assert response.status_code == 400
        assert response.json()["error"]["reason"] == "invalid-argument"

    def test_me_is_still_the_own_profile(self, client, ana):
        response = client.get("/api/v1/users/me", **bearer("admin-token"))

        assert response.status_code == 200
        assert response.json()["uid"] == "admin-1"
        assert "user" not in response.json()

    def test_has_the_sensitive_rate_limit(self, client, ana, monkeypatch):
        monkeypatch.setitem(SimpleRateThrottle.THROTTLE_RATES, "sensitive", "1/min")

        assert client.get(URL, **bearer("user-reader-token")).status_code == 200
        assert client.get(URL, **bearer("user-reader-token")).status_code == 429
