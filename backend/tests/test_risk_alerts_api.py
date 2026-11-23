"""RF-07-12 to RF-07-15: risk zone alerts."""

from datetime import datetime, timedelta

import pytest

from apps.cities.domain.models import Ciudad
from apps.risk_alerts.domain.models import AlertaZonaRiesgo
from apps.routes.domain.time import local_now
from tests.conftest import bearer

ROUTES = "/api/v1/routes"
ALERTS = "/api/v1/risk-zone-alerts"
TODAY = local_now().date()
ALERT = {
    "type": "Robos frecuentes",
    "severity": "media",
    "description": "Reportes de robos de celulares al anochecer.",
    "location": {"lat": -3.99, "lng": -79.2},
    "radiusM": 300,
    "cityId": "loja",
    "routeId": None,
    "validFrom": (TODAY - timedelta(days=1)).isoformat(),
    "validTo": (TODAY + timedelta(days=7)).isoformat(),
    "startTime": None,
    "endTime": None,
}
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

ADMIN = bearer("admin-token")
MANAGER = bearer("club-rep-token")
RUNNER = bearer("runner-token")


@pytest.fixture(autouse=True)
def cities(firebase):
    firebase.cities["loja"] = Ciudad("loja", "Loja", "Loja", "city", -3.99, -79.2, "active")
    firebase.cities["quito"] = Ciudad("quito", "Quito", "Pichincha", "city", -0.2, -78.5, "active")


def error_of(response) -> dict:
    return response.json()["error"]


def create(client, url: str, body: dict) -> str:
    response = client.post(url, body, format="json", **ADMIN)
    assert response.status_code == 201, response.content
    return response.json()["id"]


class TestAuthorization:
    WRITES = [
        ("post", ALERTS, ALERT),
        ("put", f"{ALERTS}/a1", ALERT),
        ("delete", f"{ALERTS}/a1", None),
    ]

    @pytest.mark.parametrize("url", [ALERTS, f"{ALERTS}/a1"])
    def test_anonymous_reads_are_unauthenticated(self, client, url):
        assert client.get(url).status_code == 401

    @pytest.mark.parametrize("token", ["runner-token", "cataloguer-token"])
    @pytest.mark.parametrize(("method", "url", "body"), WRITES)
    def test_writes_need_routes_manage(self, client, firebase, token, method, url, body):
        response = getattr(client, method)(url, body, format="json", **bearer(token))

        assert response.status_code == 403
        assert error_of(response)["reason"] == "missing-permission"
        assert firebase.docs == {}

    def test_runners_read_what_managers_write(self, client):
        alert_id = create(client, ALERTS, ALERT)
        assert client.post(ALERTS, ALERT, format="json", **MANAGER).status_code == 201

        assert client.get(f"{ALERTS}/{alert_id}", **RUNNER).json() == {"id": alert_id, **ALERT}


