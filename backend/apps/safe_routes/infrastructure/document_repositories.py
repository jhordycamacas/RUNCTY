from apps.safe_routes.domain.models import SolicitudRutaSegura
from apps.shared.infrastructure.firebase.collections import SAFE_ROUTE_REQUESTS
from apps.shared.infrastructure.firebase.documents import DocumentStore, FirestoreDocumentStore


class FirestoreSafeRouteRequestRepository:
    """`SafeRouteRequestRepository` adapter over `safeRouteRequests`."""

    def __init__(self, store: DocumentStore | None = None) -> None:
        self._store = store or FirestoreDocumentStore(SAFE_ROUTE_REQUESTS)

    def new_id(self) -> str:
        return self._store.new_id()

    def get(self, request_id: str) -> SolicitudRutaSegura | None:
        data = self._store.get(request_id)
        return None if data is None else SolicitudRutaSegura.from_document(request_id, data)

    def save(self, request: SolicitudRutaSegura) -> None:
        self._store.set(request.id, request.to_document())

    def delete(self, request_id: str) -> None:
        self._store.delete(request_id)

    def of_runner(self, uid: str) -> list[SolicitudRutaSegura]:
        return [
            SolicitudRutaSegura.from_document(i, data) for i, data in self._store.where("uid", uid)
        ]
