"""EP-06: support points and guarded trails."""

import pytest

from apps.cities.domain.models import Ciudad
from tests.conftest import bearer

ROUTES = "/api/v1/routes"
POINTS = "/api/v1/support-points"
TRAILS = "/api/v1/guarded-trails"
ROUTE = {
    "name": "Jipiro loop",
    "cityId": "loja",
    "start": {"lat": -3.97, "lng": -79.2, "label": "Gate"},
    "end": {"lat": -3.971, "lng": -79.2, "label": "Lake"},
    "distanceKm": 5.2,
    "elevationGainM": 30,
    "surface": "asphalt",
    "difficulty": "beginner",
}
SEGMENT = {
    "name": "Bridge",
    "coordinates": [{"lat": -3.975, "lng": -79.2}, {"lat": -3.98, "lng": -79.2}],
}
POINT = {
    "type": "police_post",
    "name": "UPC Jipiro",
    "location": {"lat": -3.9705, "lng": -79.2},
    "cityId": "loja",
    "openingHours": "Lun–Dom 24 h",
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


@pytest.fixture
def route(client) -> dict:
    route_id = create(client, ROUTES, ROUTE)
    return {"id": route_id, "segment": create(client, f"{ROUTES}/{route_id}/segments", SEGMENT)}


def trail(route: dict, **changes) -> dict:
    body = {
        "routeId": route["id"],
        "segmentId": route["segment"],
        "days": ["sat", "mon"],
        "startTime": "06:00",
        "endTime": "08:00",
    }
    return {**body, **changes}


class TestAuthorization:
    WRITES = [
        ("post", POINTS, POINT),
        ("put", f"{POINTS}/p1", POINT),
        ("delete", f"{POINTS}/p1", None),
        ("post", TRAILS, {}),
        ("put", f"{TRAILS}/t1", {}),
        ("delete", f"{TRAILS}/t1", None),
    ]
    READS = [POINTS, f"{POINTS}/p1", TRAILS, f"{TRAILS}/t1"]

    @pytest.mark.parametrize("url", READS)
    def test_anonymous_reads_are_unauthenticated(self, client, url):
        assert client.get(url).status_code == 401

    @pytest.mark.parametrize("token", ["runner-token", "cataloguer-token"])
    @pytest.mark.parametrize(("method", "url", "body"), WRITES)
    def test_writes_need_routes_manage(self, client, firebase, token, method, url, body):
        response = getattr(client, method)(url, body, format="json", **bearer(token))

        assert response.status_code == 403
        assert error_of(response)["reason"] == "missing-permission"
        assert firebase.docs == {}

    def test_runners_read_what_managers_write(self, client, route):
        point_id = create(client, POINTS, POINT)
        trail_id = create(client, TRAILS, trail(route))
        assert client.post(POINTS, POINT, format="json", **MANAGER).status_code == 201

        assert client.get(f"{POINTS}/{point_id}", **RUNNER).status_code == 200
        assert client.get(f"{TRAILS}/{trail_id}", **RUNNER).status_code == 200


class TestSupportPoints:
    def test_creates_and_reads_a_support_point(self, client):
        point_id = create(client, POINTS, POINT)

        assert client.get(f"{POINTS}/{point_id}", **RUNNER).json() == {"id": point_id, **POINT}

    def test_name_and_opening_hours_are_optional(self, client):
        body = {key: POINT[key] for key in ("type", "location", "cityId")}
        point_id = create(client, POINTS, body)

        point = client.get(f"{POINTS}/{point_id}", **RUNNER).json()
        assert (point["name"], point["openingHours"]) == (None, None)

    @pytest.mark.parametrize(
        ("changes", "status", "reason"),
        [
            ({"type": "  "}, 400, "invalid-support-point-type"),
            ({"type": "x" * 41}, 400, "invalid-support-point-type"),
            ({"type": 3}, 400, "invalid-support-point-type"),
            ({"location": {"lat": 91, "lng": 0}}, 400, "invalid-location"),
            ({"location": None}, 400, "invalid-location"),
            ({"cityId": None}, 400, "invalid-city-id"),
            ({"cityId": "cuenca"}, 404, "city-not-found"),
            ({"openingHours": "x" * 81}, 400, "invalid-opening-hours"),
        ],
    )
    def test_rejects_invalid_support_points(self, client, firebase, changes, status, reason):
        response = client.post(POINTS, {**POINT, **changes}, format="json", **ADMIN)

        assert response.status_code == status
        assert error_of(response)["reason"] == reason
        assert firebase.docs == {}

    def test_updates_and_deletes_a_support_point(self, client, firebase):
        point_id = create(client, POINTS, POINT)
        changes = {**POINT, "type": "  Centro de salud ", "openingHours": None}

        assert (
            client.put(f"{POINTS}/{point_id}", changes, format="json", **ADMIN).status_code == 204
        )
        assert client.get(f"{POINTS}/{point_id}", **RUNNER).json()["type"] == "Centro de salud"
        assert client.delete(f"{POINTS}/{point_id}", **ADMIN).status_code == 204
        assert client.get(POINTS, **RUNNER).json() == {"supportPoints": []}

    @pytest.mark.parametrize("method", ["get", "put", "delete"])
    def test_a_missing_support_point_is_not_found(self, client, method):
        response = getattr(client, method)(f"{POINTS}/ghost", POINT, format="json", **ADMIN)

        assert response.status_code == 404
        assert error_of(response)["reason"] == "support-point-not-found"

    def test_filters_by_city_route_and_location(self, client, route):
        near_start = create(client, POINTS, {**POINT, "name": "A"})
        # About 330 m from the end of the segment (-3.98): near the route.
        near_segment = create(
            client, POINTS, {**POINT, "name": "B", "location": {"lat": -3.983, "lng": -79.2}}
        )
        far = create(
            client, POINTS, {**POINT, "name": "C", "location": {"lat": -3.99, "lng": -79.2}}
        )
        quito = create(
            client,
            POINTS,
            {**POINT, "name": "D", "cityId": "quito", "location": {"lat": -0.2, "lng": -78.5}},
        )

        def ids(query: str) -> list[str]:
            response = client.get(f"{POINTS}?{query}", **RUNNER)
            assert response.status_code == 200, response.content
            return [point["id"] for point in response.json()["supportPoints"]]

        assert ids("") == [near_start, near_segment, far, quito]
        assert ids("cityId=quito") == [quito]
        assert ids(f"routeId={route['id']}") == [near_start, near_segment]
        assert ids("lat=-3.99&lng=-79.2&radiusM=200") == [far]
        assert ids("cityId=loja&lat=-3.97&lng=-79.2&radiusM=3000") == [
            near_start,
            near_segment,
            far,
        ]

    @pytest.mark.parametrize(
        ("query", "status", "reason"),
        [
            ("routeId=ghost", 404, "route-not-found"),
            ("lat=-3.9&lng=-79.2", 400, "invalid-search-radius"),
            ("lat=-3.9&radiusM=100", 400, "invalid-search-location"),
            ("lat=-3.9&lng=-79.2&radiusM=0", 400, "invalid-search-radius"),
            ("cityId=Loja!", 400, "invalid-city-id"),
        ],
    )
    def test_rejects_invalid_filters(self, client, query, status, reason):
        response = client.get(f"{POINTS}?{query}", **RUNNER)

        assert response.status_code == status
        assert error_of(response)["reason"] == reason


class TestGuardedTrails:
    def test_creates_and_reads_a_guarded_trail_with_days_in_week_order(self, client, route):
        trail_id = create(client, TRAILS, trail(route))

        stored = client.get(f"{TRAILS}/{trail_id}", **RUNNER).json()
        assert stored == {"id": trail_id, **trail(route), "days": ["mon", "sat"]}

    def test_a_guarded_trail_can_cover_the_whole_route(self, client, route):
        trail_id = create(client, TRAILS, trail(route, segmentId=None))

        assert client.get(f"{TRAILS}/{trail_id}", **RUNNER).json()["segmentId"] is None

    @pytest.mark.parametrize(
        ("changes", "status", "reason"),
        [
            ({"routeId": "ghost"}, 404, "route-not-found"),
            ({"segmentId": "ghost"}, 404, "segment-not-found"),
            ({"days": []}, 400, "invalid-days"),
            ({"days": ["mon", "mon"]}, 400, "invalid-days"),
            ({"days": ["monday"]}, 400, "invalid-days"),
            ({"startTime": None}, 400, "invalid-start-time"),
            ({"endTime": "05:00"}, 400, "invalid-time-range"),
        ],
    )
    def test_rejects_invalid_guarded_trails(self, client, firebase, route, changes, status, reason):
        before = dict(firebase.docs)

        response = client.post(TRAILS, trail(route, **changes), format="json", **ADMIN)

        assert response.status_code == status
        assert error_of(response)["reason"] == reason
        assert firebase.docs == before

    def test_two_trails_of_a_segment_cannot_overlap_on_a_shared_day(self, client, route):
        create(client, TRAILS, trail(route))

        overlap = trail(route, days=["mon"], startTime="07:00", endTime="09:00")
        response = client.post(TRAILS, overlap, format="json", **ADMIN)
        assert response.status_code == 400
        assert error_of(response)["reason"] == "guarded-trail-overlap"
        # Another day, a later window or the whole route do not overlap.
        create(client, TRAILS, trail(route, days=["tue"]))
        create(client, TRAILS, trail(route, startTime="08:00", endTime="10:00"))
        create(client, TRAILS, trail(route, segmentId=None))

    def test_an_update_may_keep_its_own_window(self, client, route):
        trail_id = create(client, TRAILS, trail(route))
        changes = trail(route, endTime="09:00")

        response = client.put(f"{TRAILS}/{trail_id}", changes, format="json", **ADMIN)

        assert response.status_code == 204
        assert client.get(f"{TRAILS}/{trail_id}", **RUNNER).json()["endTime"] == "09:00"

    def test_deleting_a_trail_keeps_the_route_and_its_segment(self, client, firebase, route):
        trail_id = create(client, TRAILS, trail(route))

        assert client.delete(f"{TRAILS}/{trail_id}", **ADMIN).status_code == 204
        assert f"guardedTrails/{trail_id}" not in firebase.docs
        assert f"routes/{route['id']}/segments/{route['segment']}" in firebase.docs

    @pytest.mark.parametrize("method", ["get", "put", "delete"])
    def test_a_missing_trail_is_not_found(self, client, method):
        response = getattr(client, method)(f"{TRAILS}/ghost", {}, format="json", **ADMIN)

        assert response.status_code == 404
        assert error_of(response)["reason"] == "guarded-trail-not-found"

    def test_lists_every_trail_or_those_of_a_route(self, client, route):
        first = create(client, TRAILS, trail(route, startTime="18:00", endTime="20:00"))
        second = create(client, TRAILS, trail(route))

        listed = client.get(f"{TRAILS}?routeId={route['id']}", **RUNNER).json()["guardedTrails"]

        assert [item["id"] for item in listed] == [second, first]
        assert client.get(f"{TRAILS}?routeId=other", **RUNNER).json() == {"guardedTrails": []}
