"""Ported from `functions/src/routes/routeService.test.ts` (RF-05, RF-07).

The store records the write plans instead of applying them, like the Vitest fakes did.
"""

import pytest

from apps.cities.domain.models import Ciudad
from apps.routes.application.ports import DELETE_FIELD, SERVER_TIMESTAMP, WriteOp
from apps.routes.application.use_cases import (
    RoutesDeps,
    create_risk_factor,
    create_route,
    create_segment,
    create_time_slot,
    delete_risk_factor,
    delete_route,
    delete_segment,
    delete_time_slot,
    update_risk_factor,
    update_route,
    update_segment,
    update_time_slot,
)
from apps.routes.domain.geo import LatLng
from apps.routes.domain.models import FactorDeRiesgo, FranjaHoraria, RouteState, Ruta, Tramo
from apps.shared.domain.errors import DomainError, ErrorKind
from tests.fakes import SETTINGS, InMemoryCityRepository

TS = SERVER_TIMESTAMP
DEL = DELETE_FIELD
COORDS = [{"lat": -3.97, "lng": -79.2}, {"lat": -3.971, "lng": -79.2}]
POINTS = (LatLng(-3.97, -79.2), LatLng(-3.971, -79.2))


def empty_state() -> RouteState:
    return RouteState([], [], {})


def sample_state() -> RouteState:
    """Route r1 with segments a (0), b (1), c (2), a morning and a night slot, one factor on b."""
    return RouteState(
        segments=[
            Tramo("a", "Gate", 0, POINTS, 111),
            Tramo("b", "Park", 1, POINTS, 111),
            Tramo("c", "Lake", 2, POINTS, 111),
        ],
        slots=[
            FranjaHoraria("morning", "06:00", "09:00"),
            FranjaHoraria("night", "19:00", "23:00", label="Night"),
        ],
        factors={
            "b": [FactorDeRiesgo("f1", "poor_lighting", "high", "Dark", "18:00", "24:00")],
        },
    )


class RecordingRoutes:
    """A `RouteRepository` that records the writes. `state` is None for a missing route."""

    def __init__(self, state: RouteState | None) -> None:
        self.state = state
        self.committed: list[WriteOp] = []
        self.commits = 0
        self.mutations: list[str] = []
        self.deleted_trees: list[str] = []
        self._next = 0

    def new_id(self) -> str:
        self._next += 1
        return f"new-{self._next}"

    def get(self, route_id: str):
        return None if self.state is None else Ruta.parse(route_input(), route_id, SETTINGS)

    def commit(self, ops: list[WriteOp]) -> None:
        self.commits += 1
        self.committed.extend(ops)

    def mutate(self, route_id: str, plan) -> None:
        self.mutations.append(route_id)
        self.committed.extend(plan(self.state))

    def delete_tree(self, route_id: str) -> None:
        self.deleted_trees.append(route_id)


@pytest.fixture(autouse=True)
def loja(firebase):
    firebase.cities["loja"] = Ciudad("loja", "Loja", "Loja", "city", -3.99, -79.2, "active")


def make(
    state: RouteState | None = None, *, existing: bool = True
) -> tuple[RoutesDeps, RecordingRoutes]:
    routes = RecordingRoutes(sample_state() if state is None and existing else state)
    return RoutesDeps(routes=routes, cities=InMemoryCityRepository(), settings=SETTINGS), routes


def route_input(**overrides) -> dict:
    return {
        "name": "Jipiro loop",
        "cityId": "loja",
        "start": {"lat": -3.97, "lng": -79.2, "label": "Gate"},
        "end": {"lat": -3.98, "lng": -79.21, "label": "Lake"},
        "distanceKm": 5,
        "elevationGainM": 30,
        "surface": "asphalt",
        "difficulty": "beginner",
        **overrides,
    }


def op_at(ops: list[WriteOp], path: str) -> WriteOp | None:
    return next((op for op in ops if op.path == path), None)


def data_at(ops: list[WriteOp], path: str) -> dict:
    op = op_at(ops, path)
    assert op is not None and op.op != "delete", f"No write at {path}"
    return op.data


def failure(call) -> DomainError:
    with pytest.raises(DomainError) as error:
        call()
    return error.value