class TestAlerts:
    @pytest.mark.parametrize(
        ("changes", "status", "reason"),
        [
            ({"type": " "}, 400, "invalid-alert-type"),
            ({"type": "x" * 41}, 400, "invalid-alert-type"),
            ({"severity": "high"}, 400, "invalid-alert-severity"),
            ({"description": None}, 400, "invalid-alert-description"),
            ({"location": {"lat": "x", "lng": 0}}, 400, "invalid-location"),
            ({"radiusM": 0}, 400, "invalid-alert-radius"),
            ({"radiusM": 5001}, 400, "invalid-alert-radius"),
            ({"cityId": "cuenca"}, 404, "city-not-found"),
            ({"routeId": "ghost"}, 404, "route-not-found"),
            ({"validFrom": "2026-13-01"}, 400, "invalid-valid-from"),
            ({"validTo": None}, 400, "invalid-valid-to"),
            ({"validFrom": "2999-01-01"}, 400, "invalid-date-range"),
            ({"startTime": "20:00", "endTime": "06:00"}, 400, "invalid-time-range"),
        ],
    )
    def test_rejects_invalid_alerts(self, client, firebase, changes, status, reason):
        response = client.post(ALERTS, {**ALERT, **changes}, format="json", **ADMIN)

        assert response.status_code == status
        assert error_of(response)["reason"] == reason
        assert firebase.docs == {}

    def test_an_alert_may_belong_to_a_route_and_have_a_daily_window(self, client):
        route_id = create(client, ROUTES, ROUTE)
        body = {**ALERT, "routeId": route_id, "startTime": "18:00", "endTime": "22:00"}

        alert_id = create(client, ALERTS, body)

        assert client.get(f"{ALERTS}/{alert_id}", **RUNNER).json() == {"id": alert_id, **body}

    def test_updates_and_deletes_an_alert(self, client):
        alert_id = create(client, ALERTS, ALERT)
        changes = {**ALERT, "severity": "alta", "radiusM": 500}

        assert (
            client.put(f"{ALERTS}/{alert_id}", changes, format="json", **ADMIN).status_code == 204
        )
        assert client.get(f"{ALERTS}/{alert_id}", **RUNNER).json()["severity"] == "alta"
        assert client.delete(f"{ALERTS}/{alert_id}", **ADMIN).status_code == 204
        assert client.get(ALERTS, **RUNNER).json() == {"alerts": []}

    @pytest.mark.parametrize("method", ["get", "put", "delete"])
    def test_a_missing_alert_is_not_found(self, client, method):
        response = getattr(client, method)(f"{ALERTS}/ghost", {}, format="json", **ADMIN)

        assert response.status_code == 404
        assert error_of(response)["reason"] == "alert-not-found"

    def test_runners_get_only_the_alerts_in_force_in_their_city(self, client):
        in_force = create(client, ALERTS, ALERT)
        severe = create(client, ALERTS, {**ALERT, "severity": "alta"})
        all_day = create(client, ALERTS, {**ALERT, "startTime": "00:00", "endTime": "24:00"})
        expired = create(
            client,
            ALERTS,
            {**ALERT, "validFrom": "2025-01-01", "validTo": (TODAY - timedelta(1)).isoformat()},
        )
        create(client, ALERTS, {**ALERT, "cityId": "quito"})

        def ids(query: str) -> list[str]:
            response = client.get(f"{ALERTS}?{query}", **RUNNER)
            assert response.status_code == 200, response.content
            return [alert["id"] for alert in response.json()["alerts"]]

        assert ids("cityId=loja&active=true") == [severe, all_day, in_force]
        assert ids("cityId=loja") == [severe, all_day, in_force, expired]

    def test_filters_by_route(self, client):
        route_id = create(client, ROUTES, ROUTE)
        on_route = create(client, ALERTS, {**ALERT, "routeId": route_id})
        create(client, ALERTS, ALERT)

        response = client.get(f"{ALERTS}?routeId={route_id}", **RUNNER)

        assert [alert["id"] for alert in response.json()["alerts"]] == [on_route]

    def test_rejects_an_invalid_active_flag(self, client):
        response = client.get(f"{ALERTS}?active=maybe", **RUNNER)

        assert response.status_code == 400
        assert response.json()["error"]["fields"] == {"active": "invalid"}


class TestInForce:
    ALL_DAY = AlertaZonaRiesgo.parse(
        {**ALERT, "validFrom": "2026-11-20", "validTo": "2026-11-22"}, "a1"
    )
    NIGHT = AlertaZonaRiesgo.parse(
        {
            **ALERT,
            "validFrom": "2026-11-20",
            "validTo": "2026-11-22",
            "startTime": "18:00",
            "endTime": "22:00",
        },
        "a2",
    )

    @pytest.mark.parametrize(
        ("moment", "expected"),
        [
            (datetime(2026, 11, 19, 23, 59), False),
            (datetime(2026, 11, 20, 0, 0), True),
            (datetime(2026, 11, 22, 23, 59), True),
            (datetime(2026, 11, 23, 0, 0), False),
        ],
    )
    def test_an_alert_is_in_force_between_its_dates(self, moment, expected):
        assert self.ALL_DAY.is_active(moment) is expected

    @pytest.mark.parametrize(
        ("moment", "expected"),
        [
            (datetime(2026, 11, 21, 17, 59), False),
            (datetime(2026, 11, 21, 18, 0), True),
            (datetime(2026, 11, 21, 21, 59), True),
            (datetime(2026, 11, 21, 22, 0), False),
        ],
    )
    def test_a_daily_window_limits_the_hours(self, moment, expected):
        assert self.NIGHT.is_active(moment) is expected
