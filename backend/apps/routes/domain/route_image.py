"""Custom image of a route, set by a manager (RF-05).

The full image lives in `routes/{id}/private/image` as a data URL; a small thumbnail of it is
stored inside the route document (`imageThumb`) so the list and the detail carry it. Nothing is
stored in Cloud Storage (no billing on the project), like the profile photo.

`parse` validates client input and raises an `invalid-argument` domain error whose fields hold the
reason per field (`image`, `thumbnail`).
"""

import base64
import binascii
import re
from collections.abc import Mapping
from dataclasses import dataclass

from apps.shared.domain.errors import invalid_fields

# Decoded sizes. The full image stays well under Firestore's 1 MiB document limit (600 KB is
# about 800 KB of base64); the thumbnail is copied into every route of the list.
MAX_IMAGE_KB = 600
MAX_THUMBNAIL_KB = 60

_HEADER = re.compile(r"data:(image/(?:jpeg|png|webp));base64")
_MAX_HEADER_LENGTH = len("data:image/jpeg;base64,")


def _is_webp(content: bytes) -> bool:
    return content[:4] == b"RIFF" and content[8:12] == b"WEBP"


# Magic bytes by mime: the declared type must match the content.
_SIGNATURES = {
    "image/jpeg": lambda content: content.startswith(b"\xff\xd8\xff"),
    "image/png": lambda content: content.startswith(b"\x89PNG\r\n\x1a\n"),
    "image/webp": _is_webp,
}


def _reason(raw: object, max_kb: int) -> str | None:
    """Why `raw` is not a valid image data URL, or None."""
    if raw is None or raw == "":
        return "required"
    if not isinstance(raw, str):
        return "invalid-format"
    # Length first (4 characters per 3 bytes): an oversized payload is never decoded.
    if len(raw) > _MAX_HEADER_LENGTH + 4 * -(-max_kb * 1024 // 3):
        return "too-large"
    header, separator, payload = raw.partition(",")
    match = _HEADER.fullmatch(header)
    if not separator or match is None:
        return "invalid-format"
    try:
        content = base64.b64decode(payload, validate=True)
    except (binascii.Error, ValueError):
        return "invalid-image"
    if len(content) > max_kb * 1024:
        return "too-large"
    return None if _SIGNATURES[match.group(1)](content) else "invalid-image"


@dataclass(frozen=True, slots=True)
class RouteImage:
    """Document `routes/{id}/private/image` (the data URL and its mime type) plus its thumbnail,
    which is stored in the route document."""

    data: str
    mime: str
    thumbnail: str

    @classmethod
    def parse(cls, raw: object) -> "RouteImage":
        """`raw` holds the `image` and `thumbnail` data URLs sent by the client."""
        body = raw if isinstance(raw, Mapping) else {}
        image, thumbnail = body.get("image"), body.get("thumbnail")
        reasons = {
            field: reason
            for field, value, max_kb in (
                ("image", image, MAX_IMAGE_KB),
                ("thumbnail", thumbnail, MAX_THUMBNAIL_KB),
            )
            if (reason := _reason(value, max_kb))
        }
        if reasons:
            raise invalid_fields(reasons)
        mime = _HEADER.fullmatch(image.partition(",")[0]).group(1)
        return cls(data=image, mime=mime, thumbnail=thumbnail)

    def to_document(self) -> dict[str, str]:
        """The private document; the thumbnail goes to the route document."""
        return {"data": self.data, "mime": self.mime}
