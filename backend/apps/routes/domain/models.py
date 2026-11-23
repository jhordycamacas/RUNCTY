"""Models stored under `routes/{id}` (RF-05, RF-07). Attributes are snake_case, fields camelCase.

`parse` validates client input and raises an `invalid-argument` domain error whose `reason`
the clients translate. `from_document` reads what is stored and never raises.
"""

import math
import re
from collections.abc import Mapping
from dataclasses import dataclass, field
from typing import TYPE_CHECKING

from apps.cities.domain.models import parse_city_id
from apps.routes.domain.geo import LatLng
from apps.routes.domain.safety import SEVERITIES
from apps.routes.domain.time import is_iso_date, parse_time
from apps.shared.domain.errors import DomainError, ErrorKind
from apps.system_settings.domain.models import SystemSettings

if TYPE_CHECKING:  # The incident model imports this module.
    from apps.safety_data.domain.models import IncidenteSeguridad


# Firestore auto ids (20 chars) and slugs used by the seed.
_DOC_ID = re.compile(r"[A-Za-z0-9_-]{1,64}")
_MAX_LABEL = 80
_MAX_FACTOR_DESCRIPTION = 200
_MAX_SLOT_LABEL = 40
_MAX_CATEGORY = 40
# A polyline needs two points; the upper bound is a system parameter.
_MIN_POINTS = 2
_NO_ORDER = 2**53 - 1  # a stored segment without `order` goes last

_MISSING = object()


def _invalid(reason: str, message: str) -> DomainError:
    return DomainError(ErrorKind.INVALID_ARGUMENT, reason, message)


def parse_doc_id(value: object, reason: str) -> str:
    if not isinstance(value, str) or not _DOC_ID.fullmatch(value):
        raise _invalid(reason, "A valid id is required.")
    return value


def as_mapping(raw: object) -> Mapping[str, object]:
    return raw if isinstance(raw, Mapping) else {}


def is_number(value: object) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def _is_whole(value: object) -> bool:
    return is_number(value) and float(value).is_integer()


def required_text(value: object, max_length: int, reason: str, message: str) -> str:
    text = value.strip() if isinstance(value, str) else ""
    if not text or len(text) > max_length:
        raise _invalid(reason, message)
    return text


def optional_text(value: object, max_length: int, reason: str, message: str) -> str | None:
    if value is None:
        return None
    if not isinstance(value, str) or len(value.strip()) > max_length:
        raise _invalid(reason, message)
    return value.strip()


def parse_lat_lng(raw: object) -> LatLng | None:
    point = as_mapping(raw)
    lat, lng = point.get("lat"), point.get("lng")
    if not (is_number(lat) and is_number(lng) and -90 <= lat <= 90 and -180 <= lng <= 180):
        return None
    return LatLng(lat, lng)


def stored_text(value: object, fallback: str = "") -> str:
    return value if isinstance(value, str) else fallback


def stored_optional_text(value: object) -> str | None:
    return value if isinstance(value, str) else None


def stored_number(value: object, fallback: float = 0) -> float:
    return value if is_number(value) else fallback


def _stored_lat_lngs(value: object) -> tuple[LatLng, ...]:
    points = value if isinstance(value, list) else []
    return tuple(
        LatLng(stored_number(as_mapping(p).get("lat")), stored_number(as_mapping(p).get("lng")))
        for p in points
    )


@dataclass(frozen=True, slots=True)
class PuntoRuta:
    """The start or the end of a route."""

    lat: float
    lng: float
    label: str

    @classmethod
    def parse(cls, raw: object, reason: str) -> "PuntoRuta":
        point = parse_lat_lng(raw)
        label = as_mapping(raw).get("label")
        text = label.strip() if isinstance(label, str) else ""
        if point is None or not text or len(text) > _MAX_LABEL:
            raise _invalid(
                reason, f"A point needs valid lat/lng and a label (max {_MAX_LABEL} chars)."
            )
        return cls(point.lat, point.lng, text)

    @classmethod
    def from_document(cls, raw: object) -> "PuntoRuta":
        point = as_mapping(raw)
        return cls(
            stored_number(point.get("lat")),
            stored_number(point.get("lng")),
            stored_text(point.get("label")),
        )

    def to_document(self) -> dict[str, object]:
        return {"lat": self.lat, "lng": self.lng, "label": self.label}


