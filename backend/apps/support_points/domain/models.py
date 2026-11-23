"""EP-06: support points (`supportPoints/{id}`) and guarded trails (`guardedTrails/{id}`).

In Sprint 3 both are only shown to the runner; they do not change the safety index.
`parse` validates client input and raises an `invalid-argument` domain error whose `reason`
the clients translate. `from_document` reads what is stored and never raises.
"""

from collections.abc import Iterable, Mapping
from dataclasses import dataclass

from apps.cities.domain.models import parse_city_id
from apps.routes.domain.geo import LatLng, distance_m
from apps.routes.domain.models import (
    as_mapping,
    optional_text,
    parse_doc_id,
    parse_lat_lng,
    parse_window,
    required_text,
    stored_number,
    stored_optional_text,
    stored_text,
)
from apps.routes.domain.time import time_windows_overlap, to_window
from apps.shared.domain.errors import DomainError, ErrorKind

WEEK_DAYS = ("mon", "tue", "wed", "thu", "fri", "sat", "sun")
# "Near" a route or a runner (design decisions of EP-06).
NEARBY_RADIUS_M = 500
MAX_SEARCH_RADIUS_M = 50_000

_MAX_NAME = 80
_MAX_TYPE = 40
_MAX_OPENING_HOURS = 80


def _invalid(reason: str, message: str) -> DomainError:
    return DomainError(ErrorKind.INVALID_ARGUMENT, reason, message)


def is_near(point: LatLng, places: Iterable[LatLng], radius_m: float) -> bool:
    """Within `radius_m` meters (haversine) of any of the places."""
    return any(distance_m(point, place) <= radius_m for place in places)


def parse_search_area(query: Mapping[str, object]) -> tuple[LatLng, float] | None:
    """The `lat`, `lng` and `radiusM` filter: all three or none."""
    lat, lng, radius = query.get("lat"), query.get("lng"), query.get("radiusM")
    if lat is None and lng is None and radius is None:
        return None
    center = parse_lat_lng({"lat": lat, "lng": lng})
    if center is None:
        raise _invalid("invalid-search-location", "Provide a valid lat and lng with radiusM.")
    if not isinstance(radius, (int, float)) or not 0 < radius <= MAX_SEARCH_RADIUS_M:
        raise _invalid(
            "invalid-search-radius",
            f"radiusM must be greater than 0 and at most {MAX_SEARCH_RADIUS_M} m.",
        )
    return center, radius


@dataclass(frozen=True, slots=True)
class PuntoApoyo:
    """A place where a runner can ask for help, in a city or zone."""

    id: str
    type: str
    location: LatLng
    city_id: str
    name: str | None = None
    opening_hours: str | None = None

    @classmethod
    def parse(cls, raw: object, point_id: str) -> "PuntoApoyo":
        point_id = parse_doc_id(point_id, "invalid-support-point-id")
        data = as_mapping(raw)
        point_type = required_text(
            data.get("type"),
            _MAX_TYPE,
            "invalid-support-point-type",
            f"Type is required (max {_MAX_TYPE} chars).",
        )
        location = parse_lat_lng(data.get("location"))
        if location is None:
            raise _invalid(
                "invalid-location", "Location needs a lat in -90..90 and lng in -180..180."
            )
        city_id = parse_city_id(data.get("cityId"))
        name = optional_text(
            data.get("name"),
            _MAX_NAME,
            "invalid-support-point-name",
            f"Name must be text (max {_MAX_NAME} chars).",
        )
        opening_hours = optional_text(
            data.get("openingHours"),
            _MAX_OPENING_HOURS,
            "invalid-opening-hours",
            f"Opening hours must be text (max {_MAX_OPENING_HOURS} chars).",
        )
        return cls(point_id, point_type, location, city_id, name or None, opening_hours or None)

    @classmethod
    def from_document(cls, point_id: str, data: Mapping[str, object]) -> "PuntoApoyo":
        location = as_mapping(data.get("location"))
        return cls(
            id=point_id,
            type=stored_text(data.get("type")),
            location=LatLng(stored_number(location.get("lat")), stored_number(location.get("lng"))),
            city_id=stored_text(data.get("cityId")),
            name=stored_optional_text(data.get("name")),
            opening_hours=stored_optional_text(data.get("openingHours")),
        )

    def to_document(self) -> dict[str, object]:
        return {
            "type": self.type,
            "name": self.name,
            "location": self.location.to_document(),
            "cityId": self.city_id,
            "openingHours": self.opening_hours,
        }


def _parse_days(value: object) -> tuple[str, ...]:
    days = value if isinstance(value, list) else []
    if not days or len(set(days)) != len(days) or not all(day in WEEK_DAYS for day in days):
        raise _invalid("invalid-days", "Days must be distinct values among mon..sun.")
    return tuple(day for day in WEEK_DAYS if day in days)


@dataclass(frozen=True, slots=True)
class ResguardoPolicial:
    """Days and hours of police presence on a route, or on one of its segments."""

    id: str
    route_id: str
    segment_id: str | None
    days: tuple[str, ...]
    start_time: str
    end_time: str

    @classmethod
    def parse(cls, raw: object, trail_id: str) -> "ResguardoPolicial":
        trail_id = parse_doc_id(trail_id, "invalid-guarded-trail-id")
        data = as_mapping(raw)
        route_id = parse_doc_id(data.get("routeId"), "invalid-route-id")
        segment = data.get("segmentId")
        segment_id = None if segment is None else parse_doc_id(segment, "invalid-segment-id")
        days = _parse_days(data.get("days"))
        start_time, end_time = parse_window(data, required=True)
        return cls(trail_id, route_id, segment_id, days, start_time, end_time)

    @classmethod
    def from_document(cls, trail_id: str, data: Mapping[str, object]) -> "ResguardoPolicial | None":
        """None for a malformed document."""
        days = data.get("days")
        start_time, end_time = data.get("startTime"), data.get("endTime")
        if not (
            isinstance(days, list) and isinstance(start_time, str) and isinstance(end_time, str)
        ):
            return None
        return cls(
            id=trail_id,
            route_id=stored_text(data.get("routeId")),
            segment_id=stored_optional_text(data.get("segmentId")),
            days=tuple(day for day in WEEK_DAYS if day in days),
            start_time=start_time,
            end_time=end_time,
        )

    def to_document(self) -> dict[str, object]:
        return {
            "routeId": self.route_id,
            "segmentId": self.segment_id,
            "days": list(self.days),
            "startTime": self.start_time,
            "endTime": self.end_time,
        }

    def overlaps(self, other: "ResguardoPolicial") -> bool:
        """Same route and segment, a shared day and overlapping hours."""
        return (
            (self.route_id, self.segment_id) == (other.route_id, other.segment_id)
            and bool(set(self.days) & set(other.days))
            and time_windows_overlap(
                to_window(self.start_time, self.end_time),
                to_window(other.start_time, other.end_time),
            )
        )
