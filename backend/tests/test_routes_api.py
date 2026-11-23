import pytest

from apps.cities.domain.models import Ciudad
from tests.conftest import bearer

ROUTES = "/api/v1/routes"
ROUTE = {
    "name": "Jipiro loop",
    "cityId": "loja",
    "description": "Flat loop",
    "start": {"lat": -3.97, "lng": -79.2, "label": "Gate"},
    "end": {"lat": -3.98, "lng": -79.21, "label": "Lake"},
    "distanceKm": 5.2,
    "elevationGainM": 30,
    "surface": "asphalt",
    "difficulty": "beginner",
}
COORDINATES = [{"lat": -3.97, "lng": -79.2}, {"lat": -3.971, "lng": -79.2}]
SEGMENT = {"name": "Bridge", "coordinates": COORDINATES}
SLOT = {"label": "Night", "startTime": "19:00", "endTime": "23:00"}
FACTOR = {
    "type": "poor_lighting",
    "severity": "high",
    "description": "Dark",
    "startTime": "18:00",
    "endTime": "24:00",
}

ADMIN = bearer("admin-token")
MANAGER = bearer("club-rep-token")  # routes.manage without being an admin
RUNNER = bearer("runner-token")


@pytest.fixture(autouse=True)
def cities(firebase):
    firebase.cities["loja"] = Ciudad("loja", "Loja", "Loja", "city", -3.99, -79.2, "active")
    firebase.cities["loja-centro"] = Ciudad(
        "loja-centro", "Centro", "Loja", "zone", -3.99, -79.2, "active", "loja"
    )


def error_of(response) -> dict:
    return response.json()["error"]


def create(client, url: str, body: dict, **auth) -> str:
    response = client.post(url, body, format="json", **(auth or ADMIN))
    assert response.status_code == 201, response.content
    return response.json()["id"]


@pytest.fixture
def route_id(client) -> str:
    """An active route with one segment, one time slot and one risk factor."""
    route = create(client, ROUTES, ROUTE)
    segment = create(client, f"{ROUTES}/{route}/segments", SEGMENT)
    create(client, f"{ROUTES}/{route}/time-slots", SLOT)
    create(client, f"{ROUTES}/{route}/segments/{segment}/risk-factors", FACTOR)
    return route


def segment_id_of(client, route_id: str) -> str:
    return client.get(f"{ROUTES}/{route_id}", **ADMIN).json()["segments"][0]["id"]


class TestAuthorization:
    WRITES = [
        ("post", ROUTES, ROUTE),
        ("put", f"{ROUTES}/r1", ROUTE),
        ("delete", f"{ROUTES}/r1", None),
        ("post", f"{ROUTES}/r1/segments", SEGMENT),
        ("put", f"{ROUTES}/r1/segments/s1", SEGMENT),
        ("delete", f"{ROUTES}/r1/segments/s1", None),
        ("post", f"{ROUTES}/r1/time-slots", SLOT),
        ("put", f"{ROUTES}/r1/time-slots/t1", SLOT),
        ("delete", f"{ROUTES}/r1/time-slots/t1", None),
        ("post", f"{ROUTES}/r1/segments/s1/risk-factors", FACTOR),
        ("put", f"{ROUTES}/r1/segments/s1/risk-factors/f1", FACTOR),
        ("delete", f"{ROUTES}/r1/segments/s1/risk-factors/f1", None),
    ]
    READS = [("get", ROUTES), ("get", f"{ROUTES}/r1")]

    @pytest.mark.parametrize(("method", "url", "body"), WRITES)
    def test_anonymous_writes_are_unauthenticated(self, client, firebase, method, url, body):
        response = getattr(client, method)(url, body, format="json")

        assert response.status_code == 401
        assert error_of(response)["reason"] == "unauthenticated"
        assert firebase.docs == {}

    @pytest.mark.parametrize(("method", "url"), READS)
    def test_anonymous_reads_are_unauthenticated(self, client, method, url):
        assert getattr(client, method)(url).status_code == 401

    @pytest.mark.parametrize("token", ["runner-token", "cataloguer-token", "manager-token"])
    @pytest.mark.parametrize(("method", "url", "body"), WRITES)
    def test_writes_need_routes_manage(self, client, firebase, token, method, url, body):
        response = getattr(client, method)(url, body, format="json", **bearer(token))

        assert response.status_code == 403
        assert error_of(response) == {
            "reason": "missing-permission",
            "message": "Missing permission routes.manage.",
        }
        assert firebase.docs == {}

    @pytest.mark.parametrize("auth", [MANAGER, ADMIN])
    def test_routes_manage_or_admin_can_write(self, client, auth):
        assert client.post(ROUTES, ROUTE, format="json", **auth).status_code == 201

    @pytest.mark.parametrize(("method", "url"), READS)
    def test_any_signed_in_user_can_read(self, client, route_id, method, url):
        url = url.replace("r1", route_id)

        assert getattr(client, method)(url, **RUNNER).status_code == 200