class TestCreateRoute:
    def test_creates_an_active_route_without_segments_or_safety_yet(self):
        deps, routes = make(existing=False)

        assert create_route(route_input(), deps) == "new-1"

        assert len(routes.committed) == 1
        op = routes.committed[0]
        assert (op.op, op.path) == ("set", "routes/new-1")
        assert op.data == {
            "name": "Jipiro loop",
            "cityId": "loja",
            "description": "",
            "start": {"lat": -3.97, "lng": -79.2, "label": "Gate"},
            "end": {"lat": -3.98, "lng": -79.21, "label": "Lake"},
            "distanceKm": 5,
            "elevationGainM": 30,
            "surface": "asphalt",
            "difficulty": "beginner",
            "active": True,
            "segmentCount": 0,
            "preview": [],
            "safety": {},
            "safetyUpdatedAt": TS,
            "createdAt": TS,
            "updatedAt": TS,
        }

    def test_rejects_an_unknown_city_or_zone(self, firebase):
        del firebase.cities["loja"]
        deps, routes = make(existing=False)

        error = failure(lambda: create_route(route_input(), deps))

        assert (error.kind, error.reason) == (ErrorKind.NOT_FOUND, "city-not-found")
        assert routes.commits == 0

    def test_validates_the_payload_before_looking_at_the_city(self, firebase):
        del firebase.cities["loja"]
        deps, _ = make(existing=False)

        assert failure(lambda: create_route(route_input(surface=""), deps)).reason == (
            "invalid-surface"
        )


class TestUpdateRoute:
    def test_updates_the_editable_fields(self):
        deps, routes = make()

        update_route({"id": "r1", **route_input(active=False)}, deps)

        assert routes.mutations == ["r1"]
        data = data_at(routes.committed, "routes/r1")
        assert data["name"] == "Jipiro loop"
        assert data["active"] is False
        assert data["updatedAt"] == TS
        assert "createdAt" not in data
        assert "safety" not in data

    def test_rejects_a_missing_route_and_malformed_ids(self):
        missing, _ = make(existing=False)
        deps, _ = make()

        assert failure(lambda: update_route({"id": "r1", **route_input()}, missing)).reason == (
            "route-not-found"
        )
        assert failure(lambda: update_route({"id": "a/b", **route_input()}, deps)).reason == (
            "invalid-route-id"
        )

    def test_rejects_an_unknown_city(self, firebase):
        del firebase.cities["loja"]
        deps, _ = make()

        assert failure(lambda: update_route({"id": "r1", **route_input()}, deps)).reason == (
            "city-not-found"
        )


class TestDeleteRoute:
    def test_deletes_the_route_with_all_its_subcollections(self):
        deps, routes = make()

        delete_route({"id": "r1"}, deps)

        assert routes.deleted_trees == ["r1"]

    def test_reports_a_missing_route(self):
        deps, routes = make(existing=False)

        assert failure(lambda: delete_route({"id": "r1"}, deps)).reason == "route-not-found"
        assert routes.deleted_trees == []


