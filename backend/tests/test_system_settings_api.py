"""`GET`/`PUT /api/v1/settings` and `POST /api/v1/admin/recalculate-routes`."""

import pytest

from apps.cities.domain.models import Ciudad
from apps.shared.domain.models import Principal
from apps.system_settings.domain.models import SystemSettings
from tests.conftest import bearer
from tests.fakes import PRINCIPALS

SETTINGS_URL = "/api/v1/settings"
RECALCULATE = "/api/v1/admin/recalculate-routes"
ROUTES = "/api/v1/routes"
DEFAULTS = SystemSettings.defaults().to_document()
ROUTE = {
    "name": "Jipiro loop",
    "cityId": "loja",
    "start": {"lat": -3.97, "lng": -79.2, "label": "Gate"},
    "end": {"lat": -3.98, "lng": -79.21, "label": "Lake"},
    "distanceKm": 5.2,
    "elevationGainM": 30,
    "surface": "asphalt",
    "difficulty": "beginner",
}
SEGMENT = {
    "name": "Bridge",
    "coordinates": [{"lat": -3.97, "lng": -79.2}, {"lat": -3.9, "lng": -79}],
}
SLOT = {"label": "Night", "startTime": "19:00", "endTime": "23:00"}
FACTOR = {"type": "dark", "severity": "high", "description": "Dark"}

ADMIN = bearer("admin-token")
RUNNER = bearer("runner-token")


@pytest.fixture(autouse=True)
def cities(firebase):
    firebase.cities["loja"] = Ciudad("loja", "Loja", "Loja", "city", -3.99, -79.2, "active")


def create(client, url: str, body: dict) -> str:
    response = client.post(url, body, format="json", **ADMIN)
    assert response.status_code == 201, response.content
    return response.json()["id"]


@pytest.fixture
def route_id(client) -> str:
    """A route with one segment, one night slot and one high risk factor: 100 - 35 = 65."""
    route = create(client, ROUTES, ROUTE)
    segment = create(client, f"{ROUTES}/{route}/segments", SEGMENT)
    create(client, f"{ROUTES}/{route}/time-slots", SLOT)
    create(client, f"{ROUTES}/{route}/segments/{segment}/risk-factors", FACTOR)
    return route


def stored_score(firebase, route_id: str) -> int:
    (index,) = firebase.docs[f"routes/{route_id}"]["safety"].values()
    return index["score"]


class TestAuthorization:
    def test_reading_needs_a_signed_in_user(self, client):
        assert client.get(SETTINGS_URL).status_code == 401

    @pytest.mark.parametrize(("method", "url"), [("put", SETTINGS_URL), ("post", RECALCULATE)])
    def test_writing_is_unauthenticated_without_a_token(self, client, method, url):
        assert getattr(client, method)(url, {}, format="json").status_code == 401

    @pytest.mark.parametrize("token", ["runner-token", "club-rep-token", "cataloguer-token"])
    @pytest.mark.parametrize(("method", "url"), [("put", SETTINGS_URL), ("post", RECALCULATE)])
    def test_writing_needs_settings_manage(self, client, firebase, token, method, url):
        response = getattr(client, method)(url, {}, format="json", **bearer(token))

        assert response.status_code == 403
        assert response.json()["error"]["reason"] == "missing-permission"
        assert "systemSettings/global" not in firebase.docs

    @pytest.mark.parametrize("token", ["runner-token", "club-rep-token"])
    def test_any_signed_in_user_reads_the_parameters(self, client, token):
        assert client.get(SETTINGS_URL, **bearer(token)).status_code == 200

    def test_a_delegate_with_the_permission_may_write(self, client, monkeypatch):
        editor = Principal("settings-1", None, True, "editor", ("admin.access", "settings.manage"))
        monkeypatch.setitem(PRINCIPALS, "settings-editor-token", editor)
        response = client.put(
            SETTINGS_URL, {"nearbyRadiusM": 700}, format="json", **bearer("settings-editor-token")
        )

        assert response.status_code == 200


class TestGet:
    def test_gives_the_defaults_before_anything_is_saved(self, client):
        response = client.get(SETTINGS_URL, **RUNNER)

        assert response.status_code == 200
        assert response.json() == {"settings": DEFAULTS}

    def test_gives_what_an_admin_saved(self, client):
        client.put(SETTINGS_URL, {"nearbyRadiusM": 700}, format="json", **ADMIN)

        settings = client.get(SETTINGS_URL, **RUNNER).json()["settings"]

        assert settings == {**DEFAULTS, "nearbyRadiusM": 700}


