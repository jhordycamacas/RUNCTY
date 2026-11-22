from google.cloud.firestore import (
    DELETE_FIELD,
    SERVER_TIMESTAMP,
    Client,
    CollectionReference,
    DocumentReference,
    FieldFilter,
    Transaction,
    transactional,
)

from apps.routes.application.ports import Marker, RoutePlan, WriteOp
from apps.routes.domain.models import FactorDeRiesgo, FranjaHoraria, RouteState, Ruta, Tramo
from apps.safety_data.domain.models import IncidenteSeguridad
from apps.shared.infrastructure.firebase.app import firestore_client
from apps.shared.infrastructure.firebase.collections import ROUTES, SAFETY_INCIDENTS

SEGMENTS = "segments"
TIME_SLOTS = "timeSlots"
RISK_FACTORS = "riskFactors"

_SENTINELS = {Marker.SERVER_TIMESTAMP: SERVER_TIMESTAMP, Marker.DELETE_FIELD: DELETE_FIELD}


def _read_state(route: DocumentReference, transaction: Transaction | None) -> RouteState:
    segments = list(route.collection(SEGMENTS).stream(transaction=transaction))
    slots = route.collection(TIME_SLOTS).stream(transaction=transaction)
    factors: dict[str, list[FactorDeRiesgo]] = {}
    for segment in segments:
        documents = segment.reference.collection(RISK_FACTORS).stream(transaction=transaction)
        parsed = (FactorDeRiesgo.from_document(d.id, d.to_dict()) for d in documents)
        factors[segment.id] = [factor for factor in parsed if factor is not None]
    # Single-field query, so no composite index is needed.
    incident_documents = (
        firestore_client()
        .collection(SAFETY_INCIDENTS)
        .where(filter=FieldFilter("routeId", "==", route.id))
        .stream(transaction=transaction)
    )
    incidents = (IncidenteSeguridad.from_document(d.id, d.to_dict()) for d in incident_documents)
    return RouteState(
        segments=[Tramo.from_document(s.id, s.to_dict()) for s in segments],
        slots=[FranjaHoraria.from_document(s.id, s.to_dict()) for s in slots],
        factors=factors,
        incidents=[incident for incident in incidents if incident is not None],
    )


def _apply(target: Transaction, client: Client, op: WriteOp) -> None:
    """Writes `op` through a transaction or a batch."""
    reference = client.document(op.path)
    if op.op == "delete":
        target.delete(reference)
        return
    data = {
        key: _SENTINELS[value] if isinstance(value, Marker) else value
        for key, value in (op.data or {}).items()
    }
    (target.set if op.op == "set" else target.update)(reference, data)


def _mutate(transaction: Transaction, client: Client, route_id: str, plan: RoutePlan) -> None:
    route = client.collection(ROUTES).document(route_id)
    exists = route.get(transaction=transaction).exists
    # All reads come before the first write, as a transaction requires.
    state = _read_state(route, transaction) if exists else None
    for op in plan(state):
        _apply(transaction, client, op)


class FirestoreRouteRepository:
    """`RouteRepository` adapter over `routes/{id}` and its sub-collections."""

    def _routes(self) -> CollectionReference:
        return firestore_client().collection(ROUTES)

    def new_id(self) -> str:
        return self._routes().document().id

    def get(self, route_id: str) -> Ruta | None:
        snapshot = self._routes().document(route_id).get()
        return Ruta.from_document(snapshot.id, snapshot.to_dict()) if snapshot.exists else None

    def state(self, route_id: str) -> RouteState | None:
        route = self._routes().document(route_id)
        return _read_state(route, None) if route.get().exists else None

    def commit(self, ops: list[WriteOp]) -> None:
        client = firestore_client()
        batch = client.batch()
        for op in ops:
            _apply(batch, client, op)
        batch.commit()

    def mutate(self, route_id: str, plan: RoutePlan) -> None:
        client = firestore_client()
        # The planner may run again when the transaction retries.
        transactional(_mutate)(client.transaction(), client, route_id, plan)

    def delete_tree(self, route_id: str) -> None:
        firestore_client().recursive_delete(self._routes().document(route_id))

    def list(self, city_id: str | None = None) -> list[Ruta]:
        routes = self._routes()
        # Single-field query, so no composite index is needed.
        query = (
            routes if city_id is None else routes.where(filter=FieldFilter("cityId", "==", city_id))
        )
        return [Ruta.from_document(snapshot.id, snapshot.to_dict()) for snapshot in query.stream()]