class TestCreateSegment:
    def test_appends_the_segment_computes_its_length_and_safety_and_updates_the_route(self):
        deps, routes = make()

        new_id = create_segment({"routeId": "r1", "name": "Bridge", "coordinates": COORDS}, deps)

        assert new_id == "new-1"
        assert op_at(routes.committed, "routes/r1/segments/new-1").op == "set"
        segment = data_at(routes.committed, "routes/r1/segments/new-1")
        assert segment["name"] == "Bridge"
        assert segment["order"] == 3
        assert segment["coordinates"] == COORDS
        assert segment["lengthM"] == 111
        assert segment["safety"] == {
            "morning": {"level": "high", "score": 100, "factors": []},
            "night": {"level": "high", "score": 100, "factors": []},
        }
        assert (segment["createdAt"], segment["updatedAt"]) == (TS, TS)
        route = data_at(routes.committed, "routes/r1")
        assert (route["segmentCount"], route["safetyUpdatedAt"], route["updatedAt"]) == (4, TS, TS)
        assert route["safety"]["night"]["worstSegmentId"] == "b"
        assert route["safety"]["night"]["score"] == 65
        # The list preview follows the route order: the three stored segments, then the new one.
        stored = [point.to_document() for point in POINTS]
        assert route["preview"] == stored * 3 + COORDS

    def test_inserts_at_a_given_order_and_shifts_the_following_segments(self):
        deps, routes = make()

        create_segment({"routeId": "r1", "name": "Bridge", "coordinates": COORDS, "order": 1}, deps)

        assert data_at(routes.committed, "routes/r1/segments/new-1")["order"] == 1
        assert "order" not in data_at(routes.committed, "routes/r1/segments/a")
        assert data_at(routes.committed, "routes/r1/segments/b")["order"] == 2
        assert data_at(routes.committed, "routes/r1/segments/c")["order"] == 3

    def test_rejects_a_missing_route(self):
        deps, _ = make(existing=False)

        error = failure(
            lambda: create_segment({"routeId": "r1", "name": "B", "coordinates": COORDS}, deps)
        )

        assert (error.kind, error.reason) == (ErrorKind.NOT_FOUND, "route-not-found")

    def test_caps_the_number_of_segments_per_route(self):
        state = empty_state()
        state.segments.extend(
            Tramo(f"s{i}", f"S{i}", i, POINTS, 1) for i in range(SETTINGS.max_segments_per_route)
        )
        deps, _ = make(state)

        error = failure(
            lambda: create_segment({"routeId": "r1", "name": "B", "coordinates": COORDS}, deps)
        )

        assert (error.kind, error.reason) == (ErrorKind.FAILED_PRECONDITION, "too-many-segments")


class TestUpdateSegment:
    def test_updates_fields_and_moves_the_segment_reordering_the_others(self):
        deps, routes = make()

        update_segment(
            {
                "routeId": "r1",
                "segmentId": "c",
                "name": "Lake shore",
                "coordinates": COORDS,
                "order": 0,
            },
            deps,
        )

        segment = data_at(routes.committed, "routes/r1/segments/c")
        assert (segment["name"], segment["order"], segment["lengthM"]) == ("Lake shore", 0, 111)
        assert segment["updatedAt"] == TS
        assert data_at(routes.committed, "routes/r1/segments/a")["order"] == 1
        assert data_at(routes.committed, "routes/r1/segments/b")["order"] == 2

    def test_keeps_the_order_when_none_is_given(self):
        deps, routes = make()

        update_segment(
            {"routeId": "r1", "segmentId": "b", "name": "Park", "coordinates": COORDS}, deps
        )

        assert data_at(routes.committed, "routes/r1/segments/b")["order"] == 1
        assert "order" not in data_at(routes.committed, "routes/r1/segments/a")

    def test_reports_a_missing_segment(self):
        deps, _ = make()

        error = failure(
            lambda: update_segment(
                {"routeId": "r1", "segmentId": "zz", "name": "X", "coordinates": COORDS}, deps
            )
        )

        assert (error.kind, error.reason) == (ErrorKind.NOT_FOUND, "segment-not-found")


class TestDeleteSegment:
    def test_deletes_the_segment_and_its_risk_factors_closes_the_gap_and_recalculates(self):
        deps, routes = make()

        delete_segment({"routeId": "r1", "segmentId": "b"}, deps)

        assert op_at(routes.committed, "routes/r1/segments/b") == WriteOp(
            "delete", "routes/r1/segments/b"
        )
        factor_path = "routes/r1/segments/b/riskFactors/f1"
        assert op_at(routes.committed, factor_path) == WriteOp("delete", factor_path)
        assert data_at(routes.committed, "routes/r1/segments/c")["order"] == 1
        route = data_at(routes.committed, "routes/r1")
        assert route["segmentCount"] == 2
        assert route["safety"]["night"]["score"] == 100

    def test_leaves_the_route_without_levels_when_the_last_segment_goes(self):
        state = RouteState(
            [Tramo("a", "A", 0, POINTS, 1)], [FranjaHoraria("morning", "06:00", "09:00")], {}
        )
        deps, routes = make(state)

        delete_segment({"routeId": "r1", "segmentId": "a"}, deps)

        route = data_at(routes.committed, "routes/r1")
        assert (route["segmentCount"], route["safety"]) == (0, {})

    def test_reports_a_missing_segment(self):
        deps, _ = make()

        assert (
            failure(lambda: delete_segment({"routeId": "r1", "segmentId": "zz"}, deps)).reason
            == "segment-not-found"
        )


