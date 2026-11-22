from apps.shared.infrastructure.firebase.collections import GUARDED_TRAILS, SUPPORT_POINTS
from apps.shared.infrastructure.firebase.documents import DocumentStore, FirestoreDocumentStore
from apps.support_points.domain.models import PuntoApoyo, ResguardoPolicial


class FirestoreSupportPointRepository:
    """`SupportPointRepository` adapter over `supportPoints`."""

    def __init__(self, store: DocumentStore | None = None) -> None:
        self._store = store or FirestoreDocumentStore(SUPPORT_POINTS)

    def new_id(self) -> str:
        return self._store.new_id()

    def get(self, point_id: str) -> PuntoApoyo | None:
        data = self._store.get(point_id)
        return None if data is None else PuntoApoyo.from_document(point_id, data)

    def save(self, point: PuntoApoyo) -> None:
        self._store.set(point.id, point.to_document())

    def delete(self, point_id: str) -> None:
        self._store.delete(point_id)

    def list(self, city_id: str | None = None) -> list[PuntoApoyo]:
        documents = self._store.all() if city_id is None else self._store.where("cityId", city_id)
        return [PuntoApoyo.from_document(i, data) for i, data in documents]


class FirestoreGuardedTrailRepository:
    """`GuardedTrailRepository` adapter over `guardedTrails`. Malformed documents are skipped."""

    def __init__(self, store: DocumentStore | None = None) -> None:
        self._store = store or FirestoreDocumentStore(GUARDED_TRAILS)

    def new_id(self) -> str:
        return self._store.new_id()

    def get(self, trail_id: str) -> ResguardoPolicial | None:
        data = self._store.get(trail_id)
        return None if data is None else ResguardoPolicial.from_document(trail_id, data)

    def save(self, trail: ResguardoPolicial) -> None:
        self._store.set(trail.id, trail.to_document())

    def delete(self, trail_id: str) -> None:
        self._store.delete(trail_id)

    def list(self, route_id: str | None = None) -> list[ResguardoPolicial]:
        documents = (
            self._store.all() if route_id is None else self._store.where("routeId", route_id)
        )
        parsed = (ResguardoPolicial.from_document(i, data) for i, data in documents)
        return [trail for trail in parsed if trail is not None]