@dataclass(frozen=True, slots=True)
class Ruta:
    """Document `routes/{id}`. `segment_count` and `safety` are computed, never client input."""

    id: str
    name: str
    city_id: str
    description: str
    start: PuntoRuta
    end: PuntoRuta
    distance_km: float
    elevation_gain_m: float
    surface: str
    difficulty: str
    active: bool
    segment_count: int = 0
    # The stored index per time slot id (see `IndiceSeguridadRuta.to_document`).
    safety: Mapping[str, object] = field(default_factory=dict)

    @classmethod
    def parse(cls, raw: object, route_id: str, settings: SystemSettings) -> "Ruta":
        route_id = parse_doc_id(route_id, "invalid-route-id")
        data = as_mapping(raw)
        max_name = settings.route_name_max_length
        max_description = settings.route_description_max_length
        max_distance = settings.route_max_distance_km
        max_elevation = settings.route_max_elevation_m
        name = required_text(
            data.get("name"),
            max_name,
            "invalid-route-name",
            f"Route name is required (max {max_name} chars).",
        )
        city_id = parse_city_id(data.get("cityId"))
        description = optional_text(
            data.get("description"),
            max_description,
            "invalid-route-description",
            f"Description must be text (max {max_description} chars).",
        )
        start = PuntoRuta.parse(data.get("start"), "invalid-route-start")
        end = PuntoRuta.parse(data.get("end"), "invalid-route-end")

        distance = data.get("distanceKm")
        if not is_number(distance) or not 0 < distance <= max_distance:
            raise _invalid(
                "invalid-distance",
                f"Distance must be greater than 0 and at most {max_distance} km.",
            )
        elevation = data.get("elevationGainM")
        if not is_number(elevation) or not 0 <= elevation <= max_elevation:
            raise _invalid(
                "invalid-elevation-gain",
                f"Elevation gain must be between 0 and {max_elevation} m.",
            )
        surface = required_text(
            data.get("surface"),
            _MAX_CATEGORY,
            "invalid-surface",
            f"Surface is required (max {_MAX_CATEGORY} chars).",
        )
        difficulty = required_text(
            data.get("difficulty"),
            _MAX_CATEGORY,
            "invalid-difficulty",
            f"Difficulty is required (max {_MAX_CATEGORY} chars).",
        )
        active = data.get("active", True)
        if not isinstance(active, bool):
            raise _invalid("invalid-active", "active must be a boolean.")

        return cls(
            id=route_id,
            name=name,
            city_id=city_id,
            description=description or "",
            start=start,
            end=end,
            distance_km=distance,
            elevation_gain_m=elevation,
            surface=surface,
            difficulty=difficulty,
            active=active,
        )

    @classmethod
    def from_document(cls, route_id: str, data: Mapping[str, object]) -> "Ruta":
        safety = data.get("safety")
        return cls(
            id=route_id,
            name=stored_text(data.get("name"), route_id),
            city_id=stored_text(data.get("cityId")),
            description=stored_text(data.get("description")),
            start=PuntoRuta.from_document(data.get("start")),
            end=PuntoRuta.from_document(data.get("end")),
            distance_km=stored_number(data.get("distanceKm")),
            elevation_gain_m=stored_number(data.get("elevationGainM")),
            surface=stored_text(data.get("surface")),
            difficulty=stored_text(data.get("difficulty")),
            active=data.get("active") is True,
            segment_count=int(stored_number(data.get("segmentCount"))),
            safety=dict(safety) if isinstance(safety, Mapping) else {},
        )

    def to_document(self) -> dict[str, object]:
        """The fields a client may set."""
        return {
            "name": self.name,
            "cityId": self.city_id,
            "description": self.description,
            "start": self.start.to_document(),
            "end": self.end.to_document(),
            "distanceKm": self.distance_km,
            "elevationGainM": self.elevation_gain_m,
            "surface": self.surface,
            "difficulty": self.difficulty,
            "active": self.active,
        }


