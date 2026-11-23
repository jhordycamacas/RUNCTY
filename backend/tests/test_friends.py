"""Friendships: the request rules, the use cases, the API and the cleanup on account deletion."""

from datetime import datetime

import pytest

from apps.friends.application import use_cases
from apps.friends.application.use_cases import FriendsDeps
from apps.friends.domain.models import FriendRequest, name_matches, parse_search_text
from apps.shared.domain.errors import DomainError
from apps.users.domain.models import Usuario
from tests.conftest import bearer
from tests.fakes import (
    InMemoryFriendRequestRepository,
    InMemoryFriendshipRepository,
    InMemoryUserRepository,
)

NOW = datetime(2026, 11, 23, 9, 0)
LATER = datetime(2026, 11, 23, 10, 0)
RUNNER = bearer("runner-token")  # runner-1
ADMIN = bearer("admin-token")  # admin-1
REQUESTS = "/api/v1/friends/requests"
CLAIMS = {"role": "runner", "perms": []}


@pytest.fixture
def people(firebase) -> None:
    """Four accounts with real names; the principals keep the name "Test User"."""
    for uid, first, last in [
        ("ana-1", "Ana", "Paz"),
        ("ana-2", "Anabel", "Núñez"),
        ("luis-1", "Luis", "Ana"),
        ("mia-1", "Mia", "Lopez"),
    ]:
        firebase.add_user(
            uid,
            CLAIMS,
            email=f"{uid}@example.com",
            firstName=first,
            lastName=last,
            birthDate="1990-05-05",
            cityId="loja",
            idNumber="1104567890",
        )


@pytest.fixture
def deps(firebase) -> FriendsDeps:
    return FriendsDeps(
        requests=InMemoryFriendRequestRepository(firebase),
        friendships=InMemoryFriendshipRepository(firebase),
        users=InMemoryUserRepository(firebase),
    )


def reason_of(call) -> str:
    with pytest.raises(DomainError) as error:
        call()
    return error.value.reason


class TestFriendRequestDomain:
    def test_creates_a_pending_request_with_server_dates(self):
        request = FriendRequest.create({"toUid": "ana-1"}, "r1", "runner-1", NOW)

        assert (request.from_uid, request.to_uid, request.status) == (
            "runner-1",
            "ana-1",
            "pending",
        )
        assert request.created_at == "2026-11-23T09:00:00"
        assert request.responded_at is None

    def test_cannot_friend_yourself(self):
        assert reason_of(lambda: FriendRequest.create({"toUid": "me"}, "r1", "me", NOW)) == (
            "cannot-friend-self"
        )

    @pytest.mark.parametrize("raw", [None, {}, {"toUid": ""}, {"toUid": 7}, {"toUid": "a/b"}])
    def test_rejects_an_invalid_uid(self, raw):
        assert reason_of(lambda: FriendRequest.create(raw, "r1", "me", NOW)) == "invalid-uid"

    def test_roundtrips_through_its_document(self):
        answered = FriendRequest.create({"toUid": "ana-1"}, "r1", "me", NOW).respond(
            "accepted", LATER
        )

        assert FriendRequest.from_document("r1", answered.to_document()) == answered
        assert answered.responded_at == "2026-11-23T10:00:00"

    @pytest.mark.parametrize("text", [None, 5, "", "  ab  ", "x" * 121])
    def test_search_text_needs_three_to_120_characters(self, text):
        assert reason_of(lambda: parse_search_text(text)) == "invalid-search"

    def test_search_text_is_trimmed(self):
        assert parse_search_text("  ana ") == "ana"

    def test_names_match_by_prefix_ignoring_case_and_accents_but_never_the_email(self):
        user = Usuario("u1", "secret@example.com", "Ñandú", "Núñez", "1990-01-01", "loja")

        assert name_matches(user, "nan")
        assert name_matches(user, "NUN nan")
        assert not name_matches(user, "andu")
        assert not name_matches(user, "secret")


