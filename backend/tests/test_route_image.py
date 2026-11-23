"""The custom image of a route: domain validation and `GET`/`PUT`/`DELETE /routes/{id}/image`."""

import base64

import pytest

from apps.cities.domain.models import Ciudad
from apps.routes.domain.route_image import MAX_IMAGE_KB, MAX_THUMBNAIL_KB, RouteImage
from apps.shared.domain.errors import DomainError, ErrorKind
from tests.conftest import bearer
from tests.test_routes_api import ROUTE, ROUTES

JPEG = b"\xff\xd8\xff\xe0" + b"\x00" * 60
PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 60
WEBP = b"RIFF\x24\x00\x00\x00WEBP" + b"\x00" * 60

ADMIN = bearer("admin-token")
RUNNER = bearer("runner-token")


def data_url(content: bytes, mime: str = "image/jpeg") -> str:
    return f"data:{mime};base64,{base64.b64encode(content).decode()}"


IMAGE = data_url(JPEG + b"\x01" * 100)
THUMB = data_url(JPEG)
BODY = {"image": IMAGE, "thumbnail": THUMB}


def reasons_of(raw: object) -> dict[str, str]:
    with pytest.raises(DomainError) as error:
        RouteImage.parse(raw)
    assert error.value.kind is ErrorKind.INVALID_ARGUMENT
    return dict(error.value.fields)


class TestParse:
    @pytest.mark.parametrize(
        ("content", "mime"),
        [(JPEG, "image/jpeg"), (PNG, "image/png"), (WEBP, "image/webp")],
    )
    def test_accepts_each_supported_image(self, content, mime):
        raw = data_url(content, mime)

        image = RouteImage.parse({"image": raw, "thumbnail": THUMB})

        assert (image.data, image.mime, image.thumbnail) == (raw, mime, THUMB)
        assert image.to_document() == {"data": raw, "mime": mime}

    @pytest.mark.parametrize("raw", [None, "", 12, [], {"image": IMAGE}, {"thumbnail": THUMB}])
    def test_both_images_are_required(self, raw):
        assert reasons_of(raw) in (
            {"image": "required", "thumbnail": "required"},
            {"image": "required"},
            {"thumbnail": "required"},
        )

    @pytest.mark.parametrize(
        ("value", "reason"),
        [
            (12, "invalid-format"),
            ("https://example.com/a.jpg", "invalid-format"),
            (data_url(b"GIF89a....", "image/gif"), "invalid-format"),
            ("data:image/jpeg;base64,%%%", "invalid-image"),
            (data_url(PNG, "image/jpeg"), "invalid-image"),
            (data_url(JPEG + b"\x00" * (MAX_IMAGE_KB * 1024)), "too-large"),
        ],
    )
    def test_rejects_an_invalid_image_under_its_field(self, value, reason):
        assert reasons_of({"image": value, "thumbnail": THUMB}) == {"image": reason}

    def test_the_thumbnail_has_its_own_smaller_limit(self):
        thumbnail = data_url(JPEG + b"\x00" * (MAX_THUMBNAIL_KB * 1024))

        assert reasons_of({"image": IMAGE, "thumbnail": thumbnail}) == {"thumbnail": "too-large"}
        assert RouteImage.parse({"image": thumbnail, "thumbnail": THUMB}).data == thumbnail

    def test_reports_both_fields_at_once(self):
        assert reasons_of({"image": "x", "thumbnail": 3}) == {
            "image": "invalid-format",
            "thumbnail": "invalid-format",
        }

    def test_the_largest_allowed_image_is_accepted(self):
        raw = data_url(JPEG + b"\x00" * (MAX_IMAGE_KB * 1024 - len(JPEG)))

        assert RouteImage.parse({"image": raw, "thumbnail": THUMB}).data == raw


@pytest.fixture(autouse=True)
def loja(firebase):
    firebase.cities["loja"] = Ciudad("loja", "Loja", "Loja", "city", -3.99, -79.2, "active")


@pytest.fixture
def route_id(client) -> str:
    response = client.post(ROUTES, ROUTE, format="json", **ADMIN)
    assert response.status_code == 201, response.content
    return response.json()["id"]


def put(client, route_id: str, body: dict = BODY, **auth):
    return client.put(f"{ROUTES}/{route_id}/image", body, format="json", **(auth or ADMIN))


