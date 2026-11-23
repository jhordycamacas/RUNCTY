"""EP-08: information sources and safety incidents, and their effect on the safety index."""

from datetime import timedelta

import pytest

from apps.cities.domain.models import Ciudad
from apps.routes.domain.time import local_now
from tests.conftest import bearer
from tests.fakes import SETTINGS

ROUTES = "/api/v1/routes"
SOURCES = "/api/v1/information-sources"
INCIDENTS = "/api/v1/safety-incidents"
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
    "coordinates": [{"lat": -3.97, "lng": -79.2}, {"lat": -3.971, "lng": -79.2}],
}
SLOT = {"label": "Night", "startTime": "19:00", "endTime": "23:00"}
SOURCE = {"entity": "ECU 911", "dataType": "Robos reportados", "data": "csv"}
YESTERDAY = (local_now(SETTINGS) - timedelta(days=1)).date().isoformat()

ADMIN = bearer("admin-token")
MANAGER = bearer("club-rep-token")
RUNNER = bearer("runner-token")


@pytest.fixture(autouse=True)
def cities(firebase):
    firebase.cities["loja"] = Ciudad("loja", "Loja", "Loja", "city", -3.99, -79.2, "active")


def error_of(response) -> dict:
    return response.json()["error"]


def create(client, url: str, body: dict) -> str:
    response = client.post(url, body, format="json", **ADMIN)
    assert response.status_code == 201, response.content
    return response.json()["id"]


@pytest.fixture
def route(client) -> dict:
    """A route with one segment and a night slot, without risk factors."""
    route_id = create(client, ROUTES, ROUTE)
    segment_id = create(client, f"{ROUTES}/{route_id}/segments", SEGMENT)
    create(client, f"{ROUTES}/{route_id}/time-slots", SLOT)
    slot_id = client.get(f"{ROUTES}/{route_id}", **ADMIN).json()["timeSlots"][0]["id"]
    return {"id": route_id, "segment": segment_id, "slot": slot_id}


@pytest.fixture
def source_id(client) -> str:
    return create(client, SOURCES, SOURCE)


def incident(route: dict, source_id: str, **changes) -> dict:
    body = {
        "routeId": route["id"],
        "segmentId": route["segment"],
        "type": "robbery",
        "severity": "high",
        "date": YESTERDAY,
        "time": "20:00",
        "sourceId": source_id,
    }
    return {**body, **changes}


def night_score(client, route: dict) -> int:
    return client.get(f"{ROUTES}/{route['id']}", **RUNNER).json()["safety"][route["slot"]]["score"]


class TestAuthorization:
    REQUESTS = [
        ("get", SOURCES, None),
        ("post", SOURCES, SOURCE),
        ("get", f"{SOURCES}/s1", None),
        ("put", f"{SOURCES}/s1", SOURCE),
        ("delete", f"{SOURCES}/s1", None),
        ("get", INCIDENTS, None),
        ("post", INCIDENTS, {}),
        ("get", f"{INCIDENTS}/i1", None),
        ("put", f"{INCIDENTS}/i1", {}),
        ("delete", f"{INCIDENTS}/i1", None),
    ]

    @pytest.mark.parametrize(("method", "url", "body"), REQUESTS)
    def test_anonymous_requests_are_unauthenticated(self, client, method, url, body):
        assert getattr(client, method)(url, body, format="json").status_code == 401

    @pytest.mark.parametrize("token", ["runner-token", "cataloguer-token", "manager-token"])
    @pytest.mark.parametrize(("method", "url", "body"), REQUESTS)
    def test_reads_and_writes_need_routes_manage(self, client, firebase, token, method, url, body):
        response = getattr(client, method)(url, body, format="json", **bearer(token))

        assert response.status_code == 403
        assert error_of(response)["reason"] == "missing-permission"
        assert firebase.docs == {}

    @pytest.mark.parametrize("auth", [MANAGER, ADMIN])
    def test_routes_manage_or_admin_can_use_them(self, client, auth):
        assert client.post(SOURCES, SOURCE, format="json", **auth).status_code == 201
        assert client.get(INCIDENTS, **auth).status_code == 200