class TestVisibility:
    @pytest.fixture
    def hidden_id(self, client, route_id) -> str:
        hidden = create(client, ROUTES, {**ROUTE, "name": "Hidden", "active": False})
        create(client, f"{ROUTES}/{hidden}/segments", SEGMENT)
        return hidden

    def test_runners_list_only_active_routes(self, client, route_id, hidden_id):
        response = client.get(ROUTES, **RUNNER)

        assert [route["id"] for route in response.json()["routes"]] == [route_id]

    @pytest.mark.parametrize("auth", [MANAGER, ADMIN])
    def test_route_managers_list_every_route_sorted_by_name(
        self, client, route_id, hidden_id, auth
    ):
        response = client.get(ROUTES, **auth)

        assert [route["name"] for route in response.json()["routes"]] == ["Hidden", "Jipiro loop"]

    def test_the_list_filters_by_city_or_zone(self, client, route_id):
        zone_route = create(client, ROUTES, {**ROUTE, "cityId": "loja-centro"})

        in_zone = client.get(ROUTES, {"cityId": "loja-centro"}, **RUNNER).json()["routes"]
        in_city = client.get(ROUTES, {"cityId": "loja"}, **RUNNER).json()["routes"]

        assert [route["id"] for route in in_zone] == [zone_route]
        assert [route["id"] for route in in_city] == [route_id]

    def test_the_list_rejects_a_malformed_city_and_unknown_parameters(self, client):
        assert error_of(client.get(ROUTES, {"cityId": "Bad"}, **RUNNER))["reason"] == (
            "invalid-city-id"
        )
        assert error_of(client.get(ROUTES, {"page": "2"}, **RUNNER))["reason"] == (
            "invalid-argument"
        )

    def test_an_inactive_route_does_not_exist_for_a_runner(self, client, hidden_id):
        response = client.get(f"{ROUTES}/{hidden_id}", **RUNNER)

        assert response.status_code == 404
        assert error_of(response)["reason"] == "route-not-found"

    def test_a_route_manager_reads_an_inactive_route(self, client, hidden_id):
        assert client.get(f"{ROUTES}/{hidden_id}", **MANAGER).status_code == 200

    def test_a_runner_reads_segments_without_time_slots_or_risk_factors(self, client, route_id):
        body = client.get(f"{ROUTES}/{route_id}", **RUNNER).json()

        assert "timeSlots" not in body
        assert len(body["segments"]) == 1
        assert "riskFactors" not in body["segments"][0]
        # The computed index is public: it is what the app shows.
        assert body["safety"][next(iter(body["safety"]))]["level"] == "medium"

    def test_a_route_manager_also_reads_time_slots_and_risk_factors(self, client, route_id):
        body = client.get(f"{ROUTES}/{route_id}", **MANAGER).json()

        assert body["timeSlots"] == [
            {
                "id": body["timeSlots"][0]["id"],
                "label": "Night",
                "startTime": "19:00",
                "endTime": "23:00",
                "validFrom": None,
                "validTo": None,
            }
        ]
        factors = body["segments"][0]["riskFactors"]
        assert [(f["type"], f["severity"], f["startTime"]) for f in factors] == [
            ("poor_lighting", "high", "18:00")
        ]

    def test_a_missing_route_is_not_found(self, client):
        response = client.get(f"{ROUTES}/ghost", **ADMIN)

        assert response.status_code == 404
        assert error_of(response)["reason"] == "route-not-found"

    def test_a_malformed_route_id_is_invalid(self, client):
        response = client.get(f"{ROUTES}/bad.id", **ADMIN)

        assert response.status_code == 400
        assert error_of(response)["reason"] == "invalid-route-id"