class TestSendRequest:
    def test_saves_a_pending_request(self, deps, people):
        sent = use_cases.send_request({"toUid": "ana-1"}, "runner-1", NOW, deps)

        assert deps.requests.get(sent.id).status == "pending"

    def test_the_user_must_exist(self, deps):
        assert reason_of(
            lambda: use_cases.send_request({"toUid": "ghost"}, "runner-1", NOW, deps)
        ) == ("user-not-found")

    def test_cannot_request_a_friend(self, deps, people):
        deps.friendships.add("runner-1", "ana-1", "2026-01-01T00:00:00")

        assert reason_of(
            lambda: use_cases.send_request({"toUid": "ana-1"}, "runner-1", NOW, deps)
        ) == ("already-friends")

    def test_cannot_duplicate_a_pending_request_in_either_direction(self, deps, people):
        use_cases.send_request({"toUid": "ana-1"}, "runner-1", NOW, deps)

        def again():
            use_cases.send_request({"toUid": "ana-1"}, "runner-1", NOW, deps)

        def reverse():
            use_cases.send_request({"toUid": "runner-1"}, "ana-1", NOW, deps)

        assert reason_of(again) == "request-pending"
        assert reason_of(reverse) == "request-pending"

    def test_a_rejected_request_can_be_sent_again(self, deps, people):
        first = use_cases.send_request({"toUid": "ana-1"}, "runner-1", NOW, deps)
        use_cases.reject_request(first.id, "ana-1", LATER, deps.requests)

        second = use_cases.send_request({"toUid": "ana-1"}, "runner-1", LATER, deps)

        assert second.id != first.id


class TestAnswerRequests:
    def pending(self, deps) -> str:
        return use_cases.send_request({"toUid": "ana-1"}, "runner-1", NOW, deps).id

    def test_accepting_makes_both_users_friends(self, deps, people):
        request_id = self.pending(deps)

        use_cases.accept_request(request_id, "ana-1", LATER, deps)

        assert deps.requests.get(request_id).status == "accepted"
        assert deps.friendships.exists("runner-1", "ana-1")
        assert deps.friendships.exists("ana-1", "runner-1")
        assert [f.friend_uid for f in deps.friendships.list("ana-1")] == ["runner-1"]

    def test_only_the_recipient_answers(self, deps, people):
        request_id = self.pending(deps)

        for answer in (
            lambda: use_cases.accept_request(request_id, "runner-1", LATER, deps),
            lambda: use_cases.accept_request(request_id, "luis-1", LATER, deps),
            lambda: use_cases.reject_request(request_id, "runner-1", LATER, deps.requests),
        ):
            assert reason_of(answer) == "not-request-recipient"
        assert not deps.friendships.exists("runner-1", "ana-1")

    def test_rejecting_keeps_the_request_as_rejected(self, deps, people):
        request_id = self.pending(deps)

        use_cases.reject_request(request_id, "ana-1", LATER, deps.requests)

        assert deps.requests.get(request_id).status == "rejected"
        assert not deps.friendships.exists("runner-1", "ana-1")

    def test_an_answered_or_unknown_request_does_not_exist(self, deps, people):
        request_id = self.pending(deps)
        use_cases.accept_request(request_id, "ana-1", LATER, deps)

        assert reason_of(lambda: use_cases.accept_request(request_id, "ana-1", LATER, deps)) == (
            "request-not-found"
        )
        assert reason_of(lambda: use_cases.accept_request("ghost", "ana-1", LATER, deps)) == (
            "request-not-found"
        )
        assert reason_of(lambda: use_cases.accept_request("bad id!", "ana-1", LATER, deps)) == (
            "invalid-request-id"
        )

    def test_only_the_sender_cancels(self, deps, people):
        request_id = self.pending(deps)

        assert reason_of(lambda: use_cases.cancel_request(request_id, "ana-1", deps.requests)) == (
            "not-request-sender"
        )
        use_cases.cancel_request(request_id, "runner-1", deps.requests)

        assert deps.requests.get(request_id) is None


