"""RF-01: an admin with `users.manage` edits and deletes other accounts."""

from datetime import date

import pytest
from rest_framework.throttling import SimpleRateThrottle

from apps.roles.domain.system_roles import SYSTEM_ROLES
from apps.shared.domain.errors import DomainError
from apps.shared.domain.permissions import ALL_PERMISSIONS
from apps.users.application.use_cases import (
    clear_user_sport_profile,
    delete_user_account,
    save_user_sport_profile,
    update_user_personal_data,
)
from tests.conftest import bearer
from tests.fakes import (
    ADMIN,
    SETTINGS,
    USER_MANAGER,
    InMemoryAuthGateway,
    InMemoryCatalogRepository,
    InMemorySportProfileRepository,
    InMemoryUserRepository,
)
from tests.test_user_detail import ANA, ANA_SERIALIZED, SPORT_PROFILE

TODAY = date(2026, 11, 22)
USER_URL = "/api/v1/users/ana-1"
SPORT_URL = "/api/v1/users/ana-1/sport-profile"
TOKEN = "user-manager-token"
RUNNER_CLAIMS = {"role": "runner", "perms": []}
ADMIN_CLAIMS = {"role": "admin", "perms": []}


@pytest.fixture
def ana(firebase) -> None:
    firebase.add_user("ana-1", RUNNER_CLAIMS, **{k: v for k, v in ANA.items() if k != "uid"})


class TestPermission:
    def test_users_manage_is_in_the_catalogue(self):
        assert "users.manage" in ALL_PERMISSIONS

    def test_the_admin_system_role_holds_it(self):
        admin = next(role for role in SYSTEM_ROLES if role.id == "admin")

        assert "users.manage" in admin.permissions

    def test_the_runner_system_role_does_not(self):
        runner = next(role for role in SYSTEM_ROLES if role.id == "runner")

        assert "users.manage" not in runner.permissions


class TestUpdateUserPersonalData:
    def update(self, firebase, uid, changes):
        return update_user_personal_data(uid, changes, TODAY, InMemoryUserRepository(firebase))

    def test_changes_only_the_given_fields(self, firebase, ana):
        user = self.update(firebase, "ana-1", {"firstName": " Anita "})

        assert user.first_name == "Anita"
        assert user.last_name == "Paz"
        assert firebase.users["ana-1"]["firstName"] == "Anita"
        assert firebase.users["ana-1"]["email"] == "ana@runcty.dev"

    def test_uses_the_rules_of_the_own_update(self, firebase, ana):
        with pytest.raises(DomainError) as error:
            self.update(firebase, "ana-1", {"birthDate": "2026-13-45", "idNumber": "12"})

        assert error.value.fields == {"birthDate": "invalid-date", "idNumber": "invalid-format"}
        assert firebase.users["ana-1"]["birthDate"] == "1990-01-01"

    def test_an_empty_id_number_removes_it(self, firebase, ana):
        self.update(firebase, "ana-1", {"idNumber": ""})

        assert "idNumber" not in firebase.users["ana-1"]

    def test_an_unknown_account_is_not_found(self, firebase):
        with pytest.raises(DomainError) as error:
            self.update(firebase, "ghost", {"firstName": "X"})

        assert error.value.reason == "user-not-found"

    def test_no_changes_is_invalid(self, firebase, ana):
        with pytest.raises(DomainError) as error:
            self.update(firebase, "ana-1", {})

        assert error.value.reason == "invalid-argument"


