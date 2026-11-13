from google.api_core.exceptions import Conflict
from google.cloud.firestore import SERVER_TIMESTAMP, CollectionReference, FieldFilter

from apps.cities.domain.models import Ciudad
from apps.shared.infrastructure.firebase.app import firestore_client
from apps.shared.infrastructure.firebase.collections import CITIES


class FirestoreCityRepository:
    """`CityRepository` adapter over the `cities` collection."""

    def _cities(self) -> CollectionReference:
        return firestore_client().collection(CITIES)

    def get(self, city_id: str) -> Ciudad | None:
        snapshot = self._cities().document(city_id).get()
        return Ciudad.from_document(snapshot.id, snapshot.to_dict()) if snapshot.exists else None

    def list(self, coverage: str | None = None) -> list[Ciudad]:
        cities = self._cities()
        # Single-field query, so no composite index is needed.
        query = (
            cities
            if coverage is None
            else cities.where(filter=FieldFilter("coverage", "==", coverage))
        )
        return [
            Ciudad.from_document(snapshot.id, snapshot.to_dict()) for snapshot in query.stream()
        ]

    def create(self, city: Ciudad) -> bool:
        document = {
            **city.to_document(),
            "createdAt": SERVER_TIMESTAMP,
            "updatedAt": SERVER_TIMESTAMP,
        }
        try:
            # create() fails if the document appeared in the meantime.
            self._cities().document(city.id).create(document)
        except Conflict:
            return False
        return True

    def update(self, city: Ciudad) -> None:
        self._cities().document(city.id).update(
            {**city.to_document(), "updatedAt": SERVER_TIMESTAMP}
        )

    def delete(self, city_id: str) -> None:
        self._cities().document(city_id).delete()
