"""The generic Firestore document store against a mocked SDK client (no emulator)."""

from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

from apps.shared.infrastructure.firebase import documents as module
from apps.shared.infrastructure.firebase.documents import FirestoreDocumentStore


def snapshot(doc_id: str, data: dict | None = None) -> SimpleNamespace:
    return SimpleNamespace(id=doc_id, exists=data is not None, to_dict=lambda: data)


@pytest.fixture
def collection(monkeypatch) -> MagicMock:
    client = MagicMock()
    monkeypatch.setattr(module, "firestore_client", lambda: client)
    return client.collection.return_value


def test_reads_one_document_or_none(collection):
    store = FirestoreDocumentStore("supportPoints")
    collection.document.return_value.get.return_value = snapshot("p1", {"a": 1})
    assert store.get("p1") == {"a": 1}

    collection.document.return_value.get.return_value = snapshot("ghost")
    assert store.get("ghost") is None


def test_lists_every_document_or_those_matching_a_field(collection):
    collection.stream.return_value = [snapshot("p1", {"a": 1})]
    collection.where.return_value.stream.return_value = [snapshot("p2", {"a": 2})]
    store = FirestoreDocumentStore("supportPoints")

    assert store.all() == [("p1", {"a": 1})]
    assert store.where("cityId", "loja") == [("p2", {"a": 2})]
    filter_ = collection.where.call_args.kwargs["filter"]
    assert (filter_.field_path, filter_.op_string, filter_.value) == ("cityId", "==", "loja")


def test_writes_replace_or_delete_the_whole_document(collection):
    store = FirestoreDocumentStore("supportPoints")
    collection.document.return_value.id = "auto-id"

    assert store.new_id() == "auto-id"
    store.set("p1", {"a": 1})
    store.delete("p1")

    document = collection.document.return_value
    document.set.assert_called_once_with({"a": 1})
    document.delete.assert_called_once_with()