class TestPut:
    def test_applies_a_partial_patch_and_returns_every_parameter(self, client, firebase):
        response = client.put(
            SETTINGS_URL,
            {"maxAlertRadiusM": 2000, "timeZone": "America/Bogota"},
            format="json",
            **ADMIN,
        )

        assert response.status_code == 200
        body = response.json()
        assert body["settings"] == {
            **DEFAULTS,
            "maxAlertRadiusM": 2000,
            "timeZone": "America/Bogota",
        }
        assert body["recalculated"] == 0
        assert firebase.docs["systemSettings/global"] == body["settings"]

    def test_rejects_invalid_values_naming_each_field(self, client, firebase):
        response = client.put(
            SETTINGS_URL,
            {"penaltyHigh": 5, "timeZone": "Mars/Olympus", "nearbyRadiusM": "x"},
            format="json",
            **ADMIN,
        )

        assert response.status_code == 400
        error = response.json()["error"]
        assert error["reason"] == "invalid-argument"
        assert error["fields"] == {
            "penaltyHigh": "must-not-be-below-previous",
            "timeZone": "invalid-time-zone",
            "nearbyRadiusM": "invalid",
        }
        assert "systemSettings/global" not in firebase.docs

    def test_rejects_an_unknown_field(self, client):
        response = client.put(SETTINGS_URL, {"penalty": 5}, format="json", **ADMIN)

        assert response.status_code == 400
        assert response.json()["error"]["fields"] == {"penalty": "unknown"}

    def test_changing_the_high_penalty_recalculates_the_routes(self, client, firebase, route_id):
        assert stored_score(firebase, route_id) == 65

        response = client.put(SETTINGS_URL, {"penaltyHigh": 50}, format="json", **ADMIN)

        assert response.json()["recalculated"] == 1
        assert stored_score(firebase, route_id) == 50
        route = client.get(f"{ROUTES}/{route_id}", **RUNNER).json()
        assert [index["score"] for index in route["safety"].values()] == [50]

    def test_the_recalculation_also_follows_new_thresholds(self, client, firebase, route_id):
        client.put(
            SETTINGS_URL, {"thresholdHigh": 90, "thresholdMedium": 70}, format="json", **ADMIN
        )

        (index,) = firebase.docs[f"routes/{route_id}"]["safety"].values()
        assert (index["score"], index["level"]) == (65, "low")


class TestRecalculateRoutes:
    def test_recomputes_every_route_and_returns_the_count(self, client, firebase, route_id):
        firebase.docs["systemSettings/global"] = {**DEFAULTS, "penaltyHigh": 60}

        response = client.post(RECALCULATE, {}, format="json", **ADMIN)

        assert response.status_code == 200
        assert response.json() == {"recalculated": 1}
        assert stored_score(firebase, route_id) == 40

    def test_is_zero_without_routes(self, client):
        response = client.post(RECALCULATE, {}, format="json", **ADMIN)

        assert response.json() == {"recalculated": 0}


class TestParametersApplyAcrossTheApi:
    def test_the_segment_limit_follows_the_settings(self, client, route_id):
        client.put(SETTINGS_URL, {"maxSegmentsPerRoute": 1}, format="json", **ADMIN)

        response = client.post(f"{ROUTES}/{route_id}/segments", SEGMENT, format="json", **ADMIN)

        assert response.status_code == 400
        assert response.json()["error"]["reason"] == "too-many-segments"

    def test_the_route_name_length_follows_the_settings(self, client):
        client.put(SETTINGS_URL, {"routeNameMaxLength": 10}, format="json", **ADMIN)

        response = client.post(
            ROUTES, {**ROUTE, "name": "A name that is too long"}, format="json", **ADMIN
        )

        assert response.status_code == 400
        assert response.json()["error"]["reason"] == "invalid-route-name"

    def test_new_cities_carry_the_configured_country(self, client):
        client.put(SETTINGS_URL, {"countryCode": "PE"}, format="json", **ADMIN)
        city = {
            "id": "cusco",
            "name": "Cusco",
            "province": "Cusco",
            "type": "city",
            "location": {"lat": -13.5, "lng": -71.9},
            "coverage": "planned",
        }

        response = client.post("/api/v1/cities", city, format="json", **ADMIN)

        assert response.status_code == 201
        assert response.json()["country"] == "PE"

    def test_the_sport_profile_ranges_follow_the_settings(self, client):
        profile = {
            "level": "beginner",
            "goals": ["health"],
            "usualPaceSecPerKm": 100,
            "preferredDistanceKm": 5,
        }
        rejected = client.put("/api/v1/users/me/sport-profile", profile, format="json", **RUNNER)
        client.put(SETTINGS_URL, {"paceMinSecPerKm": 60}, format="json", **ADMIN)

        accepted = client.put("/api/v1/users/me/sport-profile", profile, format="json", **RUNNER)

        assert rejected.status_code == 400
        assert accepted.status_code == 200

    def test_the_photo_limits_are_served_and_validated(self, client):
        served = client.get(SETTINGS_URL, **RUNNER).json()["settings"]
        rejected = client.put(SETTINGS_URL, {"profilePhotoMaxPx": 2000}, format="json", **ADMIN)
        saved = client.put(SETTINGS_URL, {"profilePhotoMaxPx": 512}, format="json", **ADMIN)

        assert (served["profilePhotoMaxKb"], served["profilePhotoMaxPx"]) == (100, 256)
        assert rejected.status_code == 400
        assert rejected.json()["error"]["fields"] == {"profilePhotoMaxPx": "out-of-range"}
        assert saved.json()["settings"]["profilePhotoMaxPx"] == 512
