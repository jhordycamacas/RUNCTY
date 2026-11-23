"""Profile photo stored in `users/{uid}/private/photo` as a data URL (RF-01).

`parse` validates client input and raises an `invalid-argument` domain error whose `photo`
field holds the reason. `from_document` reads what is already stored and never raises.
"""

import base64
import binascii
import re
from collections.abc import Mapping
from dataclasses import dataclass

from apps.shared.domain.errors import invalid_fields
from apps.system_settings.domain.models import SystemSettings

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


def _max_data_url_length(max_kb: int) -> int:
    """Longest data URL whose payload can still decode to `max_kb` KB: 4 characters per 3 bytes."""
    return _MAX_HEADER_LENGTH + 4 * -(-max_kb * 1024 // 3)


def _reason(raw: object, settings: SystemSettings) -> str | None:
    if raw is None or raw == "":
        return "required"
    if not isinstance(raw, str):
        return "invalid-format"
    # Length first: an oversized payload is never decoded.
    if len(raw) > _max_data_url_length(settings.profile_photo_max_kb):
        return "too-large"
    header, separator, payload = raw.partition(",")
    match = _HEADER.fullmatch(header)
    if not separator or match is None:
        return "invalid-format"
    try:
        content = base64.b64decode(payload, validate=True)
    except (binascii.Error, ValueError):
        return "invalid-image"
    if len(content) > settings.profile_photo_max_kb * 1024:
        return "too-large"
    return None if _SIGNATURES[match.group(1)](content) else "invalid-image"


@dataclass(frozen=True, slots=True)
class ProfilePhoto:
    """Document `users/{uid}/private/photo`: the data URL and its mime type."""

    data: str
    mime: str

    @classmethod
    def parse(cls, raw: object, settings: SystemSettings) -> "ProfilePhoto":
        if reason := _reason(raw, settings):
            raise invalid_fields({"photo": reason})
        mime = _HEADER.fullmatch(raw.partition(",")[0]).group(1)
        return cls(data=raw, mime=mime)

    @classmethod
    def from_document(cls, data: Mapping[str, object]) -> "ProfilePhoto | None":
        stored, mime = data.get("data"), data.get("mime")
        return cls(stored, mime) if isinstance(stored, str) and isinstance(mime, str) else None

    def to_document(self) -> dict[str, str]:
        return {"data": self.data, "mime": self.mime}
