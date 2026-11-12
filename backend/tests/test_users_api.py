import pytest

from tests.conftest import bearer
from tests.fakes import ADMIN, NEW_USER, RUNNER, USER_READER

USERS = "/api/v1/users"
ME = "/api/v1/users/me"
SIGN_UP = {
    "firstName": "Ana",
    "lastName": "Paz",
    "birthDate": "1990-01-01",
    "cityId": "loja",
    "consent": {"lopdp": True},
}


def error_of(response) -> dict:
    return response.json()["error"]


class TestRegister:
    def test_anonymous_callers_are_unauthenticated(self, client):
        assert client.post(USERS, SIGN_UP, format="json").status_code == 401

    def test_creates_the_profile_of_the_token_owner(self, client, firebase):
        body = {**SIGN_UP, "idNumber": "1104567890"}

        response = client.post(USERS, body, format="json", **bearer("new-user-token"))

        assert response.status_code == 201
        assert response.json() == {
            "uid": NEW_USER.uid,
            "email": NEW_USER.email,
            "firstName": "Ana",
            "lastName": "Paz",
            "birthDate": "1990-01-01",
            "cityId": "loja",
            "idNumber": "1104567890",
            "role": "runner",
        }
        assert firebase.users[NEW_USER.uid] == {
            "uid": NEW_USER.uid,
            "email": NEW_USER.email,
            "firstName": "Ana",
            "lastName": "Paz",
            "birthDate": "1990-01-01",
            "cityId": "loja",
            "idNumber": "1104567890",
            "consent": {"lopdp": True},
            "role": "runner",
        }

    def test_assigns_the_runner_claims_before_mirroring_the_role(self, client, firebase):
        client.post(USERS, SIGN_UP, format="json", **bearer("new-user-token"))

        assert firebase.claims[NEW_USER.uid] == {"role": "runner", "perms": []}
        assert firebase.calls == [("claims", NEW_USER.uid), ("mirror", NEW_USER.uid, "runner")]

    @pytest.mark.parametrize("field", ["uid", "email", "role", "createdAt"])
    def test_identity_and_role_cannot_come_from_the_body(self, client, firebase, field):
        body = {**SIGN_UP, field: "admin"}

        response = client.post(USERS, body, format="json", **bearer("new-user-token"))

        assert response.status_code == 400
        assert error_of(response)["fields"] == {field: "unknown"}
        assert NEW_USER.uid not in firebase.users

    def test_reports_invalid_values_per_field(self, client, firebase):
        body = {**SIGN_UP, "birthDate": "1990-02-30", "firstName": " ", "consent": {"lopdp": False}}

        response = client.post(USERS, body, format="json", **bearer("new-user-token"))

        assert response.status_code == 400
        assert error_of(response) == {
            "reason": "invalid-argument",
            "message": "The request is invalid.",
            "fields": {
                "firstName": "required",
                "birthDate": "invalid-date",
                "consent.lopdp": "not-accepted",
            },
        }
        assert NEW_USER.uid not in firebase.users
        assert firebase.claims[NEW_USER.uid] is None

    def test_consent_is_required(self, client):
        body = {key: value for key, value in SIGN_UP.items() if key != "consent"}

        response = client.post(USERS, body, format="json", **bearer("new-user-token"))

        assert error_of(response)["fields"] == {"consent": "required"}

    def test_an_existing_profile_is_a_conflict_and_is_left_untouched(self, client, firebase):
        before = dict(firebase.users[RUNNER.uid])

        response = client.post(USERS, SIGN_UP, format="json", **bearer("runner-token"))

        assert response.status_code == 409
        assert error_of(response)["reason"] == "profile-exists"
        assert firebase.users[RUNNER.uid] == before
        assert firebase.calls == []

    def test_a_retried_sign_up_completes_the_role_step(self, client, firebase):
        # The first attempt created the profile and failed before assigning the role.
        firebase.users[NEW_USER.uid] = {"uid": NEW_USER.uid, "firstName": "Ana"}

        response = client.post(USERS, SIGN_UP, format="json", **bearer("new-user-token"))

        assert response.status_code == 409
        assert firebase.claims[NEW_USER.uid] == {"role": "runner", "perms": []}
        assert firebase.users[NEW_USER.uid] == {
            "uid": NEW_USER.uid,
            "firstName": "Ana",
            "role": "runner",
        }

    def test_an_account_that_already_has_a_role_keeps_it(self, client, firebase):
        del firebase.users[ADMIN.uid]

        response = client.post(USERS, SIGN_UP, format="json", **bearer("admin-token"))

        assert response.status_code == 201
        assert response.json()["role"] == "admin"
        assert firebase.claims[ADMIN.uid]["role"] == "admin"
        assert firebase.calls == [("mirror", ADMIN.uid, "admin")]

    def test_the_token_must_carry_an_email(self, client, firebase):
        del firebase.users[USER_READER.uid]

        response = client.post(USERS, SIGN_UP, format="json", **bearer("user-reader-token"))

        assert response.status_code == 400
        assert error_of(response)["reason"] == "email-required"


