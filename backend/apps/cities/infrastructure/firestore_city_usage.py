from google.cloud.firestore import FieldFilter

from apps.shared.infrastructure.firebase.app import firestore_client
from apps.shared.infrastructure.firebase.collections import CITIES, ROUTES


def _any_with(collection: str, field: str, value: str) -> bool:
    # Single-field query, so no composite index is needed.
    query = firestore_client().collection(collection).where(filter=FieldFilter(field, "==", value))
    return any(True for _ in query.limit(1).stream())


class FirestoreCityUsage:
    """`CityUsage` adapter over the `routes` and `cities` collections."""

    def has_routes(self, city_id: str) -> bool:
        return _any_with(ROUTES, "cityId", city_id)

    def has_zones(self, city_id: str) -> bool:
        return _any_with(CITIES, "parentCityId", city_id)
