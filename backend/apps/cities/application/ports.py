from typing import Protocol

from apps.cities.domain.models import Ciudad


class CityRepository(Protocol):
    def get(self, city_id: str) -> Ciudad | None: ...

    def list(self, coverage: str | None = None) -> list[Ciudad]:
        """Every city and zone, or only those with the given coverage."""
        ...

    def create(self, city: Ciudad) -> bool:
        """Stores a new city. Returns False, writing nothing, when the id is taken."""
        ...

    def update(self, city: Ciudad) -> None: ...

    def delete(self, city_id: str) -> None: ...


class CityUsage(Protocol):
    """What still depends on a city."""

    def has_routes(self, city_id: str) -> bool:
        """Any route with `cityId == city_id`."""
        ...

    def has_zones(self, city_id: str) -> bool:
        """Any city or zone with `parentCityId == city_id`."""
        ...