@dataclass(frozen=True, slots=True)
class TramoInput:
    """What a client sends for a segment. `order` is the target position (0-based)."""

    name: str
    coordinates: tuple[LatLng, ...]
    order: int | None

    @classmethod
    def parse(cls, raw: object, settings: SystemSettings) -> "TramoInput":
        data = as_mapping(raw)
        max_name = settings.route_name_max_length
        max_points = settings.segment_max_points
        name = required_text(
            data.get("name"),
            max_name,
            "invalid-segment-name",
            f"Segment name is required (max {max_name} chars).",
        )
        coordinates = data.get("coordinates")
        points = [parse_lat_lng(p) for p in coordinates] if isinstance(coordinates, list) else []
        if not _MIN_POINTS <= len(points) <= max_points or None in points:
            raise _invalid(
                "invalid-coordinates",
                f"A segment needs {_MIN_POINTS}-{max_points} valid coordinates.",
            )
        order = data.get("order", _MISSING)
        if order is _MISSING:
            target = None
        elif _is_whole(order) and order >= 0:
            target = int(order)
        else:
            raise _invalid("invalid-segment-order", "Order must be a non-negative integer.")
        return cls(name, tuple(points), target)


@dataclass(frozen=True, slots=True)
class Tramo:
    """Document `routes/{id}/segments/{id}`."""

    id: str
    name: str
    order: int
    coordinates: tuple[LatLng, ...]
    length_m: int
    # The stored index per time slot id (see `IndiceSeguridad.to_document`).
    safety: Mapping[str, object] = field(default_factory=dict)

    @classmethod
    def from_document(cls, segment_id: str, data: Mapping[str, object]) -> "Tramo":
        safety = data.get("safety")
        return cls(
            id=segment_id,
            name=stored_text(data.get("name"), segment_id),
            order=int(stored_number(data.get("order"), _NO_ORDER)),
            coordinates=_stored_lat_lngs(data.get("coordinates")),
            length_m=int(stored_number(data.get("lengthM"))),
            safety=dict(safety) if isinstance(safety, Mapping) else {},
        )


@dataclass(frozen=True, slots=True)
class FranjaHoraria:
    """Document `routes/{id}/timeSlots/{id}`: a window of the day the index is computed for."""

    id: str
    start_time: str
    end_time: str
    label: str | None = None
    valid_from: str | None = None
    valid_to: str | None = None

    @classmethod
    def parse(cls, raw: object, slot_id: str) -> "FranjaHoraria":
        slot_id = parse_doc_id(slot_id, "invalid-time-slot-id")
        data = as_mapping(raw)
        label = optional_text(
            data.get("label"),
            _MAX_SLOT_LABEL,
            "invalid-slot-label",
            f"Label must be text (max {_MAX_SLOT_LABEL} chars).",
        )
        start_time, end_time = parse_window(data, required=True)

        valid_from = data.get("validFrom", _MISSING)
        valid_to = data.get("validTo", _MISSING)
        if valid_from is not _MISSING and not is_iso_date(valid_from):
            raise _invalid("invalid-valid-from", "validFrom must be YYYY-MM-DD.")
        if valid_to is not _MISSING and not is_iso_date(valid_to):
            raise _invalid("invalid-valid-to", "validTo must be YYYY-MM-DD.")
        if valid_from is not _MISSING and valid_to is not _MISSING and valid_from > valid_to:
            raise _invalid("invalid-date-range", "validFrom must not be after validTo.")

        return cls(
            id=slot_id,
            start_time=start_time,
            end_time=end_time,
            label=label or None,
            valid_from=None if valid_from is _MISSING else valid_from,
            valid_to=None if valid_to is _MISSING else valid_to,
        )

    @classmethod
    def from_document(cls, slot_id: str, data: Mapping[str, object]) -> "FranjaHoraria":
        return cls(
            id=slot_id,
            start_time=stored_text(data.get("startTime")),
            end_time=stored_text(data.get("endTime")),
            label=stored_optional_text(data.get("label")),
            valid_from=stored_optional_text(data.get("validFrom")),
            valid_to=stored_optional_text(data.get("validTo")),
        )

    def to_document(self) -> dict[str, str]:
        """The stored fields; the optional ones only when set."""
        fields = {
            "label": self.label,
            "startTime": self.start_time,
            "endTime": self.end_time,
            "validFrom": self.valid_from,
            "validTo": self.valid_to,
        }
        return {key: value for key, value in fields.items() if value is not None}