class TestSportProfileUseCases:
    def save(self, firebase, uid, data):
        return save_user_sport_profile(
            uid,
            data,
            InMemoryUserRepository(firebase),
            InMemorySportProfileRepository(firebase),
            InMemoryCatalogRepository(firebase),
            SETTINGS,
        )

    def test_saves_a_valid_profile(self, firebase, ana):
        profile = self.save(firebase, "ana-1", SPORT_PROFILE)

        assert profile.level == "intermediate"
        assert firebase.private[("ana-1", "sportProfile")] == SPORT_PROFILE

    def test_applies_the_catalogs_and_the_ranges(self, firebase, ana):
        data = {**SPORT_PROFILE, "level": "wizard", "usualPaceSecPerKm": 5.0}

        with pytest.raises(DomainError) as error:
            self.save(firebase, "ana-1", data)

        assert error.value.fields == {
            "level": "invalid-choice",
            "usualPaceSecPerKm": "out-of-range",
        }
        assert ("ana-1", "sportProfile") not in firebase.private

    def test_an_unknown_account_is_not_found_and_nothing_is_written(self, firebase):
        with pytest.raises(DomainError) as error:
            self.save(firebase, "ghost", SPORT_PROFILE)

        assert error.value.reason == "user-not-found"
        assert firebase.private == {}

    def test_clears_the_profile_and_is_idempotent(self, firebase, ana):
        firebase.private[("ana-1", "sportProfile")] = SPORT_PROFILE
        users, profiles = InMemoryUserRepository(firebase), InMemorySportProfileRepository(firebase)

        clear_user_sport_profile("ana-1", users, profiles)
        clear_user_sport_profile("ana-1", users, profiles)

        assert ("ana-1", "sportProfile") not in firebase.private

    def test_clearing_an_unknown_account_is_not_found(self, firebase):
        with pytest.raises(DomainError) as error:
            clear_user_sport_profile(
                "ghost", InMemoryUserRepository(firebase), InMemorySportProfileRepository(firebase)
            )

        assert error.value.reason == "user-not-found"


class TestDeleteUserAccount:
    def delete(self, firebase, caller, uid):
        delete_user_account(
            caller, uid, InMemoryUserRepository(firebase), InMemoryAuthGateway(firebase)
        )

    def test_deletes_the_profile_the_private_documents_and_the_credentials(self, firebase, ana):
        firebase.private[("ana-1", "sportProfile")] = SPORT_PROFILE
        firebase.private[("ana-1", "photo")] = {"data": "data:image/png;base64,AAAA"}
        firebase.private[("admin-1", "preferences")] = {"units": "metric"}

        self.delete(firebase, USER_MANAGER, "ana-1")

        assert firebase.calls == [("data", "ana-1"), ("auth", "ana-1")]
        assert "ana-1" not in firebase.users
        assert "ana-1" not in firebase.claims
        assert list(firebase.private) == [("admin-1", "preferences")]

    def test_refuses_deleting_yourself_and_touches_nothing(self, firebase):
        with pytest.raises(DomainError) as error:
            self.delete(firebase, ADMIN, ADMIN.uid)

        assert error.value.reason == "cannot-delete-self"
        assert firebase.calls == []
        assert ADMIN.uid in firebase.users

    def test_refuses_deleting_the_last_admin(self, firebase):
        with pytest.raises(DomainError) as error:
            self.delete(firebase, USER_MANAGER, ADMIN.uid)

        assert error.value.reason == "last-admin"
        assert firebase.calls == []
        assert ADMIN.uid in firebase.users

    def test_an_admin_can_be_deleted_when_another_remains(self, firebase):
        firebase.add_user("admin-2", ADMIN_CLAIMS, email="a2@example.com")

        self.delete(firebase, USER_MANAGER, ADMIN.uid)

        assert ADMIN.uid not in firebase.users

    def test_an_unknown_account_is_not_found(self, firebase):
        with pytest.raises(DomainError) as error:
            self.delete(firebase, USER_MANAGER, "ghost")

        assert error.value.reason == "user-not-found"
        assert firebase.calls == []

    def test_keeps_the_auth_user_when_the_data_deletion_fails(self, firebase, ana):
        firebase.failing.add("delete_user_data")

        with pytest.raises(RuntimeError):
            self.delete(firebase, USER_MANAGER, "ana-1")

        assert "ana-1" in firebase.claims


ENDPOINTS = [
    ("patch", USER_URL, {"firstName": "Anita"}),
    ("put", SPORT_URL, SPORT_PROFILE),
    ("delete", SPORT_URL, None),
    ("delete", USER_URL, None),
]