class TestApi:
    def test_anonymous_callers_are_unauthenticated(self, client, route_id):
        assert client.get(f"{ROUTES}/{route_id}/image").status_code == 401

    def test_a_route_without_image_has_a_null_thumbnail_and_no_image(self, client, route_id):
        assert client.get(f"{ROUTES}/{route_id}", **RUNNER).json()["imageThumb"] is None
        response = client.get(f"{ROUTES}/{route_id}/image", **RUNNER)

        assert response.status_code == 404
        assert response.json()["error"]["reason"] == "route-image-not-found"

    def test_an_admin_sets_the_image_and_any_runner_reads_it(self, client, firebase, route_id):
        assert put(client, route_id).status_code == 204

        assert client.get(f"{ROUTES}/{route_id}/image", **RUNNER).json() == {"image": IMAGE}
        stored = firebase.docs[f"routes/{route_id}/private/image"]
        assert (stored["data"], stored["mime"]) == (IMAGE, "image/jpeg")
        assert firebase.docs[f"routes/{route_id}"]["imageThumb"] == THUMB

    def test_the_thumbnail_is_in_the_list_and_the_detail_but_not_the_full_image(
        self, client, route_id
    ):
        put(client, route_id)

        listed = client.get(ROUTES, **RUNNER).json()["routes"][0]
        detail = client.get(f"{ROUTES}/{route_id}", **RUNNER).json()

        assert listed["imageThumb"] == detail["imageThumb"] == THUMB
        assert IMAGE not in str(listed) and IMAGE not in str(detail)

    def test_a_runner_cannot_change_the_image(self, client, firebase, route_id):
        before = dict(firebase.docs)

        assert put(client, route_id, **RUNNER).status_code == 403
        assert client.delete(f"{ROUTES}/{route_id}/image", **RUNNER).status_code == 403
        assert firebase.docs == before

    def test_replacing_the_image_replaces_both_copies(self, client, firebase, route_id):
        put(client, route_id)
        png = data_url(PNG, "image/png")

        put(client, route_id, {"image": png, "thumbnail": png})

        assert firebase.docs[f"routes/{route_id}/private/image"]["mime"] == "image/png"
        assert firebase.docs[f"routes/{route_id}"]["imageThumb"] == png

    def test_updating_the_route_keeps_the_image(self, client, firebase, route_id):
        put(client, route_id)

        response = client.put(
            f"{ROUTES}/{route_id}", {**ROUTE, "name": "Renamed"}, format="json", **ADMIN
        )

        assert response.status_code == 204
        assert firebase.docs[f"routes/{route_id}"]["imageThumb"] == THUMB
        assert f"routes/{route_id}/private/image" in firebase.docs

    def test_removing_clears_both_copies_and_is_idempotent(self, client, firebase, route_id):
        put(client, route_id)

        assert client.delete(f"{ROUTES}/{route_id}/image", **ADMIN).status_code == 204
        assert client.delete(f"{ROUTES}/{route_id}/image", **ADMIN).status_code == 204

        assert f"routes/{route_id}/private/image" not in firebase.docs
        assert "imageThumb" not in firebase.docs[f"routes/{route_id}"]
        assert client.get(f"{ROUTES}/{route_id}", **RUNNER).json()["imageThumb"] is None

    def test_deleting_the_route_deletes_its_image(self, client, firebase, route_id):
        put(client, route_id)

        assert client.delete(f"{ROUTES}/{route_id}", **ADMIN).status_code == 204

        assert not [path for path in firebase.docs if path.startswith(f"routes/{route_id}")]

    def test_a_missing_route_has_no_image_to_set_or_remove(self, client, firebase):
        for response in (put(client, "ghost"), client.delete(f"{ROUTES}/ghost/image", **ADMIN)):
            assert response.status_code == 404
            assert response.json()["error"]["reason"] == "route-not-found"
        assert not [path for path in firebase.docs if path.startswith("routes/")]

    @pytest.mark.parametrize(
        ("body", "fields"),
        [
            ({}, {"image": "required", "thumbnail": "required"}),
            ({"image": IMAGE}, {"thumbnail": "required"}),
            (
                {"image": data_url(PNG, "image/jpeg"), "thumbnail": THUMB},
                {"image": "invalid-image"},
            ),
            (
                {"image": IMAGE, "thumbnail": data_url(JPEG + b"\x00" * (70 * 1024))},
                {"thumbnail": "too-large"},
            ),
            ({**BODY, "extra": 1}, {"extra": "unknown"}),
        ],
    )
    def test_rejects_invalid_bodies_without_writing(self, client, firebase, route_id, body, fields):
        before = dict(firebase.docs)

        response = put(client, route_id, body)

        assert response.status_code == 400
        assert response.json()["error"]["fields"] == fields
        assert firebase.docs == before

    def test_an_inactive_route_image_is_hidden_from_runners(self, client, firebase, route_id):
        put(client, route_id)
        firebase.docs[f"routes/{route_id}"]["active"] = False

        assert client.get(f"{ROUTES}/{route_id}/image", **RUNNER).status_code == 404
        assert client.get(f"{ROUTES}/{route_id}/image", **ADMIN).status_code == 200