class TestGetOwnProfile:
    def test_anonymous_callers_are_unauthenticated(self, client):
        assert client.get(ME).status_code == 401

    def test_returns_the_profile_of_the_token_owner(self, client, firebase):
        firebase.users[RUNNER.uid]["idNumber"] = "1104567890"

        response = client.get(ME, **bearer("runner-token"))

        assert response.status_code == 200
        assert response.json() == {
            "uid": RUNNER.uid,
            "email": RUNNER.email,
            "firstName": "Test",
            "lastName": "User",
            "birthDate": "1990-01-01",
            "cityId": "loja",
            "idNumber": "1104567890",
            "role": "runner",
        }

    def test_an_account_without_a_profile_is_not_found(self, client):
        response = client.get(ME, **bearer("new-user-token"))

        assert response.status_code == 404
        assert error_of(response)["reason"] == "profile-not-found"


class TestUpdateOwnProfile:
    def test_anonymous_callers_are_unauthenticated(self, client):
        assert client.patch(ME, {"firstName": "X"}, format="json").status_code == 401

    def test_changes_only_the_given_personal_data(self, client, firebase):
        others = {uid: dict(doc) for uid, doc in firebase.users.items() if uid != RUNNER.uid}
        body = {"firstName": " María ", "idNumber": "1104567890"}

        response = client.patch(ME, body, format="json", **bearer("runner-token"))

        assert response.status_code == 200
        assert response.json()["firstName"] == "María"
        assert response.json()["idNumber"] == "1104567890"
        assert firebase.users[RUNNER.uid] == {
            "uid": RUNNER.uid,
            "email": RUNNER.email,
            "firstName": "María",
            "lastName": "User",
            "birthDate": "1990-01-01",
            "cityId": "loja",
            "idNumber": "1104567890",
            "role": "runner",
        }
        assert {uid: doc for uid, doc in firebase.users.items() if uid != RUNNER.uid} == others

    @pytest.mark.parametrize("empty", ["", None])
    def test_an_empty_id_number_removes_it(self, client, firebase, empty):
        firebase.users[RUNNER.uid]["idNumber"] = "1104567890"

        response = client.patch(ME, {"idNumber": empty}, format="json", **bearer("runner-token"))

        assert response.json()["idNumber"] is None
        assert "idNumber" not in firebase.users[RUNNER.uid]

    @pytest.mark.parametrize("field", ["uid", "email", "role", "consent", "createdAt"])
    def test_immutable_fields_are_rejected(self, client, firebase, field):
        response = client.patch(ME, {field: "admin"}, format="json", **bearer("runner-token"))

        assert response.status_code == 400
        assert error_of(response)["fields"] == {field: "unknown"}
        assert firebase.users[RUNNER.uid]["role"] == "runner"

    def test_rejects_a_date_that_does_not_exist(self, client, firebase):
        response = client.patch(
            ME, {"birthDate": "1990-02-30"}, format="json", **bearer("runner-token")
        )

        assert response.status_code == 400
        assert error_of(response)["fields"] == {"birthDate": "invalid-date"}
        assert firebase.users[RUNNER.uid]["birthDate"] == "1990-01-01"

    def test_an_account_without_a_profile_is_not_found(self, client):
        response = client.patch(ME, {"firstName": "X"}, format="json", **bearer("new-user-token"))

        assert response.status_code == 404
        assert error_of(response)["reason"] == "profile-not-found"