class TestSources:
    def test_creates_reads_and_lists_a_source_with_its_load_date(self, client, source_id):
        today = local_now(SETTINGS).date().isoformat()
        expected = {"id": source_id, **SOURCE, "loadedAt": today}

        assert client.get(f"{SOURCES}/{source_id}", **ADMIN).json() == expected
        assert client.get(SOURCES, **ADMIN).json() == {"sources": [expected]}

    def test_the_entity_cannot_repeat_the_same_data_type(self, client, source_id):
        duplicate = {"entity": " ecu 911 ", "dataType": "ROBOS REPORTADOS"}
        response = client.post(SOURCES, duplicate, format="json", **ADMIN)

        assert response.status_code == 409
        assert error_of(response)["reason"] == "source-exists"
        other_type = {"entity": "ECU 911", "dataType": "Accidentes"}
        assert client.post(SOURCES, other_type, format="json", **ADMIN).status_code == 201

    @pytest.mark.parametrize(
        ("body", "reason"),
        [
            ({"dataType": "x"}, "invalid-source-entity"),
            ({"entity": "x", "dataType": "y" * 41}, "invalid-source-data-type"),
            ({"entity": "x", "dataType": "  "}, "invalid-source-data-type"),
            ({"entity": "x", "dataType": "y", "data": 5}, "invalid-source-data"),
        ],
    )
    def test_rejects_incomplete_sources(self, client, firebase, body, reason):
        response = client.post(SOURCES, body, format="json", **ADMIN)

        assert response.status_code == 400
        assert error_of(response)["reason"] == reason
        assert firebase.docs == {}

    def test_updates_a_source_and_stamps_the_load_date(self, client, firebase, source_id):
        firebase.docs[f"informationSources/{source_id}"]["loadedAt"] = "2020-01-01"
        changes = {"entity": "Policía Nacional", "dataType": "Asaltos"}

        response = client.put(f"{SOURCES}/{source_id}", changes, format="json", **ADMIN)

        assert response.status_code == 204
        stored = client.get(f"{SOURCES}/{source_id}", **ADMIN).json()
        assert stored["entity"] == "Policía Nacional"
        assert stored["loadedAt"] == local_now(SETTINGS).date().isoformat()
        assert stored["data"] is None

    def test_an_update_cannot_copy_another_source(self, client, source_id):
        other = create(client, SOURCES, {"entity": "Policía", "dataType": "Robos"})

        response = client.put(f"{SOURCES}/{other}", SOURCE, format="json", **ADMIN)

        assert response.status_code == 409

    @pytest.mark.parametrize("method", ["get", "put", "delete"])
    def test_a_missing_source_is_not_found(self, client, method):
        response = getattr(client, method)(f"{SOURCES}/ghost", SOURCE, format="json", **ADMIN)

        assert response.status_code == 404
        assert error_of(response)["reason"] == "source-not-found"