class TestListings:
    def test_lists_friends_by_name_with_their_public_profile(self, deps, people):
        deps.friendships.add("runner-1", "luis-1", "2026-02-01T00:00:00")
        deps.friendships.add("runner-1", "ana-1", "2026-01-01T00:00:00")
        deps.friendships.add("runner-1", "deleted", "2026-01-01T00:00:00")

        friends = use_cases.list_friends("runner-1", deps)

        assert [(f.profile.uid, f.since) for f in friends] == [
            ("ana-1", "2026-01-01T00:00:00"),
            ("luis-1", "2026-02-01T00:00:00"),
        ]

    def test_removing_a_friend_is_idempotent_and_removes_both_sides(self, deps, people):
        deps.friendships.add("runner-1", "ana-1", "2026-01-01T00:00:00")

        use_cases.remove_friend("ana-1", "runner-1", deps.friendships)
        use_cases.remove_friend("ana-1", "runner-1", deps.friendships)

        assert not deps.friendships.exists("ana-1", "runner-1")
        assert not deps.friendships.exists("runner-1", "ana-1")

    def test_lists_only_pending_requests_split_by_direction_newest_first(self, deps, people):
        older = use_cases.send_request({"toUid": "ana-1"}, "runner-1", NOW, deps)
        newer = use_cases.send_request({"toUid": "luis-1"}, "runner-1", LATER, deps)
        received = use_cases.send_request({"toUid": "runner-1"}, "ana-2", NOW, deps)
        rejected = use_cases.send_request({"toUid": "runner-1"}, "mia-1", NOW, deps)
        use_cases.reject_request(rejected.id, "runner-1", LATER, deps.requests)

        pending = use_cases.list_pending_requests("runner-1", deps)

        assert [v.request.id for v in pending.outgoing] == [newer.id, older.id]
        assert [v.profile.uid for v in pending.outgoing] == ["luis-1", "ana-1"]
        assert [v.request.id for v in pending.incoming] == [received.id]
        assert pending.incoming[0].profile.uid == "ana-2"


class TestSearch:
    def test_finds_by_name_prefix_with_the_relation_and_without_the_caller(self, deps, people):
        deps.friendships.add("runner-1", "ana-1", "2026-01-01T00:00:00")
        use_cases.send_request({"toUid": "ana-2"}, "runner-1", NOW, deps)
        use_cases.send_request({"toUid": "runner-1"}, "luis-1", NOW, deps)

        hits = use_cases.search_people("ana", "runner-1", deps)

        assert {(h.profile.uid, h.relation) for h in hits} == {
            ("ana-1", "friend"),
            ("ana-2", "request-sent"),
            ("luis-1", "request-received"),
        }

    def test_an_account_with_no_relation_is_none(self, deps, people):
        assert [
            (h.profile.uid, h.relation) for h in use_cases.search_people("luis", "runner-1", deps)
        ] == [("luis-1", "none")]

    def test_excludes_the_caller_and_never_matches_email_or_id_number(self, deps, people):
        assert use_cases.search_people("test", "runner-1", deps) != []
        assert all(
            h.profile.uid != "runner-1" for h in use_cases.search_people("test", "runner-1", deps)
        )
        assert use_cases.search_people("ana-1@example.com", "runner-1", deps) == []
        assert use_cases.search_people("1104567890", "runner-1", deps) == []

    def test_returns_at_most_twenty_results(self, deps, firebase):
        for number in range(25):
            firebase.add_user(f"zoe-{number:02}", CLAIMS, firstName="Zoe", lastName="Z", cityId="x")

        assert len(use_cases.search_people("zoe", "runner-1", deps)) == 20

    def test_the_text_needs_three_characters(self, deps):
        assert reason_of(lambda: use_cases.search_people("an", "runner-1", deps)) == (
            "invalid-search"
        )