def call(client, method, url, body, token=None):
    headers = bearer(token) if token else {}
    if body is None:
        return getattr(client, method)(url, **headers)
    return getattr(client, method)(url, body, format="json", **headers)


class TestAccessControl:
    @pytest.mark.parametrize(("method", "url", "body"), ENDPOINTS)
    def test_anonymous_callers_are_unauthenticated(self, client, ana, method, url, body):
        assert call(client, method, url, body).status_code == 401

    @pytest.mark.parametrize(("method", "url", "body"), ENDPOINTS)
    @pytest.mark.parametrize("token", ["runner-token", "club-rep-token", "user-reader-token"])
    def test_requires_users_manage(self, client, firebase, ana, method, url, body, token):
        before = (dict(firebase.users), dict(firebase.private), dict(firebase.claims))

        response = call(client, method, url, body, token)

        assert response.status_code == 403
        assert response.json()["error"]["reason"] == "missing-permission"
        assert (dict(firebase.users), dict(firebase.private), dict(firebase.claims)) == before

    @pytest.mark.parametrize(("method", "url", "body"), ENDPOINTS)
    def test_has_the_sensitive_rate_limit(self, client, ana, monkeypatch, method, url, body):
        monkeypatch.setitem(SimpleRateThrottle.THROTTLE_RATES, "sensitive", "1/min")

        assert call(client, method, url, body, TOKEN).status_code != 429
        assert call(client, method, url, body, TOKEN).status_code == 429


class TestPatchUser:
    def test_edits_the_given_fields_and_returns_the_user(self, client, firebase, ana):
        response = call(client, "patch", USER_URL, {"firstName": "Anita", "cityId": "quito"}, TOKEN)

        assert response.status_code == 200
        assert response.json() == {
            "user": {**ANA_SERIALIZED, "firstName": "Anita", "cityId": "quito"}
        }
        assert firebase.users["ana-1"]["lastName"] == "Paz"

    def test_an_admin_token_can_edit_too(self, client, ana):
        assert (
            call(client, "patch", USER_URL, {"lastName": "Gil"}, "admin-token").status_code == 200
        )

    def test_the_email_is_not_editable(self, client, firebase, ana):
        response = call(client, "patch", USER_URL, {"email": "other@x.com"}, TOKEN)

        assert response.status_code == 400
        assert response.json()["error"]["fields"] == {"email": "unknown"}
        assert firebase.users["ana-1"]["email"] == "ana@runcty.dev"

    def test_unknown_keys_are_rejected(self, client, ana):
        response = call(client, "patch", USER_URL, {"firstName": "A", "role": "admin"}, TOKEN)

        assert response.status_code == 400
        assert response.json()["error"]["fields"] == {"role": "unknown"}

    def test_the_values_follow_the_rules_of_the_own_update(self, client, firebase, ana):
        response = call(client, "patch", USER_URL, {"firstName": " ", "idNumber": "12"}, TOKEN)

        assert response.status_code == 400
        assert response.json()["error"]["reason"] == "invalid-argument"
        assert response.json()["error"]["fields"] == {
            "firstName": "required",
            "idNumber": "invalid-format",
        }
        assert firebase.users["ana-1"]["firstName"] == "Ana"

    def test_an_empty_body_is_invalid(self, client, ana):
        response = call(client, "patch", USER_URL, {}, TOKEN)

        assert response.status_code == 400
        assert response.json()["error"]["reason"] == "invalid-argument"

    def test_an_unknown_account_is_not_found(self, client):
        response = call(client, "patch", "/api/v1/users/ghost", {"firstName": "A"}, TOKEN)

        assert response.status_code == 404
        assert response.json()["error"]["reason"] == "user-not-found"

    def test_me_is_still_the_own_profile(self, client, firebase):
        response = call(client, "patch", "/api/v1/users/me", {"firstName": "Yo"}, "runner-token")

        assert response.status_code == 200
        assert response.json()["firstName"] == "Yo"


