"""The Firestore route adapter against a mocked SDK client (no emulator)."""

from types import SimpleNamespace
from unittest.mock import MagicMock, call

import pytest
from google.cloud.firestore import DELETE_FIELD, SERVER_TIMESTAMP

from apps.routes.application import ports
from apps.routes.application.ports import WriteOp
from apps.routes.domain.models import FactorDeRiesgo, FranjaHoraria, Ruta, Tramo
from apps.routes.infrastructure import firestore_route_repository as module
from apps.routes.infrastructure.firestore_route_repository import (
    FirestoreRouteRepository,
    _apply,
    _mutate,
)
from apps.safety_data.domain.models import IncidenteSeguridad

ROUTE = {
    "name": "Loop",
    "cityId": "loja",
    "start": {"lat": 1, "lng": 2, "label": "A"},
    "end": {"lat": 3, "lng": 4, "label": "B"},
    "distanceKm": 5,
    "elevationGainM": 6,
    "surface": "asphalt",
    "difficulty": "beginner",
    "active": True,
}
INCIDENT = {
    "routeId": "r1",
    "segmentId": "s1",
    "type": "robbery",
    "date": "2026-11-01",
    "time": "20:00",
    "sourceId": "src1",
    "sourceDeleted": False,
}


def snapshot(doc_id: str, data: dict | None = None, **extra) -> SimpleNamespace:
    return SimpleNamespace(id=doc_id, exists=data is not None, to_dict=lambda: data, **extra)


def route_tree(client: MagicMock) -> SimpleNamespace:
    """A route with one segment (and a good and a malformed risk factor) and one time slot."""
    factors = MagicMock()
    factors.stream.return_value = [
        snapshot("f1", {"type": "traffic", "severity": "low", "description": "x"}),
        snapshot("f2", {"type": "crime", "severity": "low"}),
    ]
    segment_doc = MagicMock()
    segment_doc.collection.return_value = factors
    segments = MagicMock()
    segments.stream.return_value = [
        snapshot("s1", {"name": "Gate", "order": 0}, reference=segment_doc)
    ]
    slots = MagicMock()
    slots.stream.return_value = [snapshot("t1", {"startTime": "06:00", "endTime": "09:00"})]
    route = client.collection.return_value.document.return_value
    route.id = "r1"
    route.get.return_value = snapshot("r1", ROUTE)
    route.collection.side_effect = lambda name: {"segments": segments, "timeSlots": slots}[name]
    # The `safetyIncidents` query by route: a valid and a malformed incident.
    incidents = client.collection.return_value.where.return_value
    incidents.stream.return_value = [
        snapshot("i1", INCIDENT),
        snapshot("i2", {**INCIDENT, "type": "crime"}),
    ]
    return SimpleNamespace(
        route=route, segments=segments, slots=slots, factors=factors, incidents=incidents
    )


@pytest.fixture
def client(monkeypatch) -> MagicMock:
    client = MagicMock()
    monkeypatch.setattr(module, "firestore_client", lambda: client)
    return client


class TestReading:
    def test_reads_one_route(self, client):
        client.collection.return_value.document.return_value.get.return_value = snapshot(
            "r1", ROUTE
        )

        route = FirestoreRouteRepository().get("r1")

        assert route == Ruta.from_document("r1", ROUTE)
        client.collection.assert_called_once_with("routes")

    def test_a_missing_document_is_no_route(self, client):
        client.collection.return_value.document.return_value.get.return_value = snapshot("ghost")

        repository = FirestoreRouteRepository()

        assert repository.get("ghost") is None
        assert repository.state("ghost") is None

    def test_lists_every_route_or_those_of_a_city(self, client):
        routes = client.collection.return_value
        routes.stream.return_value = [snapshot("r1", ROUTE)]
        routes.where.return_value.stream.return_value = [snapshot("r2", ROUTE)]
        repository = FirestoreRouteRepository()

        assert [r.id for r in repository.list()] == ["r1"]
        assert [r.id for r in repository.list("loja")] == ["r2"]
        filter_ = routes.where.call_args.kwargs["filter"]
        assert (filter_.field_path, filter_.op_string, filter_.value) == ("cityId", "==", "loja")

    def test_the_state_holds_segments_slots_and_valid_factors(self, client):
        route_tree(client)

        state = FirestoreRouteRepository().state("r1")

        assert state.segments == [Tramo("s1", "Gate", 0, (), 0)]
        assert state.slots == [FranjaHoraria("t1", "06:00", "09:00")]
        assert state.factors == {"s1": [FactorDeRiesgo("f1", "traffic", "low", "x")]}
        assert state.incidents == [IncidenteSeguridad.from_document("i1", INCIDENT)]
        client.collection.assert_any_call("safetyIncidents")
        filter_ = client.collection.return_value.where.call_args.kwargs["filter"]
        assert (filter_.field_path, filter_.op_string, filter_.value) == ("routeId", "==", "r1")

    def test_new_ids_come_from_firestore(self, client):
        client.collection.return_value.document.return_value.id = "auto-id"

        assert FirestoreRouteRepository().new_id() == "auto-id"


