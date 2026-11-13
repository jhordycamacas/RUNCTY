"""Document `cities/{id}`: a city or one of its zones (RF-04).

`parse` and `with_changes` validate client input and raise an `invalid-argument` domain error
with the reason code of the broken field. `from_document` reads what is stored and never raises.
"""

import math
import re
from collections.abc import Mapping
from dataclasses import dataclass

from apps.shared.domain.errors import DomainError, ErrorKind

# Slug ids, like the admin panel generates them (e.g. `loja`, `loja-centro`).
_CITY_ID = re.compile(r"[a-z0-9][a-z0-9-]{1,63}")
_MAX_TEXT = 80

COVERAGES = ("active", "planned", "suspended")
CITY_TYPES = ("city", "zone")
COUNTRY = "EC"


def _invalid(reason: str, message: str) -> DomainError:
    return DomainError(ErrorKind.INVALID_ARGUMENT, reason, message)


def parse_city_id(value: object) -> str:
    if not isinstance(value, str) or not _CITY_ID.fullmatch(value):
        raise _invalid("invalid-city-id", "A valid city id is required.")
    return value


def parse_coverage(value: object) -> str:
    if not isinstance(value, str) or value not in COVERAGES:
        raise _invalid("invalid-coverage", "Coverage must be active, planned or suspended.")
    return value


def parse_parent_id(value: object) -> str:
    if not isinstance(value, str) or not _CITY_ID.fullmatch(value):
        raise _invalid("invalid-parent-city", "A zone needs the id of its parent city.")
    return value


def _text(value: object, reason: str, label: str) -> str:
    text = value.strip() if isinstance(value, str) else ""
    if not text or len(text) > _MAX_TEXT:
        raise _invalid(reason, f"{label} is required (max {_MAX_TEXT} chars).")
    return text


def _is_number(value: object) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def _location(value: object) -> tuple[float, float]:
    point = value if isinstance(value, Mapping) else {}
    lat, lng = point.get("lat"), point.get("lng")
    if not (_is_number(lat) and _is_number(lng) and -90 <= lat <= 90 and -180 <= lng <= 180):
        raise _invalid(
            "invalid-city-location", "Location needs a lat in -90..90 and lng in -180..180."
        )
    return lat, lng


def _stored_text(value: object, fallback: str) -> str:
    return value if isinstance(value, str) else fallback


def _stored_number(value: object) -> float:
    return value if _is_number(value) else 0


@dataclass(frozen=True, slots=True)
class Ciudad:
    """A city, or a zone that belongs to a city (one level, never to another zone)."""

    id: str
    name: str
    province: str
    type: str
    lat: float
    lng: float
    coverage: str
    parent_city_id: str | None = None

    @classmethod
    def parse(cls, raw: Mapping[str, object]) -> "Ciudad":
        """Validates client input. A parent city must also exist: see `use_cases`."""
        city_id = parse_city_id(raw.get("id"))
        name = _text(raw.get("name"), "invalid-city-name", "City name")
        province = _text(raw.get("province"), "invalid-city-province", "Province")

        city_type = raw.get("type")
        if not isinstance(city_type, str) or city_type not in CITY_TYPES:
            raise _invalid("invalid-city-type", "Type must be city or zone.")
        lat, lng = _location(raw.get("location"))
        coverage = parse_coverage(raw.get("coverage"))

        parent = raw.get("parentCityId")
        if city_type == "city" and parent is not None:
            raise _invalid("invalid-parent-city", "Only a zone has a parent city.")
        if city_type == "zone":
            if parse_parent_id(parent) == city_id:
                raise _invalid("invalid-parent-city", "A zone cannot belong to itself.")
        return cls(city_id, name, province, city_type, lat, lng, coverage, parent)

    def with_changes(self, changes: Mapping[str, object]) -> "Ciudad":
        """This city with some editable fields replaced. Identity and type are immutable."""
        merged = {
            "name": self.name,
            "province": self.province,
            "location": {"lat": self.lat, "lng": self.lng},
            "coverage": self.coverage,
            "parentCityId": self.parent_city_id,
            **changes,
        }
        return self.parse({**merged, "id": self.id, "type": self.type})

    @classmethod
    def from_document(cls, city_id: str, data: Mapping[str, object]) -> "Ciudad":
        """Tolerant read: documents created before zones existed have no `type`."""
        location = data.get("location")
        point = location if isinstance(location, Mapping) else {}
        coverage = data.get("coverage")
        parent = data.get("parentCityId")
        return cls(
            id=city_id,
            name=_stored_text(data.get("name"), city_id),
            province=_stored_text(data.get("province"), ""),
            type="zone" if data.get("type") == "zone" else "city",
            lat=_stored_number(point.get("lat")),
            lng=_stored_number(point.get("lng")),
            coverage=coverage if coverage in COVERAGES else "planned",
            parent_city_id=parent if isinstance(parent, str) else None,
        )

    def to_document(self) -> dict[str, object]:
        document: dict[str, object] = {
            "name": self.name,
            "province": self.province,
            "country": COUNTRY,
            "type": self.type,
            "location": {"lat": self.lat, "lng": self.lng},
            "coverage": self.coverage,
        }
        if self.parent_city_id is not None:
            document["parentCityId"] = self.parent_city_id
        return document
