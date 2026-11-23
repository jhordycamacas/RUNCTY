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
    assert "level" in selected  # the sport level of the profile, never the other profile fields
    assert "goals" not in selected
    assert documents == [("photo", {})]


def test_users_are_read_with_their_city_and_nothing_personal(monkeypatch):
    client = MagicMock()
    monkeypatch.setattr(firestore_summary_source, "firestore_client", lambda: client)
    query = client.collection.return_value.select.return_value.limit.return_value
    query.stream.return_value = [
        SimpleNamespace(to_dict=lambda: {"role": "runner", "createdAt": None, "cityId": "loja"}),
        SimpleNamespace(to_dict=lambda: {"role": "", "cityId": 7}),
    ]

    records = FirestoreSummarySource().users(50)

    selected = client.collection.return_value.select.call_args.args[0]
    assert set(selected) == {"role", "createdAt", "cityId"}
    assert [(record.role, record.city_id) for record in records] == [
        ("runner", "loja"),
        (None, None),
    ]