@dataclass(frozen=True, slots=True)
class FactorDeRiesgo:
    """Document `routes/{id}/segments/{id}/riskFactors/{id}`, with an optional daily window."""

    id: str
    type: str
    severity: str
    description: str
    start_time: str | None = None
    end_time: str | None = None

    @classmethod
    def parse(cls, raw: object, factor_id: str) -> "FactorDeRiesgo":
        factor_id = parse_doc_id(factor_id, "invalid-risk-factor-id")
        data = as_mapping(raw)
        factor_type = required_text(
            data.get("type"),
            _MAX_CATEGORY,
            "invalid-factor-type",
            f"Risk factor type is required (max {_MAX_CATEGORY} chars).",
        )
        severity = data.get("severity")
        if not isinstance(severity, str) or severity not in SEVERITIES:
            raise _invalid("invalid-severity", "Severity must be low, medium or high.")
        description = required_text(
            data.get("description"),
            _MAX_FACTOR_DESCRIPTION,
            "invalid-factor-description",
            f"Description is required (max {_MAX_FACTOR_DESCRIPTION} chars).",
        )
        start_time, end_time = parse_window(data, required=False)
        return cls(factor_id, factor_type, severity, description, start_time, end_time)

    @classmethod
    def from_document(cls, factor_id: str, data: Mapping[str, object]) -> "FactorDeRiesgo | None":
        """None for a malformed document, so it never breaks the index."""
        factor_type, severity = data.get("type"), data.get("severity")
        if not isinstance(factor_type, str) or severity not in SEVERITIES:
            return None
        return cls(
            id=factor_id,
            type=factor_type,
            severity=severity,
            description=stored_text(data.get("description")),
            start_time=stored_optional_text(data.get("startTime")),
            end_time=stored_optional_text(data.get("endTime")),
        )

    def to_document(self) -> dict[str, str]:
        fields = {
            "type": self.type,
            "severity": self.severity,
            "description": self.description,
            "startTime": self.start_time,
            "endTime": self.end_time,
        }
        return {key: value for key, value in fields.items() if value is not None}


def parse_window(data: Mapping[str, object], *, required: bool) -> tuple[str | None, str | None]:
    """An "HH:MM" window with start before end. When optional: both bounds or none."""
    start = data.get("startTime", _MISSING)
    end = data.get("endTime", _MISSING)
    if not required and start is _MISSING and end is _MISSING:
        return None, None
    if not required and (start is _MISSING or end is _MISSING):
        raise _invalid("invalid-time-range", "Provide both start and end time, or neither.")
    start_minutes = parse_time(start)
    if start_minutes is None or start_minutes >= 24 * 60:
        raise _invalid("invalid-start-time", "Start time must be HH:MM (00:00-23:59).")
    end_minutes = parse_time(end)
    if end_minutes is None:
        raise _invalid("invalid-end-time", "End time must be HH:MM (00:00-24:00).")
    if start_minutes >= end_minutes:
        raise _invalid("invalid-time-range", "Start time must be before end time (same day).")
    return start, end


@dataclass(frozen=True, slots=True)
class RouteState:
    """Everything the safety index depends on for one route."""

    segments: list[Tramo]
    slots: list[FranjaHoraria]
    # Risk factors keyed by segment id.
    factors: dict[str, list[FactorDeRiesgo]]
    # Safety incidents registered on the route (EP-08), stored outside the route tree.
    incidents: list["IncidenteSeguridad"] = field(default_factory=list)