class TestPutUserSportProfile:
    def test_saves_the_profile(self, client, firebase, ana):
        response = call(client, "put", SPORT_URL, SPORT_PROFILE, TOKEN)

        assert response.status_code == 200
        assert response.json() == {"sportProfile": SPORT_PROFILE}
        assert firebase.private[("ana-1", "sportProfile")] == SPORT_PROFILE

    def test_follows_the_catalogs_and_the_settings(self, client, firebase, ana):
        body = {**SPORT_PROFILE, "level": "wizard", "preferredDistanceKm": 9999.0}

        response = call(client, "put", SPORT_URL, body, TOKEN)

        assert response.status_code == 400
        assert response.json()["error"]["fields"] == {
            "level": "invalid-choice",
            "preferredDistanceKm": "out-of-range",
        }
        assert ("ana-1", "sportProfile") not in firebase.private

    def test_unknown_keys_are_rejected(self, client, ana):
        response = call(client, "put", SPORT_URL, {**SPORT_PROFILE, "x": 1}, TOKEN)

        assert response.status_code == 400
        assert response.json()["error"]["fields"] == {"x": "unknown"}

    def test_an_unknown_account_is_not_found(self, client, firebase):
        response = call(client, "put", "/api/v1/users/ghost/sport-profile", SPORT_PROFILE, TOKEN)

        assert response.status_code == 404
        assert response.json()["error"]["reason"] == "user-not-found"
        assert firebase.private == {}


class TestDeleteUserSportProfile:
    def test_clears_it_and_is_idempotent(self, client, firebase, ana):
        firebase.private[("ana-1", "sportProfile")] = SPORT_PROFILE
        firebase.private[("ana-1", "preferences")] = {"units": "metric"}

        assert call(client, "delete", SPORT_URL, None, TOKEN).status_code == 204
        assert call(client, "delete", SPORT_URL, None, TOKEN).status_code == 204

        assert list(firebase.private) == [("ana-1", "preferences")]

    def test_an_unknown_account_is_not_found(self, client):
        response = call(client, "delete", "/api/v1/users/ghost/sport-profile", None, TOKEN)

        assert response.status_code == 404
        assert response.json()["error"]["reason"] == "user-not-found"


class TestDeleteUser:
    def test_deletes_the_account_and_only_that_account(self, client, firebase, ana):
        firebase.private[("ana-1", "sportProfile")] = SPORT_PROFILE
        firebase.private[("ana-1", "photo")] = {"data": "data:image/png;base64,AAAA"}
        others = set(firebase.users) - {"ana-1"}

        response = call(client, "delete", USER_URL, None, TOKEN)

        assert response.status_code == 204
        assert set(firebase.users) == others
        assert firebase.private == {}
        assert "ana-1" not in firebase.claims

    def test_an_admin_cannot_delete_themselves_here(self, client, firebase):
        response = call(client, "delete", f"/api/v1/users/{ADMIN.uid}", None, "admin-token")

        assert response.status_code == 409
        assert response.json()["error"]["reason"] == "cannot-delete-self"
        assert ADMIN.uid in firebase.users

    def test_the_last_admin_cannot_be_deleted(self, client, firebase):
        response = call(client, "delete", f"/api/v1/users/{ADMIN.uid}", None, TOKEN)

        assert response.status_code == 400
        assert response.json()["error"]["reason"] == "last-admin"
        assert ADMIN.uid in firebase.users
        assert ADMIN.uid in firebase.claims

    def test_an_unknown_account_is_not_found(self, client):
        response = call(client, "delete", "/api/v1/users/ghost", None, TOKEN)

        assert response.status_code == 404
        assert response.json()["error"]["reason"] == "user-not-found"

    def test_me_is_still_the_own_deletion(self, client, firebase):
        response = call(client, "delete", "/api/v1/users/me", None, "runner-token")

        assert response.status_code == 204
        assert "runner-1" not in firebase.users
