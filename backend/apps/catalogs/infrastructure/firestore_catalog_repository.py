from apps.catalogs.domain.models import Catalog
from apps.shared.infrastructure.firebase.collections import CATALOGS
from apps.shared.infrastructure.firebase.documents import DocumentStore, FirestoreDocumentStore


class FirestoreCatalogRepository:
    """`CatalogRepository` adapter over `catalogs/{id}`."""

    def __init__(self, store: DocumentStore | None = None) -> None:
        self._store = store or FirestoreDocumentStore(CATALOGS)

    def get(self, catalog_id: str) -> Catalog | None:
        data = self._store.get(catalog_id)
        return None if data is None else Catalog.from_document(catalog_id, data)

    def save(self, catalog: Catalog) -> None:
        self._store.set(catalog.id, catalog.to_document())
