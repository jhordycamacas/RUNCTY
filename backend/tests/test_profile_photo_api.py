"""`GET`/`PUT`/`DELETE /api/v1/users/me/photo`: the caller's own photo, and nobody else's."""

import pytest

from tests.conftest import bearer
from tests.fakes import ADMIN, RUNNER
from tests.test_profile_photo_domain import JPEG, PNG, data_url

URL = "/api/v1/users/me/photo"
SETTINGS_URL = "/api/v1/settings"
PHOTO = data_url(JPEG)


def error_of(response) -> dict:
    return response.json()["error"]


class TestAuthentication:
    @pytest.mark.parametrize("method", ["get", "put", "delete"])
    def test_anonymous_callers_are_unauthenticated(self, client, firebase, method):
        response = getattr(client, method)(URL, {"photo": PHOTO}, format="json")

        assert response.status_code == 401
        assert firebase.private == {}

    @pytest.mark.parametrize("token", ["runner-token", "admin-token", "club-rep-token"])
    def test_any_signed_in_account_has_its_own_photo(self, client, token):
        assert client.put(URL, {"photo": PHOTO}, format="json", **bearer(token)).status_code == 200


class TestOwnPhoto:
    def test_a_runner_without_photo_gets_null(self, client):
        response = client.get(URL, **bearer("runner-token"))

        assert response.status_code == 200
        assert response.json() == {"photo": None}

    def test_saves_and_returns_the_photo(self, client, firebase):
        saved = client.put(URL, {"photo": PHOTO}, format="json", **bearer("runner-token"))

        assert saved.status_code == 200
        assert saved.json() == {"photo": PHOTO}
        assert firebase.private == {(RUNNER.uid, "photo"): {"data": PHOTO, "mime": "image/jpeg"}}
        assert client.get(URL, **bearer("runner-token")).json() == {"photo": PHOTO}

    def test_replaces_the_previous_photo(self, client, firebase):
        client.put(URL, {"photo": PHOTO}, format="json", **bearer("runner-token"))
        png = data_url(PNG, "image/png")

        client.put(URL, {"photo": png}, format="json", **bearer("runner-token"))

        assert firebase.private[(RUNNER.uid, "photo")] == {"data": png, "mime": "image/png"}

    def test_a_user_never_sees_the_photo_of_another(self, client, firebase):
        client.put(URL, {"photo": PHOTO}, format="json", **bearer("runner-token"))

        assert client.get(URL, **bearer("admin-token")).json() == {"photo": None}
        assert client.delete(URL, **bearer("admin-token")).status_code == 204
        assert list(firebase.private) == [(RUNNER.uid, "photo")]

    def test_deleting_is_idempotent(self, client, firebase):
        client.put(URL, {"photo": PHOTO}, format="json", **bearer("runner-token"))

        assert client.delete(URL, **bearer("runner-token")).status_code == 204
        assert client.delete(URL, **bearer("runner-token")).status_code == 204
        assert firebase.private == {}
        assert client.get(URL, **bearer("runner-token")).json() == {"photo": None}

    def test_there_is_no_endpoint_to_read_another_users_photo(self, client):
        response = client.get(f"/api/v1/users/{ADMIN.uid}/photo", **bearer("runner-token"))

        assert response.status_code == 404

    def test_deleting_the_account_removes_the_photo(self, client, firebase):
        client.put(URL, {"photo": PHOTO}, format="json", **bearer("runner-token"))

        assert client.delete("/api/v1/users/me", **bearer("runner-token")).status_code == 204
        assert firebase.private == {}


class TestRejections:
    @pytest.mark.parametrize(
        ("body", "reason"),
        [
            ({}, "required"),
            ({"photo": None}, "required"),
            ({"photo": ""}, "required"),
            ({"photo": 12}, "invalid-format"),
            ({"photo": "https://example.com/a.jpg"}, "invalid-format"),
            ({"photo": data_url(b"GIF89a....", "image/gif")}, "invalid-format"),
            ({"photo": "data:image/jpeg;base64,%%%"}, "invalid-image"),
            ({"photo": data_url(PNG, "image/jpeg")}, "invalid-image"),
            ({"photo": data_url(JPEG + b"\x00" * 200_000)}, "too-large"),
        ],
    )
    def test_an_invalid_photo_is_reported_under_its_field(self, client, firebase, body, reason):
        response = client.put(URL, body, format="json", **bearer("runner-token"))

        assert response.status_code == 400
        assert error_of(response)["fields"] == {"photo": reason}
        assert firebase.private == {}

    def test_unknown_fields_are_rejected(self, client, firebase):
        response = client.put(
            URL, {"photo": PHOTO, "uid": "admin-1"}, format="json", **bearer("runner-token")
        )

        assert response.status_code == 400
        assert error_of(response)["fields"] == {"uid": "unknown"}
        assert firebase.private == {}


class TestFollowsTheSettings:
    def test_changing_the_size_limit_changes_what_is_accepted(self, client):
        photo = data_url(JPEG + b"\x00" * (150 * 1024))
        admin = bearer("admin-token")

        rejected = client.put(URL, {"photo": photo}, format="json", **bearer("runner-token"))
        client.put(SETTINGS_URL, {"profilePhotoMaxKb": 200}, format="json", **admin)
        accepted = client.put(URL, {"photo": photo}, format="json", **bearer("runner-token"))
        client.put(SETTINGS_URL, {"profilePhotoMaxKb": 20}, format="json", **admin)
        rejected_again = client.put(URL, {"photo": photo}, format="json", **bearer("runner-token"))

        assert rejected.status_code == 400
        assert error_of(rejected)["fields"] == {"photo": "too-large"}
        assert accepted.status_code == 200
        assert rejected_again.status_code == 400

    def test_the_largest_allowed_photo_fits_in_a_request(self, client):
        client.put(SETTINGS_URL, {"profilePhotoMaxKb": 500}, format="json", **bearer("admin-token"))
        photo = data_url(JPEG + b"\x00" * (500 * 1024 - len(JPEG)))

        response = client.put(URL, {"photo": photo}, format="json", **bearer("runner-token"))

        assert response.status_code == 200
        assert response.json() == {"photo": photo}