class TestTimeSlots:
    def test_creates_a_slot_and_adds_it_to_every_segment_and_the_route(self):
        deps, routes = make()

        new_id = create_time_slot(
            {
                "routeId": "r1",
                "label": "Noon",
                "startTime": "12:00",
                "endTime": "14:00",
                "validFrom": "2026-11-01",
            },
            deps,
        )

        assert new_id == "new-1"
        assert data_at(routes.committed, "routes/r1/timeSlots/new-1") == {
            "label": "Noon",
            "startTime": "12:00",
            "endTime": "14:00",
            "validFrom": "2026-11-01",
            "createdAt": TS,
            "updatedAt": TS,
        }
        for segment_id in ("a", "b", "c"):
            assert (
                "new-1" in data_at(routes.committed, f"routes/r1/segments/{segment_id}")["safety"]
            )
        added = data_at(routes.committed, "routes/r1")["safety"]["new-1"]
        assert (added["level"], added["startTime"], added["endTime"]) == ("high", "12:00", "14:00")

    def test_rejects_a_slot_overlapping_another_slot_of_the_route(self):
        deps, routes = make()

        error = failure(
            lambda: create_time_slot(
                {"routeId": "r1", "startTime": "08:00", "endTime": "10:00"}, deps
            )
        )

        assert (error.kind, error.reason) == (ErrorKind.FAILED_PRECONDITION, "time-slot-overlap")
        assert routes.committed == []

    def test_allows_touching_slots(self):
        deps, _ = make()

        assert (
            create_time_slot({"routeId": "r1", "startTime": "09:00", "endTime": "19:00"}, deps)
            == "new-1"
        )

    def test_updates_a_slot_ignoring_overlap_with_itself_and_recalculates(self):
        deps, routes = make()

        # 05:00-20:00 overlaps the night slot.
        with pytest.raises(DomainError):
            update_time_slot(
                {"routeId": "r1", "slotId": "morning", "startTime": "05:00", "endTime": "20:00"},
                deps,
            )
        assert routes.committed == []

        update_time_slot(
            {"routeId": "r1", "slotId": "night", "startTime": "17:00", "endTime": "24:00"}, deps
        )

        assert data_at(routes.committed, "routes/r1/timeSlots/night") == {
            "startTime": "17:00",
            "endTime": "24:00",
            "label": DEL,
            "validFrom": DEL,
            "validTo": DEL,
            "updatedAt": TS,
        }
        assert op_at(routes.committed, "routes/r1/timeSlots/night").op == "update"
        assert data_at(routes.committed, "routes/r1")["safety"]["night"]["startTime"] == "17:00"

    def test_rejects_an_overlapping_update_and_a_missing_slot(self):
        deps, _ = make()

        overlapping = failure(
            lambda: update_time_slot(
                {"routeId": "r1", "slotId": "morning", "startTime": "05:00", "endTime": "20:00"},
                deps,
            )
        )
        missing = failure(
            lambda: update_time_slot(
                {"routeId": "r1", "slotId": "zz", "startTime": "01:00", "endTime": "02:00"}, deps
            )
        )

        assert overlapping.reason == "time-slot-overlap"
        assert (missing.kind, missing.reason) == (ErrorKind.NOT_FOUND, "time-slot-not-found")

    def test_deletes_a_slot_and_drops_it_from_the_computed_safety(self):
        deps, routes = make()

        delete_time_slot({"routeId": "r1", "slotId": "night"}, deps)

        assert op_at(routes.committed, "routes/r1/timeSlots/night") == WriteOp(
            "delete", "routes/r1/timeSlots/night"
        )
        assert list(data_at(routes.committed, "routes/r1/segments/b")["safety"]) == ["morning"]
        assert list(data_at(routes.committed, "routes/r1")["safety"]) == ["morning"]

    def test_caps_the_number_of_slots_per_route(self):
        state = empty_state()
        state.slots.extend(
            FranjaHoraria(f"t{i}", f"{i:02d}:00", f"{i:02d}:30")
            for i in range(SETTINGS.max_time_slots_per_route)
        )
        deps, _ = make(state)

        error = failure(
            lambda: create_time_slot(
                {"routeId": "r1", "startTime": "23:00", "endTime": "23:30"}, deps
            )
        )

        assert (error.kind, error.reason) == (ErrorKind.FAILED_PRECONDITION, "too-many-time-slots")


