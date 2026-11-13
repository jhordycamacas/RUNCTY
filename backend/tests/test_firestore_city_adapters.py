"""The Firestore city adapters against a mocked SDK client (no emulator)."""

from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest
from google.api_core.exceptions import Conflict
from google.cloud.firestore import SERVER_TIMESTAMP

from apps.cities.domain.models import Ciudad
from apps.cities.infrastructure import firestore_city_repository, firestore_city_usage
from apps.cities.infrastructure.firestore_city_repository import FirestoreCityRepository
from apps.cities.infrastructure.firestore_city_usage import FirestoreCityUsage

LOJA = Ciudad("loja", "Loja", "Loja", "city", -3.99, -79.2, "active")


def snapshot(doc_id: str, data: dict | None = None) -> SimpleNamespace:
    return SimpleNamespace(id=doc_id, exists=data is not None, to_dict=lambda: data)


class TestFirestoreCityRepository:
    @pytest.fixture
    def cities(self, monkeypatch) -> MagicMock:
        client = MagicMock()
        monkeypatch.setattr(firestore_city_repository, "firestore_client", lambda: client)
        return client.collection.return_value

    def test_reads_one_city(self, cities):
        cities.document.return_value.get.return_value = snapshot("loja", LOJA.to_document())

        assert FirestoreCityRepository().get("loja") == LOJA
        cities.document.assert_called_once_with("loja")

    def test_a_missing_document_is_no_city(self, cities):
        cities.document.return_value.get.return_value = snapshot("ghost")

        assert FirestoreCityRepository().get("ghost") is None

    def test_lists_every_city(self, cities):
        cities.stream.return_value = [snapshot("loja", LOJA.to_document())]

        assert FirestoreCityRepository().list() == [LOJA]
        cities.where.assert_not_called()

    def test_filters_by_coverage_in_the_query(self, cities):
        cities.where.return_value.stream.return_value = [snapshot("loja", LOJA.to_document())]

        assert FirestoreCityRepository().list("active") == [LOJA]
        (filter_,) = (call.kwargs["filter"] for call in cities.where.call_args_list)
        assert (filter_.field_path, filter_.op_string, filter_.value) == (
            "coverage",
            "==",
            "active",
        )

    def test_create_adds_the_server_timestamps(self, cities):
        assert FirestoreCityRepository().create(LOJA) is True

        cities.document.return_value.create.assert_called_once_with(
            {**LOJA.to_document(), "createdAt": SERVER_TIMESTAMP, "updatedAt": SERVER_TIMESTAMP}
        )

    def test_create_reports_an_existing_id(self, cities):
        cities.document.return_value.create.side_effect = Conflict("exists")

        assert FirestoreCityRepository().create(LOJA) is False

    def test_update_leaves_the_creation_time_alone(self, cities):
        FirestoreCityRepository().update(LOJA)

        cities.document.return_value.update.assert_called_once_with(
            {**LOJA.to_document(), "updatedAt": SERVER_TIMESTAMP}
        )

    def test_delete(self, cities):
        FirestoreCityRepository().delete("loja")

        cities.document.assert_called_once_with("loja")
        cities.document.return_value.delete.assert_called_once_with()


class TestFirestoreCityUsage:
    @pytest.fixture
    def client(self, monkeypatch) -> MagicMock:
        client = MagicMock()
        monkeypatch.setattr(firestore_city_usage, "firestore_client", lambda: client)
        return client

    @staticmethod
    def found(client: MagicMock, collection: str, rows: list) -> MagicMock:
        query = client.collection.return_value.where.return_value.limit.return_value
        query.stream.return_value = rows
        return query

    def test_has_routes_queries_the_city_of_the_routes(self, client):
        self.found(client, "routes", [snapshot("r1", {})])

        assert FirestoreCityUsage().has_routes("loja") is True
        client.collection.assert_called_once_with("routes")
        filter_ = client.collection.return_value.where.call_args.kwargs["filter"]
        assert (filter_.field_path, filter_.value) == ("cityId", "loja")

    def test_has_zones_queries_the_parent_of_the_cities(self, client):
        self.found(client, "cities", [])

        assert FirestoreCityUsage().has_zones("loja") is False
        client.collection.assert_called_once_with("cities")
        filter_ = client.collection.return_value.where.call_args.kwargs["filter"]
        assert (filter_.field_path, filter_.value) == ("parentCityId", "loja")
