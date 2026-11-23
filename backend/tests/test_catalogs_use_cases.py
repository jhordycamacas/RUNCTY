"""Catalog use cases against the in-memory adapter."""

import pytest

from apps.catalogs.application.use_cases import (
    ensure_default_catalogs,
    get_catalog,
    update_catalog,
)
from apps.catalogs.domain.models import Catalog
from apps.shared.domain.errors import DomainError, ErrorKind
from tests import fakes
from tests.fakes import FIREBASE


@pytest.fixture
def catalogs() -> fakes.InMemoryCatalogRepository:
    return fakes.InMemoryCatalogRepository()


def items_of(catalog: Catalog) -> list[dict]:
    return catalog.to_document()["items"]


class TestGetCatalog:
    def test_gives_the_defaults_before_anything_is_saved(self, catalogs):
        assert get_catalog("sportLevels", catalogs) == Catalog.defaults("sportLevels")
        assert "catalogs/sportLevels" not in FIREBASE.docs

    def test_gives_what_an_admin_saved(self, catalogs):
        FIREBASE.docs["catalogs/sportGoals"] = {
            "items": [{"code": "fun", "label": "Diversión", "order": 1, "active": True}]
        }

        assert get_catalog("sportGoals", catalogs).active_codes() == ("fun",)

    def test_a_stored_document_without_usable_items_falls_back_to_the_defaults(self, catalogs):
        FIREBASE.docs["catalogs/sportGoals"] = {"items": "broken"}

        assert get_catalog("sportGoals", catalogs) == Catalog.defaults("sportGoals")

    def test_an_unknown_catalog_is_not_found(self, catalogs):
        with pytest.raises(DomainError) as error:
            get_catalog("shoes", catalogs)

        assert error.value.kind is ErrorKind.NOT_FOUND
        assert error.value.reason == "catalog-not-found"


class TestUpdateCatalog:
    def test_replaces_the_items_and_stores_them(self, catalogs):
        raw = [
            *items_of(Catalog.defaults("sportLevels")),
            {
                "code": "elite",
                "label": "Élite",
                "order": 4,
                "active": True,
            },
        ]

        saved = update_catalog("sportLevels", raw, catalogs)

        assert saved.active_codes()[-1] == "elite"
        assert FIREBASE.docs["catalogs/sportLevels"] == {"items": items_of(saved)}
        assert get_catalog("sportLevels", catalogs) == saved

    def test_validates_against_the_stored_catalog_not_the_defaults(self, catalogs):
        update_catalog(
            "sportLevels",
            [
                {"code": "only", "label": "Only", "order": 1, "active": True},
                *[{**i, "active": False} for i in items_of(Catalog.defaults("sportLevels"))],
            ],
            catalogs,
        )

        with pytest.raises(DomainError) as error:
            update_catalog(
                "sportLevels",
                [{"code": "beginner", "label": "x", "order": 1, "active": True}],
                catalogs,
            )

        assert error.value.fields == {"items": "code-removed"}

    def test_a_rejected_edit_stores_nothing(self, catalogs):
        with pytest.raises(DomainError):
            update_catalog("sportLevels", [], catalogs)

        assert "catalogs/sportLevels" not in FIREBASE.docs

    def test_an_unknown_catalog_is_not_found_and_stores_nothing(self, catalogs):
        with pytest.raises(DomainError) as error:
            update_catalog("shoes", [], catalogs)

        assert error.value.reason == "catalog-not-found"
        assert not any(path.startswith("catalogs/") for path in FIREBASE.docs)


class TestEnsureDefaultCatalogs:
    def test_saves_every_catalog_that_is_absent(self, catalogs):
        saved = ensure_default_catalogs(catalogs)

        assert saved == ["sportLevels", "sportGoals"]
        assert (
            FIREBASE.docs["catalogs/sportLevels"] == Catalog.defaults("sportLevels").to_document()
        )
        assert FIREBASE.docs["catalogs/sportGoals"] == Catalog.defaults("sportGoals").to_document()

    def test_keeps_what_an_admin_edited(self, catalogs):
        ensure_default_catalogs(catalogs)
        edited = [{**i, "label": "Editado"} for i in items_of(get_catalog("sportLevels", catalogs))]
        update_catalog("sportLevels", edited, catalogs)

        saved = ensure_default_catalogs(catalogs)

        assert saved == []
        assert FIREBASE.docs["catalogs/sportLevels"]["items"][0]["label"] == "Editado"