class TestRouteRepresentation:
    def test_describes_a_route_and_its_segments(self, client, route_id):
        body = client.get(f"{ROUTES}/{route_id}", **RUNNER).json()

        slot_id = next(iter(body["safety"]))
        segment = body["segments"][0]
        assert body == {
            "id": route_id,
            "name": "Jipiro loop",
            "cityId": "loja",
            "description": "Flat loop",
            "start": {"lat": -3.97, "lng": -79.2, "label": "Gate"},
            "end": {"lat": -3.98, "lng": -79.21, "label": "Lake"},
            "distanceKm": 5.2,
            "elevationGainM": 30,
            "surface": "asphalt",
            "difficulty": "beginner",
            "active": True,
            "segmentCount": 1,
            "safety": body["safety"],
            "segments": [
                {
                    "id": segment["id"],
                    "name": "Bridge",
                    "order": 0,
                    "coordinates": COORDINATES,
                    "lengthM": 111,
                    "safety": segment["safety"],
                }
            ],
        }
        assert body["safety"][slot_id]["worstSegmentId"] == segment["id"]
        assert segment["safety"][slot_id]["score"] == 65

    def test_the_list_describes_each_route_without_segments(self, client, route_id):
        (route,) = client.get(ROUTES, **RUNNER).json()["routes"]

        assert route["id"] == route_id
        assert route["segmentCount"] == 1
        assert "segments" not in route

    def test_the_list_carries_a_light_preview_of_the_shape_and_the_detail_does_not(
        self, client, route_id
    ):
        (route,) = client.get(ROUTES, **RUNNER).json()["routes"]
        detail = client.get(f"{ROUTES}/{route_id}", **RUNNER).json()

        assert route["preview"] == [[point["lat"], point["lng"]] for point in COORDINATES]
        assert "preview" not in detail


class TestRouteWrites:
    def test_creates_an_active_route(self, client, firebase):
        route_id = create(client, ROUTES, ROUTE)

        document = firebase.docs[f"routes/{route_id}"]
        assert document["active"] is True
        assert (document["segmentCount"], document["safety"]) == (0, {})

    def test_an_unknown_city_is_not_found(self, client, firebase):
        response = client.post(ROUTES, {**ROUTE, "cityId": "ghost"}, format="json", **ADMIN)

        assert response.status_code == 404
        assert error_of(response)["reason"] == "city-not-found"
        assert firebase.docs == {}

    def test_domain_rules_use_the_callable_reason_codes(self, client):
        response = client.post(ROUTES, {**ROUTE, "surface": ""}, format="json", **ADMIN)

        assert response.status_code == 400
        assert error_of(response)["reason"] == "invalid-surface"

    def test_rejects_unknown_fields_and_other_shapes(self, client, firebase):
        unknown = client.post(ROUTES, {**ROUTE, "safety": {}}, format="json", **ADMIN)
        not_an_object = client.post(ROUTES, [ROUTE], format="json", **ADMIN)

        assert error_of(unknown)["fields"] == {"safety": "unknown"}
        assert not_an_object.status_code == 400
        assert firebase.docs == {}

    def test_updates_a_route_and_keeps_its_computed_fields(self, client, firebase, route_id):
        response = client.put(
            f"{ROUTES}/{route_id}", {**ROUTE, "name": "Renamed", "active": False}, format="json",
            **ADMIN,
        )  # fmt: skip

        assert response.status_code == 204
        document = firebase.docs[f"routes/{route_id}"]
        assert (document["name"], document["active"], document["segmentCount"]) == (
            "Renamed",
            False,
            1,
        )
        assert document["safety"]

    def test_updating_a_missing_route_is_not_found(self, client):
        response = client.put(f"{ROUTES}/ghost", ROUTE, format="json", **ADMIN)

        assert response.status_code == 404
        assert error_of(response)["reason"] == "route-not-found"

    def test_deleting_a_route_removes_everything_under_it(self, client, firebase, route_id):
        response = client.delete(f"{ROUTES}/{route_id}", **ADMIN)

        assert response.status_code == 204
        assert firebase.docs == {}

    def test_deleting_a_missing_route_is_not_found(self, client):
        assert client.delete(f"{ROUTES}/ghost", **ADMIN).status_code == 404


