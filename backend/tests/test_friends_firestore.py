"""The Firestore adapters of the friends app: requests over the in-memory document store and
friendships against a mocked client (no emulator)."""

from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

from apps.friends.domain.models import FriendRequest
from apps.friends.infrastructure import firestore_friends
from apps.friends.infrastructure.firestore_friends import (
    FirestoreFriendRequestRepository,
    FirestoreFriendshipRepository,
)
from tests.fakes import InMemoryDocumentStore

NOW = "2026-11-23T09:00:00"


def request(request_id: str, from_uid: str, to_uid: str, status: str = "pending") -> FriendRequest:
    return FriendRequest(request_id, from_uid, to_uid, status, NOW)


class TestRequestRepository:
    @pytest.fixture
    def requests(self, firebase) -> FirestoreFriendRequestRepository:
        return FirestoreFriendRequestRepository(InMemoryDocumentStore("friendRequests", firebase))

    def test_saves_reads_and_deletes_a_request(self, requests, firebase):
        requests.save(request("r1", "a", "b"))

        assert firebase.docs["friendRequests/r1"] == {
            "fromUid": "a",
            "toUid": "b",
            "status": "pending",
            "createdAt": NOW,
            "respondedAt": None,
        }
        assert requests.get("r1") == request("r1", "a", "b")
        requests.delete("r1")
        assert requests.get("r1") is None

    def test_finds_the_requests_a_user_sent_or_received(self, requests):
        requests.save(request("r1", "a", "b"))
        requests.save(request("r2", "b", "a", "rejected"))
        requests.save(request("r3", "c", "b"))

        assert [r.id for r in requests.sent_by("a")] == ["r1"]
        assert [r.id for r in requests.received_by("b")] == ["r1", "r3"]
        assert requests.sent_by("ghost") == []

    def test_reads_a_document_with_missing_fields_as_pending(self, requests, firebase):
        firebase.docs["friendRequests/r9"] = {"fromUid": "a"}

        assert requests.get("r9") == FriendRequest("r9", "a", "", "pending", "")


class TestFriendshipRepository:
    @pytest.fixture
    def client(self, monkeypatch) -> MagicMock:
        client = MagicMock()
        monkeypatch.setattr(firestore_friends, "firestore_client", lambda: client)
        # Each `users/{uid}/friends/{friendUid}` reference is named by its path.
        client.collection.return_value.document.side_effect = lambda uid: SimpleNamespace(
            collection=lambda name: SimpleNamespace(
                document=lambda friend_uid: f"{uid}/{name}/{friend_uid}",
                stream=lambda: [
                    SimpleNamespace(id="f1", to_dict=lambda: {"friendUid": "f1", "since": "s"})
                ],
                list_documents=lambda: [SimpleNamespace(id="f1"), SimpleNamespace(id="f2")],
            )
        )
        return client

    def test_adds_both_sides_in_one_batch(self, client):
        FirestoreFriendshipRepository().add("a", "b", NOW)

        batch = client.batch.return_value
        assert [c.args for c in batch.set.call_args_list] == [
            ("a/friends/b", {"friendUid": "b", "since": NOW}),
            ("b/friends/a", {"friendUid": "a", "since": NOW}),
        ]
        batch.commit.assert_called_once_with()

    def test_removes_both_sides_in_one_batch(self, client):
        FirestoreFriendshipRepository().remove("a", "b")

        batch = client.batch.return_value
        assert [c.args for c in batch.delete.call_args_list] == [("a/friends/b",), ("b/friends/a",)]
        batch.commit.assert_called_once_with()

    def test_removes_every_friendship_of_a_user_on_both_sides(self, client):
        FirestoreFriendshipRepository().remove_all("a")

        batch = client.batch.return_value
        assert [c.args[0] for c in batch.delete.call_args_list] == [
            "a/friends/f1",
            "f1/friends/a",
            "a/friends/f2",
            "f2/friends/a",
        ]
        batch.commit.assert_called_once_with()

    def test_lists_the_friends_of_a_user(self, client):
        friends = FirestoreFriendshipRepository().list("a")

        assert [(f.friend_uid, f.since) for f in friends] == [("f1", "s")]

    def test_checks_whether_two_users_are_friends(self, client, monkeypatch):
        monkeypatch.setattr(
            firestore_friends,
            "_side",
            lambda uid, friend_uid: SimpleNamespace(
                get=lambda: SimpleNamespace(exists=(uid, friend_uid) == ("a", "b"))
            ),
        )

        assert FirestoreFriendshipRepository().exists("a", "b") is True
        assert FirestoreFriendshipRepository().exists("a", "c") is False
