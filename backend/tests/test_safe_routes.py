"""EP-09: the recommendation rule and the safe route requests API."""

from datetime import datetime

import pytest

from apps.cities.domain.models import Ciudad
from apps.routes.domain.models import PuntoRuta, Ruta
from apps.safe_routes.domain.models import SolicitudRutaSegura, recommend
from apps.shared.domain.errors import DomainError
from apps.system_settings.domain.models import SystemSettings
from tests.conftest import bearer
from tests.fakes import SETTINGS

REQUESTS = "/api/v1/safe-route-requests"
RUNNER = bearer("runner-token")
OTHER_RUNNER = bearer("admin-token")
PLACE = PuntoRuta(-3.97, -79.2, "Gate")
BODY = {"cityId": "loja", "distanceKm": 5, "startTime": "18:00", "endTime": "20:00"}


def slot(start: str, end: str, score: int, level: str = "high") -> dict:
    return {"startTime": start, "endTime": end, "score": score, "level": level, "factors": []}


def route(route_id: str, distance_km: float, safety: dict, **changes) -> Ruta:
    values = {
        "id": route_id,
        "name": route_id.upper(),
        "city_id": "loja",
        "description": "",
        "start": PLACE,
        "end": PLACE,
        "distance_km": distance_km,
        "elevation_gain_m": 0,
        "surface": "asphalt",
        "difficulty": "beginner",
        "active": True,
        "safety": safety,
        **changes,
    }
    return Ruta(**values)


def request(**changes) -> SolicitudRutaSegura:
    return SolicitudRutaSegura.parse(
        {**BODY, **changes}, "q1", "runner-1", datetime(2026, 11, 22, 8, 0), SETTINGS
    )


class TestRecommendation:
    def test_keeps_active_routes_of_the_city_within_twenty_percent(self):
        routes = [
            route("in-low", 4.0, {}),
            route("in-high", 6.0, {}),
            route("too-short", 3.9, {}),
            route("too-long", 6.1, {}),
            route("inactive", 5.0, {}, active=False),
            route("quito", 5.0, {}, city_id="quito"),
        ]

        ids = [match.route.id for match in recommend(routes, request(), SETTINGS)]

        assert sorted(ids) == ["in-high", "in-low"]

    def test_orders_by_the_score_of_the_overlapping_slot_then_distance_then_no_index(self):
        routes = [
            route("no-index", 5.0, {}),
            route("other-slot-only", 5.0, {"morning": slot("05:00", "07:00", 100)}),
            route("medium", 5.0, {"evening": slot("18:00", "20:00", 60, "medium")}),
            route("high-far", 5.8, {"evening": slot("17:00", "19:00", 90)}),
            route("high-near", 5.1, {"evening": slot("19:00", "21:00", 90)}),
        ]

        matches = recommend(routes, request(), SETTINGS)

        assert [m.route.id for m in matches] == [
            "high-near",
            "high-far",
            "medium",
            "no-index",
            "other-slot-only",
        ]
        assert (matches[0].safety.slot_id, matches[0].safety.score) == ("evening", 90)
        assert matches[-1].safety is None

    def test_the_worst_of_several_overlapping_slots_counts(self):
        safety = {
            "early": slot("17:00", "19:00", 80),
            "late": slot("19:00", "21:00", 30, "low"),
            "broken": {"startTime": "x", "score": 0},
        }

        (match,) = recommend([route("r", 5.0, safety)], request(), SETTINGS)

        assert (match.safety.slot_id, match.safety.level) == ("late", "low")


@pytest.fixture(autouse=True)
def cities(firebase):
    firebase.cities["loja"] = Ciudad("loja", "Loja", "Loja", "city", -3.99, -79.2, "active")
    firebase.cities["cuenca"] = Ciudad("cuenca", "Cuenca", "Azuay", "city", -2.9, -79.0, "planned")
    firebase.docs["routes/safe"] = {
        "name": "Safe",
        "cityId": "loja",
        "distanceKm": 5.2,
        "active": True,
        "safety": {"evening": slot("18:00", "20:00", 90)},
    }
    firebase.docs["routes/risky"] = {
        "name": "Risky",
        "cityId": "loja",
        "distanceKm": 5.0,
        "active": True,
        "safety": {"evening": slot("18:00", "20:00", 30, "low")},
    }


def error_of(response) -> dict:
    return response.json()["error"]


def create(client, body: dict = BODY, auth: dict = RUNNER) -> dict:
    response = client.post(REQUESTS, body, format="json", **auth)
    assert response.status_code == 201, response.content
    return response.json()


