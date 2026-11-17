import json
from datetime import datetime, timedelta, timezone

import pytest

from apps.cities.domain.models import Ciudad
from apps.summary.application import use_cases
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


@pytest.fixture
def data(firebase):
    """Six accounts from the token fixture plus two runners, routes, slots and factors."""
    now = datetime.now(timezone.utc)
    firebase.cities.update({"loja": LOJA, "loja-centro": ZONE})
    firebase.users["runner-1"]["createdAt"] = now - timedelta(days=1)
    firebase.users["admin-1"]["createdAt"] = now - timedelta(days=60)
    firebase.private[("runner-1", "sportProfile")] = {"level": "beginner", "goals": ["health"]}
    firebase.private[("runner-1", "preferences")] = {"appearance": "dark"}
    safety = {"slot-1": {"level": "high", "score": 90}, "slot-2": {"level": "low", "score": 10}}
    firebase.docs["routes/r1"] = route_document(safety=safety, distanceKm=8.5)
    firebase.docs["routes/r2"] = route_document(active=False, difficulty="advanced")
    firebase.docs["routes/r1/timeSlots/slot-1"] = {"startTime": "06:00", "endTime": "09:00"}
    firebase.docs["routes/r1/segments/s1"] = {"name": "Tramo"}
    firebase.docs["routes/r1/segments/s1/riskFactors/f1"] = {"severity": "high", "type": "x"}


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
        assert users["total"] == 6
        assert users["byRole"]["runner"] == 1
        assert users["registeredLast7Days"] == 1
        assert users["registeredLast30Days"] == 1
        assert (
            users["registrationsByWeek"][-1]["count"] + users["registrationsByWeek"][-2]["count"]
            == 1
        )
        assert users["sportProfiles"] == {"completed": 1, "percentage": 17}
        assert users["preferences"]["appearance"]["dark"] == 1
        routes = body["routes"]
        assert (routes["total"], routes["active"], routes["inactive"]) == (2, 1, 1)
        assert routes["totalKm"] == 16.5
        assert routes["safetyLevels"] == {"high": 0, "medium": 0, "low": 1, "unrated": 1}
        assert routes["timeSlots"] == 1
        assert routes["riskFactors"]["bySeverity"]["high"] == 1
        assert routes["byCity"] == [{"cityId": "loja", "cityName": "Loja", "count": 2}]
        assert body["cities"] == {"cities": 1, "zones": 1}

    def test_contains_no_personal_data(self, client, data, firebase):
        firebase.users["runner-1"].update(email="secret.runner@example.com", firstName="Zelda")

        text = json.dumps(client.get(URL, **bearer("admin-token")).json())

        for private in ("secret.runner", "Zelda", "runner-1", "admin-1", "example.com"):
            assert private not in text

    def test_an_empty_system_has_zeroes(self, client, firebase):
        firebase.users.clear()
        body = client.get(URL, **bearer("admin-token")).json()

        assert body["users"]["total"] == 0
        assert body["users"]["sportProfiles"]["percentage"] == 0
        assert body["routes"]["total"] == 0
        assert body["routes"]["byCity"] == []


class TestTruncation:
    def test_is_flagged_when_a_scan_reaches_its_limit(self, client, data, monkeypatch):
        monkeypatch.setattr(use_cases, "MAX_SCAN", 3)

        body = client.get(URL, **bearer("admin-token")).json()

        assert body["truncated"] is True
        assert body["users"]["total"] == 3