class TestWriting:
    def test_apply_translates_the_markers_and_picks_the_write_kind(self):
        target, client = MagicMock(), MagicMock()
        data = {"name": "x", "updatedAt": ports.SERVER_TIMESTAMP, "label": ports.DELETE_FIELD}

        _apply(target, client, WriteOp("set", "routes/r1", data))
        _apply(target, client, WriteOp("update", "routes/r1", data))
        _apply(target, client, WriteOp("delete", "routes/r1/segments/s1"))

        expected = {"name": "x", "updatedAt": SERVER_TIMESTAMP, "label": DELETE_FIELD}
        reference = client.document.return_value
        assert target.set.call_args == call(reference, expected)
        assert target.update.call_args == call(reference, expected)
        assert target.delete.call_args == call(reference)
        assert client.document.call_args_list[-1] == call("routes/r1/segments/s1")

    def test_commit_applies_every_write_in_one_batch(self, client):
        ops = [WriteOp("set", "routes/r1", {"a": 1}), WriteOp("delete", "routes/r2")]

        FirestoreRouteRepository().commit(ops)

        batch = client.batch.return_value
        assert batch.set.call_count == 1
        assert batch.delete.call_count == 1
        batch.commit.assert_called_once_with()

    def test_mutate_plans_on_the_state_read_inside_the_transaction(self, client):
        tree = route_tree(client)
        transaction = MagicMock()
        planned = []

        def plan(state):
            planned.append(state)
            return [WriteOp("update", "routes/r1", {"segmentCount": 1})]

        _mutate(transaction, client, "r1", plan)

        tree.route.get.assert_called_once_with(transaction=transaction)
        tree.segments.stream.assert_called_once_with(transaction=transaction)
        tree.slots.stream.assert_called_once_with(transaction=transaction)
        tree.factors.stream.assert_called_once_with(transaction=transaction)
        tree.incidents.stream.assert_called_once_with(transaction=transaction)
        assert planned[0].slots == [FranjaHoraria("t1", "06:00", "09:00")]
        transaction.update.assert_called_once_with(
            client.document.return_value, {"segmentCount": 1}
        )

    def test_mutate_plans_on_none_for_a_missing_route(self, client):
        route = client.collection.return_value.document.return_value
        route.get.return_value = snapshot("ghost")
        transaction = MagicMock()
        planned = []

        _mutate(transaction, client, "ghost", lambda state: planned.append(state) or [])

        assert planned == [None]
        route.collection.assert_not_called()

    def test_mutate_runs_inside_a_firestore_transaction(self, client, monkeypatch):
        seen = []

        def transactional(function):
            seen.append(function)
            return MagicMock()

        monkeypatch.setattr(module, "transactional", transactional)
        plan = MagicMock()

        FirestoreRouteRepository().mutate("r1", plan)

        assert seen == [_mutate]

    def test_delete_tree_removes_the_route_and_everything_under_it(self, client):
        FirestoreRouteRepository().delete_tree("r1")

        client.recursive_delete.assert_called_once_with(
            client.collection.return_value.document.return_value
        )