class TestApi:
    def test_every_endpoint_needs_a_signed_in_user(self, client):
        calls = [
            client.get("/api/v1/friends"),
            client.get(f"{REQUESTS}"),
            client.post(REQUESTS, {"toUid": "x"}, format="json"),
            client.post(f"{REQUESTS}/r1/accept"),
            client.post(f"{REQUESTS}/r1/reject"),
            client.delete(f"{REQUESTS}/r1"),
            client.delete("/api/v1/friends/ana-1"),
            client.get("/api/v1/friends/search?q=ana"),
        ]

        assert [call.status_code for call in calls] == [401] * len(calls)

    def test_the_whole_flow(self, client, people):
        created = client.post(REQUESTS, {"toUid": "ana-1"}, format="json", **RUNNER)
        assert created.status_code == 201
        request_id = created.json()["id"]

        outgoing = client.get(REQUESTS, **RUNNER).json()["outgoing"]
        assert outgoing == [
            {
                "id": request_id,
                "createdAt": outgoing[0]["createdAt"],
                "profile": {
                    "uid": "ana-1",
                    "firstName": "Ana",
                    "lastName": "Paz",
                    "cityId": "loja",
                },
            }
        ]

        # Only the admin token can answer as a second account, so continue with it.
        client.delete(f"{REQUESTS}/{request_id}", **RUNNER)
        sent = client.post(REQUESTS, {"toUid": "admin-1"}, format="json", **RUNNER).json()["id"]

        assert client.post(f"{REQUESTS}/{sent}/accept", **ADMIN).status_code == 204

        friends = client.get("/api/v1/friends", **RUNNER).json()["friends"]
        assert [f["profile"]["uid"] for f in friends] == ["admin-1"]
        assert client.get("/api/v1/friends", **ADMIN).json()["friends"][0]["profile"]["uid"] == (
            "runner-1"
        )
        assert client.delete("/api/v1/friends/admin-1", **RUNNER).status_code == 204
        assert client.delete("/api/v1/friends/admin-1", **RUNNER).status_code == 204
        assert client.get("/api/v1/friends", **ADMIN).json() == {"friends": []}

    def test_a_user_cannot_answer_a_request_addressed_to_someone_else(self, client, people):
        request_id = client.post(REQUESTS, {"toUid": "ana-1"}, format="json", **RUNNER).json()["id"]

        for path in ("accept", "reject"):
            denied = client.post(f"{REQUESTS}/{request_id}/{path}", **ADMIN)
            assert denied.status_code == 403
            assert denied.json()["error"]["reason"] == "not-request-recipient"
        assert client.delete(f"{REQUESTS}/{request_id}", **ADMIN).status_code == 403

    def test_conflicts_and_validation(self, client, people):
        assert client.post(REQUESTS, {"toUid": "ana-1"}, format="json", **RUNNER).status_code == 201

        duplicate = client.post(REQUESTS, {"toUid": "ana-1"}, format="json", **RUNNER)
        self_request = client.post(REQUESTS, {"toUid": "runner-1"}, format="json", **RUNNER)
        ghost = client.post(REQUESTS, {"toUid": "ghost"}, format="json", **RUNNER)
        unknown_field = client.post(REQUESTS, {"toUid": "ana-2", "x": 1}, format="json", **RUNNER)

        assert (duplicate.status_code, duplicate.json()["error"]["reason"]) == (
            409,
            "request-pending",
        )
        assert self_request.json()["error"]["reason"] == "cannot-friend-self"
        assert (ghost.status_code, ghost.json()["error"]["reason"]) == (404, "user-not-found")
        assert unknown_field.status_code == 400

    def test_search_never_leaks_private_fields(self, client, people):
        response = client.get("/api/v1/friends/search?q=ana", **RUNNER)

        assert response.status_code == 200
        results = response.json()["results"]
        assert len(results) == 3
        for result in results:
            assert set(result) == {"profile", "relation"}
            assert set(result["profile"]) == {"uid", "firstName", "lastName", "cityId"}
        body = response.content.decode()
        for secret in ("example.com", "1104567890", "1990-05-05"):
            assert secret not in body

    def test_search_rejects_short_text(self, client):
        short = client.get("/api/v1/friends/search?q=an", **RUNNER)
        missing = client.get("/api/v1/friends/search", **RUNNER)

        assert (short.status_code, short.json()["error"]["reason"]) == (400, "invalid-search")
        assert missing.status_code == 400


class TestAccountDeletionCleanup:
    def test_deleting_an_account_removes_its_requests_and_friendships_on_both_sides(
        self, client, people, deps
    ):
        deps.friendships.add("runner-1", "ana-1", "2026-01-01T00:00:00")
        deps.friendships.add("runner-1", "luis-1", "2026-01-01T00:00:00")
        deps.friendships.add("ana-1", "luis-1", "2026-01-01T00:00:00")
        sent = use_cases.send_request({"toUid": "ana-2"}, "runner-1", NOW, deps)
        received = use_cases.send_request({"toUid": "runner-1"}, "mia-1", NOW, deps)
        other = use_cases.send_request({"toUid": "luis-1"}, "ana-2", NOW, deps)

        assert client.delete("/api/v1/users/me", **RUNNER).status_code == 204

        assert deps.requests.get(sent.id) is None
        assert deps.requests.get(received.id) is None
        assert deps.requests.get(other.id) is not None
        assert deps.friendships.list("runner-1") == []
        assert [f.friend_uid for f in deps.friendships.list("ana-1")] == ["luis-1"]
        assert [f.friend_uid for f in deps.friendships.list("luis-1")] == ["ana-1"]

    def test_the_friend_data_is_kept_when_the_last_admin_cannot_be_deleted(
        self, client, deps, people
    ):
        deps.friendships.add("admin-1", "ana-1", "2026-01-01T00:00:00")

        refused = client.delete("/api/v1/users/me", **ADMIN)

        assert refused.json()["error"]["reason"] == "last-admin"

        assert deps.friendships.exists("admin-1", "ana-1")