class TestIncidents:
    def test_creates_an_incident_and_penalizes_its_route(self, client, route, source_id):
        assert night_score(client, route) == 100

        incident_id = create(client, INCIDENTS, incident(route, source_id))

        stored = client.get(f"{INCIDENTS}/{incident_id}", **ADMIN).json()
        assert stored == {"id": incident_id, **incident(route, source_id), "sourceDeleted": False}
        # A robbery is a high penalty (-35) in the slot that covers 19:00-21:00.
        assert night_score(client, route) == 65
        factors = client.get(f"{ROUTES}/{route['id']}", **RUNNER).json()["safety"][route["slot"]][
            "factors"
        ]
        assert factors == [
            {
                "segmentId": route["segment"],
                "segmentName": "Bridge",
                "type": "robbery",
                "severity": "high",
                "description": f"Incidente registrado el {YESTERDAY} a las 20:00.",
                "source": "incident",
            }
        ]

    def test_the_admin_chooses_the_severity_and_types_the_incident_type(
        self, client, route, source_id
    ):
        body = incident(route, source_id, type="  Hurto de bicicleta ", severity="low")
        incident_id = create(client, INCIDENTS, body)

        stored = client.get(f"{INCIDENTS}/{incident_id}", **ADMIN).json()
        assert (stored["type"], stored["severity"]) == ("Hurto de bicicleta", "low")
        assert night_score(client, route) == 90

    def test_an_incident_outside_the_slot_does_not_count(self, client, route, source_id):
        create(client, INCIDENTS, incident(route, source_id, time="10:00"))

        assert night_score(client, route) == 100

    def test_an_incident_on_the_whole_route_penalizes_every_segment(self, client, route, source_id):
        create(
            client,
            INCIDENTS,
            incident(route, source_id, segmentId=None, type="harassment", severity="medium"),
        )

        assert night_score(client, route) == 80

    def test_an_incident_older_than_twelve_months_does_not_count(self, client, route, source_id):
        old = (local_now(SETTINGS) - timedelta(days=400)).date().isoformat()
        create(client, INCIDENTS, incident(route, source_id, date=old))

        assert night_score(client, route) == 100

    @pytest.mark.parametrize(
        ("changes", "status", "reason"),
        [
            ({"routeId": "ghost"}, 404, "route-not-found"),
            ({"segmentId": "ghost"}, 404, "segment-not-found"),
            ({"sourceId": "ghost"}, 404, "source-not-found"),
            ({"type": "  "}, 400, "invalid-incident-type"),
            ({"type": "x" * 41}, 400, "invalid-incident-type"),
            ({"type": 3}, 400, "invalid-incident-type"),
            ({"severity": "critical"}, 400, "invalid-incident-severity"),
            ({"severity": None}, 400, "invalid-incident-severity"),
            ({"date": "2026-02-30"}, 400, "invalid-incident-date"),
            ({"time": "24:00"}, 400, "invalid-incident-time"),
            ({"date": "2999-01-01"}, 400, "incident-in-future"),
            ({"routeId": None}, 400, "invalid-route-id"),
        ],
    )
    def test_rejects_invalid_incidents(
        self, client, firebase, route, source_id, changes, status, reason
    ):
        before = dict(firebase.docs)

        response = client.post(
            INCIDENTS, incident(route, source_id, **changes), format="json", **ADMIN
        )

        assert response.status_code == status
        assert error_of(response)["reason"] == reason
        assert firebase.docs == before

    def test_an_update_keeps_the_date_in_the_past(self, client, route, source_id):
        incident_id = create(client, INCIDENTS, incident(route, source_id))
        body = incident(route, source_id, date="2999-01-01")

        response = client.put(f"{INCIDENTS}/{incident_id}", body, format="json", **ADMIN)

        assert response.status_code == 400
        assert error_of(response)["reason"] == "incident-in-future"

    def test_updating_recalculates_the_index(self, client, route, source_id):
        incident_id = create(client, INCIDENTS, incident(route, source_id))
        body = incident(route, source_id, type="traffic_accident", severity="low")

        response = client.put(f"{INCIDENTS}/{incident_id}", body, format="json", **ADMIN)

        assert response.status_code == 204
        assert night_score(client, route) == 90

    def test_moving_an_incident_recalculates_both_routes(self, client, route, source_id):
        incident_id = create(client, INCIDENTS, incident(route, source_id))
        other_id = create(client, ROUTES, ROUTE)
        create(client, f"{ROUTES}/{other_id}/segments", SEGMENT)
        create(client, f"{ROUTES}/{other_id}/time-slots", SLOT)
        body = incident(route, source_id, routeId=other_id, segmentId=None)

        client.put(f"{INCIDENTS}/{incident_id}", body, format="json", **ADMIN)

        assert night_score(client, route) == 100
        other = client.get(f"{ROUTES}/{other_id}", **RUNNER).json()
        assert [index["score"] for index in other["safety"].values()] == [65]

    def test_deleting_an_incident_restores_the_index(self, client, firebase, route, source_id):
        incident_id = create(client, INCIDENTS, incident(route, source_id))

        response = client.delete(f"{INCIDENTS}/{incident_id}", **ADMIN)

        assert response.status_code == 204
        assert f"safetyIncidents/{incident_id}" not in firebase.docs
        assert night_score(client, route) == 100

    @pytest.mark.parametrize("method", ["get", "put", "delete"])
    def test_a_missing_incident_is_not_found(self, client, method):
        response = getattr(client, method)(f"{INCIDENTS}/ghost", {}, format="json", **ADMIN)

        assert response.status_code == 404
        assert error_of(response)["reason"] == "incident-not-found"

    def test_filters_by_route_segment_type_and_dates(self, client, route, source_id):
        old = (local_now(SETTINGS) - timedelta(days=30)).date().isoformat()
        robbery = create(client, INCIDENTS, incident(route, source_id))
        harassment = create(
            client,
            INCIDENTS,
            incident(route, source_id, type="harassment", severity="medium", date=old),
        )
        whole_route = create(client, INCIDENTS, incident(route, source_id, segmentId=None))

        def ids(query: str) -> list[str]:
            response = client.get(f"{INCIDENTS}?{query}", **ADMIN)
            return [item["id"] for item in response.json()["incidents"]]

        assert ids("") == [whole_route, robbery, harassment]  # newest first
        assert ids(f"routeId={route['id']}&type=harassment") == [harassment]
        assert ids(f"segmentId={route['segment']}") == [robbery, harassment]
        assert ids(f"from={YESTERDAY}") == [whole_route, robbery]
        assert ids(f"to={old}") == [harassment]
        assert ids("routeId=other") == []

    @pytest.mark.parametrize(
        ("query", "reason"),
        [("from=yesterday", "invalid-from-date")],
    )
    def test_rejects_invalid_filters(self, client, query, reason):
        response = client.get(f"{INCIDENTS}?{query}", **ADMIN)

        assert response.status_code == 400
        assert error_of(response)["reason"] == reason


class TestDeletingASource:
    def test_its_incidents_stay_but_stop_counting(self, client, firebase, route, source_id):
        incident_id = create(client, INCIDENTS, incident(route, source_id))
        other_source = create(client, SOURCES, {"entity": "Policía", "dataType": "Robos"})
        create(
            client, INCIDENTS, incident(route, other_source, type="harassment", severity="medium")
        )
        assert night_score(client, route) == 45

        response = client.delete(f"{SOURCES}/{source_id}", **ADMIN)

        assert response.status_code == 204
        assert f"informationSources/{source_id}" not in firebase.docs
        assert client.get(f"{INCIDENTS}/{incident_id}", **ADMIN).json()["sourceDeleted"] is True
        assert night_score(client, route) == 80

    def test_incidents_of_a_deleted_route_are_only_flagged(
        self, client, firebase, route, source_id
    ):
        incident_id = create(client, INCIDENTS, incident(route, source_id))
        client.delete(f"{ROUTES}/{route['id']}", **ADMIN)

        response = client.delete(f"{SOURCES}/{source_id}", **ADMIN)

        assert response.status_code == 204
        assert firebase.docs[f"safetyIncidents/{incident_id}"]["sourceDeleted"] is True
        assert client.delete(f"{INCIDENTS}/{incident_id}", **ADMIN).status_code == 204
