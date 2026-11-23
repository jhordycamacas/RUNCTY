import json
from datetime import datetime, timedelta, timezone

import pytest

from apps.cities.domain.models import Ciudad
from apps.routes.domain.time import local_now
from apps.summary.application import use_cases
from apps.system_settings.domain.models import SystemSettings
from tests.conftest import bearer

URL = "/api/v1/admin/summary"
LOJA = Ciudad("loja", "Loja", "Loja", "city", -3.99, -79.2, "active")
ZONE = Ciudad("loja-centro", "Centro", "Loja", "zone", -3.99, -79.2, "planned", "loja")


def route_document(**changes) -> dict:
    point = {"lat": -3.99, "lng": -79.2, "label": "A"}
    return {
        "name": "Ruta",
        "cityId": "loja",
        "description": "",
        "start": point,
        "end": point,
        "distanceKm": 8.0,
        "elevationGainM": 0,
        "surface": "asphalt",
        "difficulty": "beginner",
        "active": True,
        **changes,
    }


def alert_document(valid_from, valid_to) -> dict:
    return {
        "type": "Robos",
        "severity": "alta",
        "description": "Zona",
        "location": {"lat": -3.99, "lng": -79.2},
        "radiusM": 200,
        "cityId": "loja",
        "validFrom": valid_from.isoformat(),
        "validTo": valid_to.isoformat(),
    }


@pytest.fixture
def data(firebase):
    """Six accounts from the token fixture plus two runners, routes, slots and factors."""
    now = datetime.now(timezone.utc)
    firebase.cities.update({"loja": LOJA, "loja-centro": ZONE})
    firebase.users["runner-1"]["createdAt"] = now - timedelta(days=1)
    firebase.users["admin-1"]["createdAt"] = now - timedelta(days=60)
    firebase.users["runner-1"]["cityId"] = "loja"
    firebase.users["admin-1"]["cityId"] = "quito"
    firebase.private[("runner-1", "sportProfile")] = {"level": "beginner", "goals": ["health"]}
    firebase.private[("runner-1", "preferences")] = {"appearance": "dark"}
    safety = {"slot-1": {"level": "high", "score": 90}, "slot-2": {"level": "low", "score": 10}}
    firebase.docs["routes/r1"] = route_document(safety=safety, distanceKm=8.5)
    firebase.docs["routes/r2"] = route_document(active=False, difficulty="advanced")
    firebase.docs["routes/r1/timeSlots/slot-1"] = {"startTime": "06:00", "endTime": "09:00"}
    firebase.docs["routes/r1/segments/s1"] = {"name": "Tramo"}
    firebase.docs["routes/r1/segments/s1/riskFactors/f1"] = {"severity": "high", "type": "x"}
    today = local_now(SystemSettings.defaults()).date()
    firebase.docs["riskZoneAlerts/in-force"] = alert_document(today, today + timedelta(days=3))
    firebase.docs["riskZoneAlerts/expired"] = alert_document(
        today - timedelta(days=9), today - timedelta(days=2)
    )
    firebase.docs["safetyIncidents/recent"] = {"date": (today - timedelta(days=2)).isoformat()}
    firebase.docs["safetyIncidents/old"] = {"date": (today - timedelta(days=45)).isoformat()}


class TestAuthorization:
    def test_anonymous_callers_are_unauthenticated(self, client):
        response = client.get(URL)

        assert response.status_code == 401
        assert response.json()["error"]["reason"] == "unauthenticated"

    @pytest.mark.parametrize("token", ["runner-token", "user-reader-token"])
    def test_callers_without_admin_access_are_forbidden(self, client, token):
        response = client.get(URL, **bearer(token))

        assert response.status_code == 403
        assert response.json()["error"]["reason"] == "missing-permission"

    def test_the_city_comparison_needs_the_permissions_of_both_blocks(self, client, data):
        assert client.get(URL, **bearer("manager-token")).json()["byCity"] is None
        assert client.get(URL, **bearer("club-rep-token")).json()["byCity"] is None
        assert client.get(URL, **bearer("admin-token")).json()["byCity"] is not None

    def test_an_administrator_gets_every_block(self, client, data):
        body = client.get(URL, **bearer("admin-token")).json()

        assert body["users"] is not None
        assert body["routes"] is not None
        assert body["cities"] is not None

    @pytest.mark.parametrize(
        ("token", "blocks"),
        [
            ("manager-token", {"users"}),
            ("club-rep-token", {"routes"}),
            ("cataloguer-token", {"cities"}),
        ],
    )
    def test_a_delegate_only_gets_the_blocks_of_its_permissions(self, client, data, token, blocks):
        body = client.get(URL, **bearer(token)).json()

        present = {name for name in ("users", "routes", "cities") if body[name] is not None}
        assert present == blocks

    def test_rejects_unknown_parameters(self, client, data):
        response = client.get(URL, {"page": "2"}, **bearer("admin-token"))

        assert response.status_code == 400


