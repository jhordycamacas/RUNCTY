from datetime import datetime, timezone
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


def test_the_latest_users_are_one_ordered_query_that_reads_no_email_or_id_number(monkeypatch):
    client = MagicMock()
    monkeypatch.setattr(firestore_summary_source, "firestore_client", lambda: client)
    ordered = client.collection.return_value.order_by.return_value
    created = datetime(2026, 11, 17, tzinfo=timezone.utc)
    ordered.select.return_value.limit.return_value.stream.return_value = [
        SimpleNamespace(
            id="u1",
            to_dict=lambda: {
                "firstName": "Ana",
                "lastName": "Mora",
                "cityId": "",
                "createdAt": created,
            },
        ),
        SimpleNamespace(id="u2", to_dict=lambda: {"firstName": "Sin fecha"}),
    ]

    latest = FirestoreSummarySource().latest_users(5)

    assert client.collection.return_value.order_by.call_args.args == ("createdAt",)
    assert set(ordered.select.call_args.args[0]) == {"firstName", "lastName", "cityId", "createdAt"}
    assert [(user.uid, user.first_name, user.city_id) for user in latest] == [("u1", "Ana", None)]


def test_incidents_are_read_by_their_date_only(monkeypatch):
    client = MagicMock()
    monkeypatch.setattr(firestore_summary_source, "firestore_client", lambda: client)
    query = client.collection.return_value.select.return_value.limit.return_value
    query.stream.return_value = [
        SimpleNamespace(to_dict=lambda: {"date": "2026-11-17", "type": "x"}),
        SimpleNamespace(to_dict=lambda: None),
    ]

    dates = FirestoreSummarySource().incident_dates(50)

    client.collection.assert_called_once_with("safetyIncidents")
    assert client.collection.return_value.select.call_args.args[0] == ["date"]
    assert dates == ["2026-11-17", ""]


def test_alerts_are_read_as_stored_documents(monkeypatch):
    client = MagicMock()
    monkeypatch.setattr(firestore_summary_source, "firestore_client", lambda: client)
    query = client.collection.return_value.limit.return_value
    query.stream.return_value = [
        SimpleNamespace(
            id="a1", to_dict=lambda: {"validFrom": "2026-11-01", "validTo": "2026-11-30"}
        )
    ]

    alerts = FirestoreSummarySource().risk_zone_alerts(50)

    client.collection.assert_called_once_with("riskZoneAlerts")
    assert [(alert.id, alert.valid_to) for alert in alerts] == [("a1", "2026-11-30")]
