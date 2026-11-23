"""EP-09: safe route requests (`safeRouteRequests/{id}`) and the route recommendation.

A request keeps the city, the approximate distance and the time window of a runner. The
recommendation is recomputed on every read from the catalogue and its stored safety index.
"""

from collections.abc import Iterable, Mapping
from dataclasses import dataclass
from datetime import datetime

from apps.cities.domain.models import parse_city_id
from apps.routes.domain.models import (
    Ruta,
    as_mapping,
    is_number,
    parse_doc_id,
    parse_window,
    stored_number,
    stored_text,
)
from apps.routes.domain.time import parse_time, time_windows_overlap, to_window
from apps.shared.domain.errors import DomainError, ErrorKind
from apps.shared.domain.text import sort_key
from apps.system_settings.domain.models import SystemSettings


@dataclass(frozen=True, slots=True)
class SolicitudRutaSegura:
    id: str
    uid: str
    city_id: str
    distance_km: float
    start_time: str
    end_time: str
    # ISO 8601 moment with its offset, set by the server.
    created_at: str

    @classmethod
    def parse(
        cls, raw: object, request_id: str, uid: str, now: datetime, settings: SystemSettings
    ) -> "SolicitudRutaSegura":
        request_id = parse_doc_id(request_id, "invalid-request-id")
        data = as_mapping(raw)
        city_id = parse_city_id(data.get("cityId"))
        distance = data.get("distanceKm")
        max_distance = settings.safe_route_max_distance_km
        if not is_number(distance) or not 0 < distance <= max_distance:
            raise DomainError(
                ErrorKind.INVALID_ARGUMENT,
                "invalid-distance",
                f"Distance must be greater than 0 and at most {max_distance} km.",
            )
        start_time, end_time = parse_window(data, required=True)
        return cls(
            id=request_id,
            uid=uid,
            city_id=city_id,
            distance_km=distance,
            start_time=start_time,
            end_time=end_time,
            created_at=now.isoformat(timespec="seconds"),
        )

    @classmethod
    def from_document(cls, request_id: str, data: Mapping[str, object]) -> "SolicitudRutaSegura":
        return cls(
            id=request_id,
            uid=stored_text(data.get("uid")),
            city_id=stored_text(data.get("cityId")),
            distance_km=stored_number(data.get("distanceKm")),
            start_time=stored_text(data.get("startTime"), "00:00"),
            end_time=stored_text(data.get("endTime"), "24:00"),
            created_at=stored_text(data.get("createdAt")),
        )

    def to_document(self) -> dict[str, object]:
        return {
            "uid": self.uid,
            "cityId": self.city_id,
            "distanceKm": self.distance_km,
            "startTime": self.start_time,
            "endTime": self.end_time,
            "createdAt": self.created_at,
        }


@dataclass(frozen=True, slots=True)
class SeguridadEnFranja:
    """The stored index of a route in the time slot that overlaps the requested window."""

    slot_id: str
    level: str
    score: int
    start_time: str
    end_time: str
    factors: list[object]


@dataclass(frozen=True, slots=True)
class RutaRecomendada:
    route: Ruta
    # None when no time slot of the route overlaps the requested window.
    safety: SeguridadEnFranja | None


def _slot_safety(route: Ruta, start_time: str, end_time: str) -> SeguridadEnFranja | None:
    """The worst slot of the route that overlaps the window: the conservative reading."""
    window = to_window(start_time, end_time)
    overlapping = []
    for slot_id, raw in route.safety.items():
        index = as_mapping(raw)
        start, end, score = index.get("startTime"), index.get("endTime"), index.get("score")
        if parse_time(start) is None or parse_time(end) is None or not is_number(score):
            continue
        if time_windows_overlap(window, to_window(start, end)):
            factors = index.get("factors")
            overlapping.append(
                SeguridadEnFranja(
                    slot_id=slot_id,
                    level=stored_text(index.get("level")),
                    score=int(score),
                    start_time=start,
                    end_time=end,
                    factors=factors if isinstance(factors, list) else [],
                )
            )
    return min(overlapping, key=lambda s: (s.score, s.slot_id), default=None)


def recommend(
    routes: Iterable[Ruta], request: SolicitudRutaSegura, settings: SystemSettings
) -> list[RutaRecomendada]:
    """Active routes of the city within the distance tolerance; the highest score in the
    requested window first, then the closest distance; routes without an index go last."""
    tolerance = settings.safe_route_distance_tolerance
    low = request.distance_km * (1 - tolerance)
    high = request.distance_km * (1 + tolerance)
    matches = [
        RutaRecomendada(route, _slot_safety(route, request.start_time, request.end_time))
        for route in routes
        if route.active and route.city_id == request.city_id and low <= route.distance_km <= high
    ]
    return sorted(
        matches,
        key=lambda m: (
            m.safety is None,
            -(m.safety.score if m.safety else 0),
            abs(m.route.distance_km - request.distance_km),
            sort_key(m.route.name),
            m.route.id,
        ),
    )
