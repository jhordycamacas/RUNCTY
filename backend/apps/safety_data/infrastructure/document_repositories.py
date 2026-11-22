from apps.safety_data.domain.models import FuenteInformacion, IncidenteSeguridad
from apps.shared.infrastructure.firebase.collections import INFORMATION_SOURCES, SAFETY_INCIDENTS
from apps.shared.infrastructure.firebase.documents import DocumentStore, FirestoreDocumentStore


class FirestoreSourceRepository:
    """`SourceRepository` adapter over `informationSources`."""

    def __init__(self, store: DocumentStore | None = None) -> None:
        self._store = store or FirestoreDocumentStore(INFORMATION_SOURCES)

    def new_id(self) -> str:
        return self._store.new_id()

    def get(self, source_id: str) -> FuenteInformacion | None:
        data = self._store.get(source_id)
        return None if data is None else FuenteInformacion.from_document(source_id, data)

    def save(self, source: FuenteInformacion) -> None:
        self._store.set(source.id, source.to_document())

    def delete(self, source_id: str) -> None:
        self._store.delete(source_id)

    def list(self) -> list[FuenteInformacion]:
        return [FuenteInformacion.from_document(i, data) for i, data in self._store.all()]


class FirestoreIncidentRepository:
    """`IncidentRepository` adapter over `safetyIncidents`. Malformed documents are skipped."""

    def __init__(self, store: DocumentStore | None = None) -> None:
        self._store = store or FirestoreDocumentStore(SAFETY_INCIDENTS)

    def new_id(self) -> str:
        return self._store.new_id()

    def get(self, incident_id: str) -> IncidenteSeguridad | None:
        data = self._store.get(incident_id)
        return None if data is None else IncidenteSeguridad.from_document(incident_id, data)

    @staticmethod
    def _parsed(documents: list[tuple[str, dict]]) -> list[IncidenteSeguridad]:
        parsed = (IncidenteSeguridad.from_document(i, data) for i, data in documents)
        return [incident for incident in parsed if incident is not None]

    def of_source(self, source_id: str) -> list[IncidenteSeguridad]:
        return self._parsed(self._store.where("sourceId", source_id))

    def list(self, route_id: str | None = None) -> list[IncidenteSeguridad]:
        documents = (
            self._store.all() if route_id is None else self._store.where("routeId", route_id)
        )
        return self._parsed(documents)
