from typing import Protocol

from apps.catalogs.domain.models import Catalog


class CatalogRepository(Protocol):
    """The documents `catalogs/{id}`, one per catalog."""

    def get(self, catalog_id: str) -> Catalog | None:
        """The stored catalog; None if never saved."""
        ...

    def save(self, catalog: Catalog) -> None: ...
