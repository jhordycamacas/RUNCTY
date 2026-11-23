from types import SimpleNamespace
from unittest.mock import MagicMock

from apps.summary.infrastructure import firestore_summary_source
from apps.summary.infrastructure.firestore_summary_source import FirestoreSummarySource


def test_private_documents_are_read_without_the_photo_payload(monkeypatch):
    client = MagicMock()
    monkeypatch.setattr(firestore_summary_source, "firestore_client", lambda: client)
    query = client.collection_group.return_value.select.return_value.limit.return_value
    query.stream.return_value = [SimpleNamespace(id="photo", to_dict=lambda: None)]

    documents = FirestoreSummarySource().private_documents(50)

    client.collection_group.assert_called_once_with("private")
    selected = client.collection_group.return_value.select.call_args.args[0]
    assert "data" not in selected
    assert {"language", "fontScale", "appearance", "units", "notifications"} <= set(selected)
    assert documents == [("photo", {})]