class TestSegments:
    def test_creates_a_segment_that_updates_the_route_index(self, client, route_id):
        before = client.get(f"{ROUTES}/{route_id}", **ADMIN).json()

        new_id = create(client, f"{ROUTES}/{route_id}/segments", {**SEGMENT, "order": 0})

        after = client.get(f"{ROUTES}/{route_id}", **ADMIN).json()
        assert after["segmentCount"] == 2
        assert [segment["id"] for segment in after["segments"]][0] == new_id
        assert [s["order"] for s in after["segments"]] == [0, 1]
        # The new segment has no factors, so the first one is still the worst.
        assert after["safety"] == before["safety"]

    def test_updates_and_reorders_a_segment(self, client, route_id):
        second = create(client, f"{ROUTES}/{route_id}/segments", SEGMENT)

        response = client.put(
            f"{ROUTES}/{route_id}/segments/{second}",
            {"name": "Moved", "coordinates": COORDINATES, "order": 0},
            format="json",
            **ADMIN,
        )

        assert response.status_code == 204
        segments = client.get(f"{ROUTES}/{route_id}", **ADMIN).json()["segments"]
        assert [(s["id"], s["name"], s["order"]) for s in segments][0] == (second, "Moved", 0)

    def test_deleting_a_segment_removes_its_factors_and_recalculates(
        self, client, firebase, route_id
    ):
        segment = segment_id_of(client, route_id)

        response = client.delete(f"{ROUTES}/{route_id}/segments/{segment}", **ADMIN)

        assert response.status_code == 204
        assert not [path for path in firebase.docs if "/segments/" in path]
        route = client.get(f"{ROUTES}/{route_id}", **ADMIN).json()
        assert (route["segmentCount"], route["safety"]) == (0, {})

    def test_a_missing_segment_is_not_found(self, client, route_id):
        for method in ("put", "delete"):
            response = getattr(client, method)(
                f"{ROUTES}/{route_id}/segments/ghost", SEGMENT, format="json", **ADMIN
            )

            assert response.status_code == 404
            assert error_of(response)["reason"] == "segment-not-found"

    def test_invalid_coordinates_are_rejected(self, client, route_id):
        response = client.post(
            f"{ROUTES}/{route_id}/segments",
            {"name": "A", "coordinates": [{"lat": 0, "lng": 0}]},
            format="json",
            **ADMIN,
        )

        assert response.status_code == 400
        assert error_of(response)["reason"] == "invalid-coordinates"

    def test_a_missing_route_is_not_found(self, client):
        response = client.post(f"{ROUTES}/ghost/segments", SEGMENT, format="json", **ADMIN)

        assert response.status_code == 404
        assert error_of(response)["reason"] == "route-not-found"


