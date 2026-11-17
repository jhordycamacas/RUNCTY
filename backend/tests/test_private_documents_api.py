"""`users/{uid}/private/*`: every endpoint acts on the token owner's documents only."""

import pytest

from tests.conftest import bearer
from tests.fakes import RUNNER

SPORT_PROFILE = {
    "level": "intermediate",
    "goals": ["health", "pace"],
    "usualPaceSecPerKm": 390.0,
    "preferredDistanceKm": 10.5,
}
PREFERENCES = {
    "language": "es",
    "fontScale": "large",
    "appearance": "dark",
    "units": "imperial",
    "notifications": {"enabled": True, "safetyAlerts": False, "events": True},
    "locationPrivacy": "off",
}

# url, Firestore document id, valid body, reason when missing
RESOURCES = [
    pytest.param(
        "/api/v1/users/me/sport-profile",
        "sportProfile",
        SPORT_PROFILE,
        "sport-profile-not-found",
        id="sport-profile",
    ),
    pytest.param(
        "/api/v1/users/me/preferences",
        "preferences",
        PREFERENCES,
        "preferences-not-found",
        id="preferences",
    ),
]


def error_of(response) -> dict:
    return response.json()["error"]


@pytest.mark.parametrize(("url", "document", "body", "missing"), RESOURCES)
class TestOwnPrivateDocument:
    @pytest.mark.parametrize("method", ["get", "put", "delete"])
    def test_anonymous_callers_are_unauthenticated(
        self, client, firebase, url, document, body, missing, method
    ):
        response = getattr(client, method)(url, body, format="json")

        assert response.status_code == 401
        assert firebase.private == {}

    def test_a_document_never_saved_is_not_found(self, client, url, document, body, missing):
        response = client.get(url, **bearer("runner-token"))

        assert response.status_code == 404
        assert error_of(response)["reason"] == missing

    def test_saves_and_returns_the_document(self, client, firebase, url, document, body, missing):
        saved = client.put(url, body, format="json", **bearer("runner-token"))

        assert saved.status_code == 200
        assert saved.json() == body
        assert firebase.private == {(RUNNER.uid, document): body}
        assert client.get(url, **bearer("runner-token")).json() == body

    def test_replaces_the_whole_document(self, client, firebase, url, document, body, missing):
        firebase.private[(RUNNER.uid, document)] = {**body, "legacy": True}

        client.put(url, body, format="json", **bearer("runner-token"))

        assert firebase.private[(RUNNER.uid, document)] == body

    def test_other_users_cannot_reach_it(self, client, firebase, url, document, body, missing):
        client.put(url, body, format="json", **bearer("runner-token"))

        assert client.get(url, **bearer("admin-token")).status_code == 404
        assert client.delete(url, **bearer("admin-token")).status_code == 204
        assert list(firebase.private) == [(RUNNER.uid, document)]

    @pytest.mark.parametrize("field", ["uid", "updatedAt"])
    def test_unknown_fields_are_rejected(
        self, client, firebase, url, document, body, missing, field
    ):
        response = client.put(
            url, {**body, field: "admin-1"}, format="json", **bearer("runner-token")
        )

        assert response.status_code == 400
        assert error_of(response)["fields"] == {field: "unknown"}
        assert firebase.private == {}

    def test_missing_fields_are_rejected(self, client, firebase, url, document, body, missing):
        response = client.put(url, {}, format="json", **bearer("runner-token"))

        assert response.status_code == 400
        assert set(error_of(response)["fields"].values()) == {"required"}
        assert set(error_of(response)["fields"]) == set(body)

    def test_deleting_is_idempotent(self, client, firebase, url, document, body, missing):
        client.put(url, body, format="json", **bearer("runner-token"))

        assert client.delete(url, **bearer("runner-token")).status_code == 204
        assert client.delete(url, **bearer("runner-token")).status_code == 204
        assert firebase.private == {}
        assert client.get(url, **bearer("runner-token")).status_code == 404


class TestSportProfileValues:
    URL = "/api/v1/users/me/sport-profile"

    def test_values_outside_the_schema_are_reported_per_field(self, client, firebase):
        body = {**SPORT_PROFILE, "level": "pro", "usualPaceSecPerKm": 100, "goals": ["fly"]}

        response = client.put(self.URL, body, format="json", **bearer("runner-token"))

        assert response.status_code == 400
        assert error_of(response)["fields"] == {
            "level": "invalid-choice",
            "goals": "invalid-choice",
            "usualPaceSecPerKm": "out-of-range",
        }
        assert firebase.private == {}

    def test_a_stored_profile_that_no_longer_matches_is_not_found(self, client, firebase):
        firebase.private[(RUNNER.uid, "sportProfile")] = {**SPORT_PROFILE, "level": "pro"}

        assert client.get(self.URL, **bearer("runner-token")).status_code == 404


class TestPreferencesValues:
    URL = "/api/v1/users/me/preferences"

    def test_values_outside_the_schema_are_reported_per_field(self, client, firebase):
        body = {
            **PREFERENCES,
            "language": "en",
            "notifications": {"enabled": True, "safetyAlerts": True, "events": True, "sms": True},
        }

        response = client.put(self.URL, body, format="json", **bearer("runner-token"))

        assert response.status_code == 400
        assert error_of(response)["fields"] == {"notifications.sms": "unknown"}

        body["notifications"].pop("sms")
        response = client.put(self.URL, body, format="json", **bearer("runner-token"))

        assert error_of(response)["fields"] == {"language": "invalid-choice"}
        assert firebase.private == {}

    def test_invalid_stored_fields_fall_back_to_the_defaults(self, client, firebase):
        firebase.private[(RUNNER.uid, "preferences")] = {"fontScale": "xlarge", "units": "parsecs"}

        response = client.get(self.URL, **bearer("runner-token"))

        assert response.json() == {
            "language": "es",
            "fontScale": "xlarge",
            "appearance": "light",
            "units": "metric",
            "notifications": {"enabled": True, "safetyAlerts": True, "events": True},
            "locationPrivacy": "trustedContactsDuringSession",
        }