class TestApi:
    def test_anonymous_requests_are_unauthenticated(self, client):
        assert client.post(REQUESTS, BODY, format="json").status_code == 401
        assert client.get(REQUESTS).status_code == 401
        assert client.get(f"{REQUESTS}/q1").status_code == 401
        assert client.delete(f"{REQUESTS}/q1").status_code == 401

    def test_creating_stores_the_request_and_returns_the_recommendation(self, client, firebase):
        created = create(client)

        assert [item["route"]["id"] for item in created["routes"]] == ["safe", "risky"]
        assert created["routes"][0]["safety"] == {"slotId": "evening", **slot("18:00", "20:00", 90)}
        stored = firebase.docs[f"safeRouteRequests/{created['id']}"]
        assert {key: stored[key] for key in BODY} == BODY
        assert stored["uid"] == "runner-1"
        assert datetime.fromisoformat(stored["createdAt"]).utcoffset().total_seconds() == -5 * 3600

    @pytest.mark.parametrize(
        ("changes", "status", "reason"),
        [
            ({"distanceKm": 0}, 400, "invalid-distance"),
            ({"distanceKm": "5"}, 400, "invalid-distance"),
            ({"cityId": "quito"}, 404, "city-not-found"),
            ({"cityId": "cuenca"}, 400, "city-not-enabled"),
            ({"startTime": "20:00", "endTime": "18:00"}, 400, "invalid-time-range"),
            ({"endTime": None}, 400, "invalid-end-time"),
        ],
    )
    def test_rejects_invalid_requests(self, client, firebase, changes, status, reason):
        response = client.post(REQUESTS, {**BODY, **changes}, format="json", **RUNNER)

        assert response.status_code == status
        assert error_of(response)["reason"] == reason
        assert not any(path.startswith("safeRouteRequests/") for path in firebase.docs)

    @pytest.mark.parametrize("coverage", ["active", " Active ", "ACTIVA", "activo", "Activo "])
    def test_free_text_coverage_that_means_active_enables_the_city(
        self, client, firebase, coverage
    ):
        firebase.cities["loja"] = Ciudad("loja", "Loja", "Loja", "city", -3.99, -79.2, coverage)

        assert client.post(REQUESTS, BODY, format="json", **RUNNER).status_code == 201

    @pytest.mark.parametrize("coverage", ["", "planned", "inactiva", "en proceso"])
    def test_any_other_coverage_text_does_not_enable_the_city(self, client, firebase, coverage):
        firebase.cities["loja"] = Ciudad("loja", "Loja", "Loja", "city", -3.99, -79.2, coverage)

        response = client.post(REQUESTS, BODY, format="json", **RUNNER)

        assert response.status_code == 400
        assert error_of(response)["reason"] == "city-not-enabled"

    def test_a_runner_lists_only_their_requests_newest_first(self, client, firebase):
        first = create(client)["id"]
        second = create(client, {**BODY, "distanceKm": 10})["id"]
        firebase.docs[f"safeRouteRequests/{first}"]["createdAt"] = "2026-01-01T08:00:00-05:00"
        create(client, auth=OTHER_RUNNER)

        listed = client.get(REQUESTS, **RUNNER).json()["requests"]

        assert [item["id"] for item in listed] == [second, first]
        assert listed[1] == {"id": first, **BODY, "createdAt": "2026-01-01T08:00:00-05:00"}

    def test_reading_one_request_recomputes_the_recommendation(self, client, firebase):
        request_id = create(client)["id"]
        firebase.docs["routes/safe"]["active"] = False

        detail = client.get(f"{REQUESTS}/{request_id}", **RUNNER).json()

        assert detail["id"] == request_id and detail["distanceKm"] == 5
        assert [item["route"]["id"] for item in detail["routes"]] == ["risky"]

    def test_an_empty_recommendation_is_an_empty_list(self, client):
        assert create(client, {**BODY, "distanceKm": 50})["routes"] == []

    def test_runners_cannot_read_or_delete_requests_of_others(self, client, firebase):
        request_id = create(client)["id"]

        for method in ("get", "delete"):
            response = getattr(client, method)(f"{REQUESTS}/{request_id}", **OTHER_RUNNER)
            assert response.status_code == 404
            assert error_of(response)["reason"] == "safe-route-request-not-found"
        assert f"safeRouteRequests/{request_id}" in firebase.docs

    def test_the_owner_deletes_a_request(self, client, firebase):
        request_id = create(client)["id"]

        assert client.delete(f"{REQUESTS}/{request_id}", **RUNNER).status_code == 204
        assert f"safeRouteRequests/{request_id}" not in firebase.docs
        assert client.delete(f"{REQUESTS}/{request_id}", **RUNNER).status_code == 404


class TestWithOtherSettings:
    def test_the_distance_tolerance_follows_the_settings(self):
        wide = SystemSettings.defaults().with_changes({"safeRouteDistanceTolerance": 0.5})
        routes = [route("far", 7.0, {}), route("near", 5.5, {})]

        assert [m.route.id for m in recommend(routes, request(), SETTINGS)] == ["near"]
        assert sorted(m.route.id for m in recommend(routes, request(), wide)) == ["far", "near"]

    def test_the_maximum_distance_follows_the_settings(self):
        small = SystemSettings.defaults().with_changes({"safeRouteMaxDistanceKm": 10})
        body = {**BODY, "distanceKm": 11}

        with pytest.raises(DomainError) as error:
            SolicitudRutaSegura.parse(body, "q1", "runner-1", datetime(2026, 11, 22, 8), small)

        assert error.value.reason == "invalid-distance"
        assert SolicitudRutaSegura.parse(
            body, "q1", "runner-1", datetime(2026, 11, 22, 8), SETTINGS
        )