class TestTimeSlots:
    def test_a_new_slot_gets_an_index_on_every_segment_and_the_route(self, client, route_id):
        slot = create(
            client, f"{ROUTES}/{route_id}/time-slots", {"startTime": "06:00", "endTime": "09:00"}
        )

        route = client.get(f"{ROUTES}/{route_id}", **ADMIN).json()
        assert route["safety"][slot]["score"] == 100
        assert route["segments"][0]["safety"][slot]["score"] == 100

    def test_overlapping_slots_are_refused(self, client, firebase, route_id):
        response = client.post(
            f"{ROUTES}/{route_id}/time-slots",
            {"startTime": "22:00", "endTime": "23:30"},
            format="json",
            **ADMIN,
        )

        assert response.status_code == 400
        assert error_of(response)["reason"] == "time-slot-overlap"

    def test_updates_a_slot_and_drops_the_optional_fields_that_are_not_sent(
        self, client, firebase, route_id
    ):
        slot = client.get(f"{ROUTES}/{route_id}", **ADMIN).json()["timeSlots"][0]["id"]

        response = client.put(
            f"{ROUTES}/{route_id}/time-slots/{slot}",
            {"startTime": "17:00", "endTime": "24:00"},
            format="json",
            **ADMIN,
        )

        assert response.status_code == 204
        assert firebase.docs[f"routes/{route_id}/timeSlots/{slot}"].keys() >= {"startTime"}
        assert "label" not in firebase.docs[f"routes/{route_id}/timeSlots/{slot}"]
        assert firebase.docs[f"routes/{route_id}"]["safety"][slot]["startTime"] == "17:00"

    def test_deletes_a_slot_and_its_index(self, client, firebase, route_id):
        slot = client.get(f"{ROUTES}/{route_id}", **ADMIN).json()["timeSlots"][0]["id"]

        response = client.delete(f"{ROUTES}/{route_id}/time-slots/{slot}", **ADMIN)

        assert response.status_code == 204
        assert firebase.docs[f"routes/{route_id}"]["safety"] == {}

    def test_a_missing_slot_is_not_found(self, client, route_id):
        for method in ("put", "delete"):
            response = getattr(client, method)(
                f"{ROUTES}/{route_id}/time-slots/ghost", SLOT, format="json", **ADMIN
            )

            assert response.status_code == 404
            assert error_of(response)["reason"] == "time-slot-not-found"

    def test_validation_errors_keep_their_reason(self, client, route_id):
        response = client.post(
            f"{ROUTES}/{route_id}/time-slots",
            {"startTime": "10:00", "endTime": "09:00"},
            format="json",
            **ADMIN,
        )

        assert error_of(response)["reason"] == "invalid-time-range"


class TestRiskFactors:
    def test_a_new_factor_lowers_the_segment_and_route_index(self, client, route_id):
        segment = segment_id_of(client, route_id)

        create(
            client,
            f"{ROUTES}/{route_id}/segments/{segment}/risk-factors",
            {"type": "traffic", "severity": "medium", "description": "Busy road"},
        )

        route = client.get(f"{ROUTES}/{route_id}", **ADMIN).json()
        (index,) = route["safety"].values()
        assert (index["score"], index["level"]) == (45, "medium")
        assert len(index["factors"]) == 2

    def test_updates_and_deletes_a_factor(self, client, route_id):
        segment = segment_id_of(client, route_id)
        url = f"{ROUTES}/{route_id}"
        factor = client.get(url, **ADMIN).json()["segments"][0]["riskFactors"][0]["id"]
        factor_url = f"{url}/segments/{segment}/risk-factors/{factor}"

        updated = client.put(
            factor_url,
            {"type": "poor_lighting", "severity": "low", "description": "Dim"},
            format="json",
            **ADMIN,
        )
        assert updated.status_code == 204
        (index,) = client.get(url, **ADMIN).json()["safety"].values()
        assert index["score"] == 90

        assert client.delete(factor_url, **ADMIN).status_code == 204
        (index,) = client.get(url, **ADMIN).json()["safety"].values()
        assert index["score"] == 100

    def test_a_missing_segment_or_factor_is_not_found(self, client, route_id):
        segment = segment_id_of(client, route_id)
        base = f"{ROUTES}/{route_id}/segments"

        no_segment = client.post(f"{base}/ghost/risk-factors", FACTOR, format="json", **ADMIN)
        no_factor = client.delete(f"{base}/{segment}/risk-factors/ghost", **ADMIN)

        assert error_of(no_segment)["reason"] == "segment-not-found"
        assert error_of(no_factor)["reason"] == "risk-factor-not-found"

    def test_validation_errors_keep_their_reason(self, client, route_id):
        segment = segment_id_of(client, route_id)

        response = client.post(
            f"{ROUTES}/{route_id}/segments/{segment}/risk-factors",
            {**FACTOR, "severity": "extreme"},
            format="json",
            **ADMIN,
        )

        assert error_of(response)["reason"] == "invalid-severity"