class TestPayload:
    def test_summarises_users_routes_and_cities(self, client, data):
        body = client.get(URL, **bearer("admin-token")).json()

        assert body["truncated"] is False
        assert body["generatedAt"].endswith("Z")
        users = body["users"]
        assert users["total"] == 7
        assert users["byRole"]["runner"] == 1
        assert users["registeredLast7Days"] == 1
        assert users["registeredLast30Days"] == 1
        assert "registrationsByWeek" not in users
        assert users["signups"]["before"]["daily"] == 1
        assert sum(bucket["count"] for bucket in users["signups"]["daily"]) == 1
        assert users["sportProfiles"] == {"completed": 1, "percentage": 14}
        assert users["preferences"]["appearance"]["dark"] == 1
        routes = body["routes"]
        assert (routes["total"], routes["active"], routes["inactive"]) == (2, 1, 1)
        assert routes["totalKm"] == 16.5
        assert routes["safetyLevels"] == {"high": 0, "medium": 0, "low": 1, "unrated": 1}
        assert routes["distances"] == [
            {"name": "Ruta", "distanceKm": 8.5},
            {"name": "Ruta", "distanceKm": 8.0},
        ]
        assert routes["timeSlots"] == 1
        assert routes["riskFactors"]["bySeverity"]["high"] == 1
        assert routes["byCity"] == [{"cityId": "loja", "cityName": "Loja", "count": 2}]
        assert body["cities"] == {"cities": 1, "zones": 1}

    def test_compares_routes_and_users_per_city_and_users_per_sport_level(self, client, data):
        body = client.get(URL, **bearer("admin-token")).json()

        assert body["users"]["bySportLevel"] == [{"level": "beginner", "users": 1}]
        assert {"cityId": "loja", "name": "Loja", "routes": 2, "users": 6} in body["byCity"]
        assert {"cityId": "quito", "name": "quito", "routes": 0, "users": 1} in body["byCity"]

    def test_the_signup_ranges_have_their_fixed_length(self, client, data):
        signups = client.get(URL, **bearer("admin-token")).json()["users"]["signups"]

        assert [len(signups[name]) for name in ("daily", "weekly", "monthly")] == [30, 12, 12]
        assert set(signups["before"]) == {"daily", "weekly", "monthly"}
        assert set(signups["daily"][0]) == {"start", "count"}

    def test_the_weeks_start_on_monday_in_the_time_zone_of_the_settings(
        self, client, data, firebase
    ):
        firebase.docs["systemSettings/global"] = {"timeZone": "Asia/Tokyo"}

        weekly = client.get(URL, **bearer("admin-token")).json()["users"]["signups"]["weekly"]

        assert all(datetime.fromisoformat(b["start"]).weekday() == 0 for b in weekly)

    def test_lists_the_five_newest_accounts_with_no_sensitive_fields(self, client, data, firebase):
        now = datetime.now(timezone.utc)
        for index in range(7):
            firebase.users[f"extra-{index}"] = {
                "firstName": f"Nombre{index}",
                "lastName": "Apellido",
                "cityId": "loja",
                "email": f"extra{index}@example.com",
                "idNumber": "1100000000",
                "createdAt": now - timedelta(hours=index + 2),
            }

        latest = client.get(URL, **bearer("admin-token")).json()["users"]["latest"]

        assert [row["uid"] for row in latest] == [f"extra-{i}" for i in range(5)]
        assert set(latest[0]) == {"uid", "firstName", "lastName", "cityId", "createdAt"}
        text = json.dumps(latest)
        assert "example.com" not in text and "1100000000" not in text

    def test_counts_the_alerts_in_force_and_the_recent_incidents(self, client, data):
        body = client.get(URL, **bearer("admin-token")).json()

        assert body["safety"] == {"activeAlerts": 1, "incidentsLast30Days": 1}

    def test_the_safety_figures_need_routes_management(self, client, data):
        assert client.get(URL, **bearer("club-rep-token")).json()["safety"] is not None
        assert client.get(URL, **bearer("manager-token")).json()["safety"] is None
        assert client.get(URL, **bearer("cataloguer-token")).json()["safety"] is None

    def test_the_latest_accounts_need_users_read(self, client, data):
        assert client.get(URL, **bearer("club-rep-token")).json()["users"] is None
        assert "latest" in client.get(URL, **bearer("manager-token")).json()["users"]

    def test_contains_no_personal_data_but_the_name_of_the_latest_accounts(
        self, client, data, firebase
    ):
        firebase.users["runner-1"].update(email="secret.runner@example.com", idNumber="1100000000")

        body = client.get(URL, **bearer("admin-token")).json()
        body["users"].pop("latest")
        text = json.dumps(body)

        for private in ("secret.runner", "1100000000", "runner-1", "admin-1", "example.com"):
            assert private not in text

    def test_an_empty_system_has_zeroes(self, client, firebase):
        firebase.users.clear()
        body = client.get(URL, **bearer("admin-token")).json()

        assert body["users"]["total"] == 0
        assert body["users"]["sportProfiles"]["percentage"] == 0
        assert body["routes"]["total"] == 0
        assert body["routes"]["byCity"] == []
        assert body["byCity"] == []
        assert body["users"]["bySportLevel"] == []
        assert body["users"]["latest"] == []
        assert body["safety"] == {"activeAlerts": 0, "incidentsLast30Days": 0}


class TestTruncation:
    def test_is_flagged_when_a_scan_reaches_its_limit(self, client, data, monkeypatch):
        monkeypatch.setattr(use_cases, "MAX_SCAN", 3)

        body = client.get(URL, **bearer("admin-token")).json()

        assert body["truncated"] is True
        assert body["users"]["total"] == 3
