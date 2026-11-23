from dataclasses import replace

import pytest

from apps.shared.domain.errors import DomainError
from apps.shared.domain.models import Principal
from apps.users.application.use_cases import delete_account
from apps.users.domain.account_deletion import RECENT_SIGN_IN_MAX_AGE_SEC, is_recent_sign_in
from tests.conftest import bearer
from tests.fakes import (
    ADMIN,
    RUNNER,
    FakeTokenVerifier,
    InMemoryAuthGateway,
    InMemoryFriendsEraser,
    InMemoryUserRepository,
)

NOW = 1_800_000_000.0
URL = "/api/v1/users/me"
ADMIN_CLAIMS = {"role": "admin", "perms": []}


class TestIsRecentSignIn:
    def test_accepts_a_sign_in_within_the_allowed_window(self):
        assert is_recent_sign_in(NOW - 30, NOW)
        assert is_recent_sign_in(NOW - RECENT_SIGN_IN_MAX_AGE_SEC, NOW)

    def test_rejects_an_old_or_missing_sign_in_time(self):
        assert not is_recent_sign_in(NOW - RECENT_SIGN_IN_MAX_AGE_SEC - 1, NOW)
        assert not is_recent_sign_in(None, NOW)
        assert Principal.from_claims({"uid": "u1", "auth_time": "soon"}).auth_time is None
        assert Principal.from_claims({"uid": "u1", "auth_time": True}).auth_time is None

    def test_reads_the_sign_in_time_of_the_token(self):
        caller = Principal.from_claims({"uid": "u1", "auth_time": 1_799_999_970})

        assert caller.auth_time == NOW - 30


class TestDeleteAccount:
    def delete(self, firebase, principal: Principal, seconds_since_sign_in: float = 30) -> None:
        caller = replace(principal, auth_time=NOW - seconds_since_sign_in)
        delete_account(
            caller,
            NOW,
            InMemoryUserRepository(firebase),
            InMemoryAuthGateway(firebase),
            InMemoryFriendsEraser(firebase),
        )

    def test_deletes_the_firestore_data_first_and_then_the_auth_user(self, firebase):
        firebase.private[(RUNNER.uid, "preferences")] = {"units": "metric"}
        firebase.private[(ADMIN.uid, "preferences")] = {"units": "imperial"}

        self.delete(firebase, RUNNER)

        # Data first: if the auth deletion fails the user can still sign in and retry.
        assert firebase.calls == [("data", RUNNER.uid), ("auth", RUNNER.uid)]
        assert RUNNER.uid not in firebase.users
        assert RUNNER.uid not in firebase.claims
        assert list(firebase.private) == [(ADMIN.uid, "preferences")]

    def test_keeps_the_auth_user_when_the_data_deletion_fails(self, firebase):
        firebase.failing.add("delete_user_data")

        with pytest.raises(RuntimeError, match="delete_user_data failed"):
            self.delete(firebase, RUNNER)

        assert RUNNER.uid in firebase.claims

    def test_is_idempotent_when_the_auth_user_is_already_gone(self, firebase):
        del firebase.claims[RUNNER.uid]

        self.delete(firebase, RUNNER)

        assert RUNNER.uid not in firebase.users

    def test_propagates_other_auth_errors(self, firebase):
        firebase.failing.add("delete_user")

        with pytest.raises(RuntimeError, match="delete_user failed"):
            self.delete(firebase, RUNNER)

    def test_refuses_to_delete_the_only_remaining_admin_and_touches_nothing(self, firebase):
        with pytest.raises(DomainError) as error:
            self.delete(firebase, ADMIN)

        assert error.value.reason == "last-admin"
        assert firebase.calls == []
        assert ADMIN.uid in firebase.users

    def test_an_admin_can_leave_when_another_admin_remains(self, firebase):
        firebase.add_user("admin-2", ADMIN_CLAIMS)

        self.delete(firebase, ADMIN)

        assert ADMIN.uid not in firebase.users

    def test_the_admin_check_uses_the_claims_stored_in_auth(self, firebase):
        # The token says runner, but the account was promoted since it was issued.
        firebase.claims[RUNNER.uid] = ADMIN_CLAIMS
        firebase.users.pop(ADMIN.uid)

        with pytest.raises(DomainError) as error:
            self.delete(firebase, RUNNER)

        assert error.value.reason == "last-admin"

    def test_fails_closed_when_the_admin_has_no_mirror(self, firebase):
        del firebase.users[ADMIN.uid]

        with pytest.raises(DomainError) as error:
            self.delete(firebase, ADMIN)

        assert error.value.reason == "last-admin"

    def test_requires_a_recent_sign_in(self, firebase):
        with pytest.raises(DomainError) as error:
            self.delete(firebase, RUNNER, seconds_since_sign_in=RECENT_SIGN_IN_MAX_AGE_SEC + 1)

        assert error.value.reason == "recent-sign-in-required"
        assert firebase.calls == []


class TestDeleteAccountEndpoint:
    def test_anonymous_callers_are_unauthenticated(self, client, firebase):
        assert client.delete(URL).status_code == 401
        assert firebase.calls == []

    def test_deletes_the_account_of_the_token_owner_only(self, client, firebase):
        firebase.private[(RUNNER.uid, "sportProfile")] = {"level": "advanced"}
        others = set(firebase.users) - {RUNNER.uid}

        response = client.delete(URL, **bearer("runner-token"))

        assert response.status_code == 204
        assert set(firebase.users) == others
        assert firebase.private == {}
        assert RUNNER.uid not in firebase.claims
        assert set(firebase.claims) >= others

    def test_a_sign_in_older_than_five_minutes_is_rejected(self, client, firebase, monkeypatch):
        monkeypatch.setattr(FakeTokenVerifier, "seconds_since_sign_in", 301)

        response = client.delete(URL, **bearer("runner-token"))

        assert response.status_code == 400
        assert response.json()["error"]["reason"] == "recent-sign-in-required"
        assert RUNNER.uid in firebase.users

    def test_the_last_admin_cannot_delete_the_account(self, client, firebase):
        response = client.delete(URL, **bearer("admin-token"))

        assert response.status_code == 400
        assert response.json()["error"]["reason"] == "last-admin"
        assert ADMIN.uid in firebase.users
        assert ADMIN.uid in firebase.claims

    def test_a_uid_in_the_request_is_ignored(self, client, firebase):
        response = client.delete(f"{URL}?uid={ADMIN.uid}", **bearer("runner-token"))

        assert response.status_code == 204
        assert ADMIN.uid in firebase.users
        assert RUNNER.uid not in firebase.users
