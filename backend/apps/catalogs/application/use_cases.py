"""Option catalogs (`settings.manage` to edit, checked by the presentation layer).

The runner forms and the sport profile read a catalog with `get_catalog`; a catalog nobody saved
is its defaults, so the app works before the seed runs.
"""

from apps.catalogs.application.ports import CatalogRepository
from apps.catalogs.domain.models import CATALOG_IDS, Catalog
from apps.shared.domain.errors import DomainError, ErrorKind


def _known(catalog_id: str) -> None:
    if catalog_id not in CATALOG_IDS:
        raise DomainError(ErrorKind.NOT_FOUND, "catalog-not-found", "The catalog does not exist.")


def get_catalog(catalog_id: str, catalogs: CatalogRepository) -> Catalog:
    """The stored catalog, or its defaults when nobody saved one (or nothing usable is stored)."""
    _known(catalog_id)
    stored = catalogs.get(catalog_id)
    return stored if stored is not None and stored.active_codes() else Catalog.defaults(catalog_id)


def update_catalog(catalog_id: str, raw_items: object, catalogs: CatalogRepository) -> Catalog:
    """Replaces the items of a catalog; a code that existed may only be deactivated."""
    current = get_catalog(catalog_id, catalogs)
    updated = Catalog.parse(catalog_id, raw_items, current)
    catalogs.save(updated)
    return updated


def ensure_default_catalogs(catalogs: CatalogRepository) -> list[str]:
    """Saves the defaults of every catalog not saved yet; returns the ids it saved."""
    missing = [catalog_id for catalog_id in CATALOG_IDS if catalogs.get(catalog_id) is None]
    for catalog_id in missing:
        catalogs.save(Catalog.defaults(catalog_id))
    return missing
