"""Document `cities/{id}`: a city or one of its zones (RF-04).

`type` and `coverage` are free text the admin types. Only `parentCityId` carries meaning: a place
with a parent city is a zone of it, one without is a top-level city.

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
_MAX_TYPE = 40
_MAX_COVERAGE = 60


def _invalid(reason: str, message: str) -> DomainError:
    return DomainError(ErrorKind.INVALID_ARGUMENT, reason, message)


def parse_city_id(value: object) -> str:
    if not isinstance(value, str) or not _CITY_ID.fullmatch(value):
        raise _invalid("invalid-city-id", "A valid city id is required.")
    return value


def parse_coverage(value: object) -> str:
    return _text(value, "invalid-coverage", "Coverage", _MAX_COVERAGE)


def parse_parent_id(value: object) -> str:
    if not isinstance(value, str) or not _CITY_ID.fullmatch(value):
        raise _invalid("invalid-parent-city", "The parent city needs a valid city id.")
    return value


def _text(value: object, reason: str, label: str, limit: int = _MAX_TEXT) -> str:
    text = value.strip() if isinstance(value, str) else ""
    if not text or len(text) > limit:
        raise _invalid(reason, f"{label} is required (max {limit} chars).")
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
    # ISO country code stamped from the system settings when the city is created.
    country: str = ""

    @classmethod
    def parse(cls, raw: Mapping[str, object], country: str) -> "Ciudad":
        """Validates client input. A parent city must also exist: see `use_cases`."""
        city_id = parse_city_id(raw.get("id"))
        name = _text(raw.get("name"), "invalid-city-name", "City name")
        province = _text(raw.get("province"), "invalid-city-province", "Province")

        city_type = _text(raw.get("type"), "invalid-city-type", "Type", _MAX_TYPE)
        lat, lng = _location(raw.get("location"))
        coverage = parse_coverage(raw.get("coverage"))

        parent = raw.get("parentCityId")
        if parent is not None and parse_parent_id(parent) == city_id:
            raise _invalid("invalid-parent-city", "A zone cannot belong to itself.")
        return cls(city_id, name, province, city_type, lat, lng, coverage, parent, country)

    def with_changes(self, changes: Mapping[str, object]) -> "Ciudad":
        """This city with some editable fields replaced. Only the identity is immutable."""
        merged = {
            "name": self.name,
            "province": self.province,
            "type": self.type,
            "location": {"lat": self.lat, "lng": self.lng},
            "coverage": self.coverage,
            "parentCityId": self.parent_city_id,
            **changes,
        }
        return self.parse({**merged, "id": self.id}, self.country)

    @classmethod
    def from_document(cls, city_id: str, data: Mapping[str, object]) -> "Ciudad":
        """Tolerant read: documents created before zones existed have no `type`."""
        location = data.get("location")
        point = location if isinstance(location, Mapping) else {}
        city_type = data.get("type")
        coverage = data.get("coverage")
        parent = data.get("parentCityId")
        return cls(
            id=city_id,
            name=_stored_text(data.get("name"), city_id),
            province=_stored_text(data.get("province"), ""),
            type=city_type if isinstance(city_type, str) and city_type else "city",
            lat=_stored_number(point.get("lat")),
            lng=_stored_number(point.get("lng")),
            coverage=coverage if isinstance(coverage, str) and coverage else "planned",
            parent_city_id=parent if isinstance(parent, str) else None,
            country=_stored_text(data.get("country"), ""),
        )

    def to_document(self) -> dict[str, object]:
        document: dict[str, object] = {
            "name": self.name,
            "province": self.province,
            "country": self.country,
            "type": self.type,
            "location": {"lat": self.lat, "lng": self.lng},
            "coverage": self.coverage,
        }
        if self.parent_city_id is not None:
            document["parentCityId"] = self.parent_city_id
        return document
