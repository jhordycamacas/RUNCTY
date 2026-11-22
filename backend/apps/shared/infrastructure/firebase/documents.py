"""Plain documents of one top-level collection, for the repositories of simple aggregates.

Each repository maps its domain model to and from the dictionaries of a `DocumentStore`.
"""

from typing import Protocol

from google.cloud.firestore import CollectionReference, FieldFilter

from apps.shared.infrastructure.firebase.app import firestore_client


class DocumentStore(Protocol):
    def new_id(self) -> str: ...

    def get(self, doc_id: str) -> dict | None: ...

    def where(self, field: str, value: object) -> list[tuple[str, dict]]:
        """The (id, document) pairs whose `field` equals `value`."""
        ...

    def all(self) -> list[tuple[str, dict]]: ...

    def set(self, doc_id: str, data: dict) -> None:
        """Creates or replaces the whole document."""
        ...

    def delete(self, doc_id: str) -> None: ...


class FirestoreDocumentStore:
    """`DocumentStore` over a Firestore collection."""

    def __init__(self, collection: str) -> None:
        self._name = collection

    def _collection(self) -> CollectionReference:
        return firestore_client().collection(self._name)

    def new_id(self) -> str:
        return self._collection().document().id

    def get(self, doc_id: str) -> dict | None:
        snapshot = self._collection().document(doc_id).get()
        return snapshot.to_dict() if snapshot.exists else None

    def where(self, field: str, value: object) -> list[tuple[str, dict]]:
        # Single-field query, so no composite index is needed.
        query = self._collection().where(filter=FieldFilter(field, "==", value))
        return [(snapshot.id, snapshot.to_dict()) for snapshot in query.stream()]

    def all(self) -> list[tuple[str, dict]]:
        return [(snapshot.id, snapshot.to_dict()) for snapshot in self._collection().stream()]

    def set(self, doc_id: str, data: dict) -> None:
        self._collection().document(doc_id).set(data)

    def delete(self, doc_id: str) -> None:
        self._collection().document(doc_id).delete()
