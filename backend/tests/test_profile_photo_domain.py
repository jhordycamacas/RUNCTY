import base64
from dataclasses import replace

import pytest

from apps.shared.domain.errors import DomainError, ErrorKind
from apps.users.domain.profile_photo import ProfilePhoto
from tests.fakes import SETTINGS

JPEG = b"\xff\xd8\xff\xe0" + b"\x00" * 60
PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 60
WEBP = b"RIFF\x24\x00\x00\x00WEBP" + b"\x00" * 60


def data_url(content: bytes, mime: str = "image/jpeg") -> str:
    return f"data:{mime};base64,{base64.b64encode(content).decode()}"


def reason_of(raw: object, settings=SETTINGS) -> str:
    with pytest.raises(DomainError) as error:
        ProfilePhoto.parse(raw, settings)
    assert error.value.kind is ErrorKind.INVALID_ARGUMENT
    assert list(error.value.fields) == ["photo"]
    return error.value.fields["photo"]


class TestParse:
    @pytest.mark.parametrize(
        ("content", "mime"),
        [(JPEG, "image/jpeg"), (PNG, "image/png"), (WEBP, "image/webp")],
    )
    def test_accepts_each_supported_image(self, content, mime):
        raw = data_url(content, mime)

        photo = ProfilePhoto.parse(raw, SETTINGS)

        assert (photo.data, photo.mime) == (raw, mime)

    @pytest.mark.parametrize("raw", [None, ""])
    def test_a_missing_photo_is_required(self, raw):
        assert reason_of(raw) == "required"

    @pytest.mark.parametrize(
        "raw",
        [
            123,
            ["x"],
            {"a": 1},
            "plain text",
            "data:image/gif;base64," + base64.b64encode(b"GIF89a").decode(),
            "data:text/html;base64," + base64.b64encode(b"<b>").decode(),
            "data:image/jpeg;charset=utf-8;base64,AAAA",
            "data:image/jpeg,AAAA",
            "https://example.com/a.jpg",
            "DATA:image/jpeg;base64,AAAA",
        ],
    )
    def test_anything_but_an_allowed_data_url_is_an_invalid_format(self, raw):
        assert reason_of(raw) == "invalid-format"

    @pytest.mark.parametrize(
        "raw",
        [
            "data:image/jpeg;base64,not base64 !!",
            "data:image/jpeg;base64,/9j/4A=",
            "data:image/jpeg;base64,",
            "data:image/jpeg;base64," + base64.b64encode(JPEG).decode() + "\n",
        ],
    )
    def test_bad_base64_is_an_invalid_image(self, raw):
        assert reason_of(raw) == "invalid-image"

    @pytest.mark.parametrize(
        ("content", "mime"),
        [
            (PNG, "image/jpeg"),
            (JPEG, "image/png"),
            (JPEG, "image/webp"),
            (b"RIFF\x24\x00\x00\x00WAVE" + b"\x00" * 60, "image/webp"),
            (b"<html>not an image</html>", "image/png"),
            (b"\xff\xd8", "image/jpeg"),
        ],
    )
    def test_the_bytes_must_match_the_declared_mime(self, content, mime):
        assert reason_of(data_url(content, mime)) == "invalid-image"

    def test_the_limit_is_in_decoded_bytes(self):
        at_limit = JPEG + b"\x00" * (SETTINGS.profile_photo_max_kb * 1024 - len(JPEG))

        assert ProfilePhoto.parse(data_url(at_limit), SETTINGS).mime == "image/jpeg"
        assert reason_of(data_url(at_limit + b"\x00")) == "too-large"

    def test_follows_the_configured_limit(self):
        content = JPEG + b"\x00" * (30 * 1024)
        small = replace(SETTINGS, profile_photo_max_kb=20)
        large = replace(SETTINGS, profile_photo_max_kb=500)

        assert reason_of(data_url(content), small) == "too-large"
        assert ProfilePhoto.parse(data_url(content), large).mime == "image/jpeg"

    def test_a_huge_payload_is_refused_before_decoding(self, monkeypatch):
        def fail(*args, **kwargs):
            raise AssertionError("decoded a payload that is over the limit")

        monkeypatch.setattr(base64, "b64decode", fail)

        assert reason_of("data:image/jpeg;base64," + "A" * 5_000_000) == "too-large"
        assert reason_of("x" * 5_000_000) == "too-large"


class TestDocument:
    def test_round_trips(self):
        photo = ProfilePhoto.parse(data_url(PNG, "image/png"), SETTINGS)

        assert photo.to_document() == {"data": photo.data, "mime": "image/png"}
        assert ProfilePhoto.from_document(photo.to_document()) == photo

    @pytest.mark.parametrize(
        "document", [{}, {"data": 3, "mime": "image/png"}, {"data": "x", "mime": 3}, {"mime": "a"}]
    )
    def test_a_stored_document_that_does_not_match_is_no_photo(self, document):
        assert ProfilePhoto.from_document(document) is None

    def test_a_lowered_limit_does_not_hide_a_stored_photo(self):
        big = ProfilePhoto.parse(
            data_url(JPEG + b"\x00" * 50_000), replace(SETTINGS, profile_photo_max_kb=100)
        )

        assert ProfilePhoto.from_document(big.to_document()) == big