class TestRiskFactors:
    def test_creates_a_factor_and_recalculates_the_segment_and_route(self):
        deps, routes = make()

        new_id = create_risk_factor(
            {
                "routeId": "r1",
                "segmentId": "a",
                "type": "traffic",
                "severity": "medium",
                "description": "Busy road",
            },
            deps,
        )

        assert new_id == "new-1"
        assert data_at(routes.committed, "routes/r1/segments/a/riskFactors/new-1") == {
            "type": "traffic",
            "severity": "medium",
            "description": "Busy road",
            "createdAt": TS,
            "updatedAt": TS,
        }
        assert data_at(routes.committed, "routes/r1/segments/a")["safety"]["morning"]["score"] == 80
        route = data_at(routes.committed, "routes/r1")["safety"]
        assert (route["morning"]["score"], route["morning"]["worstSegmentId"]) == (80, "a")
        assert (route["night"]["score"], route["night"]["worstSegmentId"]) == (65, "b")
        assert len(route["night"]["factors"]) == 2

    def test_updates_a_factor(self):
        deps, routes = make()

        update_risk_factor(
            {
                "routeId": "r1",
                "segmentId": "b",
                "factorId": "f1",
                "type": "poor_lighting",
                "severity": "low",
                "description": "Dim",
            },
            deps,
        )

        path = "routes/r1/segments/b/riskFactors/f1"
        assert data_at(routes.committed, path) == {
            "type": "poor_lighting",
            "severity": "low",
            "description": "Dim",
            "startTime": DEL,
            "endTime": DEL,
            "updatedAt": TS,
        }
        assert op_at(routes.committed, path).op == "update"
        assert data_at(routes.committed, "routes/r1")["safety"]["morning"]["score"] == 90

    def test_deletes_a_factor_and_recalculates(self):
        deps, routes = make()

        delete_risk_factor({"routeId": "r1", "segmentId": "b", "factorId": "f1"}, deps)

        assert op_at(routes.committed, "routes/r1/segments/b/riskFactors/f1").op == "delete"
        assert data_at(routes.committed, "routes/r1")["safety"]["night"]["score"] == 100

    def test_reports_missing_segments_and_factors(self):
        deps, _ = make()
        payload = {"routeId": "r1", "type": "traffic", "severity": "low", "description": "x"}
        missing_route, _ = make(existing=False)

        assert (
            failure(lambda: create_risk_factor({**payload, "segmentId": "zz"}, deps)).reason
            == "segment-not-found"
        )
        assert (
            failure(
                lambda: update_risk_factor({**payload, "segmentId": "a", "factorId": "f1"}, deps)
            ).reason
            == "risk-factor-not-found"
        )
        assert (
            failure(
                lambda: delete_risk_factor(
                    {"routeId": "r1", "segmentId": "b", "factorId": "zz"}, deps
                )
            ).reason
            == "risk-factor-not-found"
        )
        assert (
            failure(
                lambda: delete_risk_factor(
                    {"routeId": "r1", "segmentId": "b", "factorId": "f1"}, missing_route
                )
            ).reason
            == "route-not-found"
        )

    def test_caps_the_number_of_factors_per_segment(self):
        state = sample_state()
        state.factors["a"] = [
            FactorDeRiesgo(f"f{i}", "other", "low", "x")
            for i in range(SETTINGS.max_risk_factors_per_segment)
        ]
        deps, _ = make(state)

        error = failure(
            lambda: create_risk_factor(
                {
                    "routeId": "r1",
                    "segmentId": "a",
                    "type": "traffic",
                    "severity": "low",
                    "description": "x",
                },
                deps,
            )
        )

        assert (error.kind, error.reason) == (
            ErrorKind.FAILED_PRECONDITION,
            "too-many-risk-factors",
        )
