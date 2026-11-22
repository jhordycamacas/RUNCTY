"""EP-06: support points and guarded trails.

Reads need a signed-in user; changes need `routes.manage`, both checked by the presentation
layer. Deleting a guarded trail never touches the route or the segment it refers to.
"""

from collections.abc import Mapping
from dataclasses import dataclass

from apps.cities.application.ports import CityRepository
from apps.cities.domain.models import parse_city_id
from apps.routes.application.ports import RouteRepository
from apps.routes.domain.geo import LatLng
from apps.routes.domain.models import parse_doc_id
from apps.shared.domain.errors import DomainError, ErrorKind
from apps.shared.domain.text import sort_key
from apps.support_points.application.ports import GuardedTrailRepository, SupportPointRepository
from apps.support_points.domain.models import (
    NEARBY_RADIUS_M,
    PuntoApoyo,
    ResguardoPolicial,
    is_near,
    parse_search_area,
)


@dataclass(frozen=True, slots=True)
class SupportPointsDeps:
    points: SupportPointRepository
    trails: GuardedTrailRepository
    routes: RouteRepository
    cities: CityRepository


def _not_found(reason: str, message: str) -> DomainError:
    return DomainError(ErrorKind.NOT_FOUND, reason, message)


def _route_not_found(route_id: str) -> DomainError:
    return _not_found("route-not-found", f'Route "{route_id}" does not exist.')


def _route_places(route_id: str, routes: RouteRepository) -> list[LatLng]:
    """The start, the end and every segment point of a route."""
    route, state = routes.get(route_id), routes.state(route_id)
    if route is None or state is None:
        raise _route_not_found(route_id)
    ends = [LatLng(route.start.lat, route.start.lng), LatLng(route.end.lat, route.end.lng)]
    return ends + [point for segment in state.segments for point in segment.coordinates]


# ---------- Support points ----------


def list_support_points(query: Mapping[str, object], deps: SupportPointsDeps) -> list[PuntoApoyo]:
    """RF-06-2: by city or zone, near a route, or near a location; sorted by name."""
    city_id = query.get("cityId")
    points = deps.points.list(None if city_id is None else parse_city_id(city_id))
    route_id = query.get("routeId")
    if route_id is not None:
        places = _route_places(parse_doc_id(route_id, "invalid-route-id"), deps.routes)
        points = [p for p in points if is_near(p.location, places, NEARBY_RADIUS_M)]
    area = parse_search_area(query)
    if area is not None:
        center, radius_m = area
        points = [p for p in points if is_near(p.location, [center], radius_m)]
    return sorted(points, key=lambda p: (sort_key(p.name or ""), p.type, p.id))


def _require_point(raw_id: object, points: SupportPointRepository) -> PuntoApoyo:
    point_id = parse_doc_id(raw_id, "invalid-support-point-id")
    point = points.get(point_id)
    if point is None:
        raise _not_found("support-point-not-found", f'Support point "{point_id}" does not exist.')
    return point


def get_support_point(raw_id: object, points: SupportPointRepository) -> PuntoApoyo:
    return _require_point(raw_id, points)


def _save_point(point: PuntoApoyo, deps: SupportPointsDeps) -> None:
    if deps.cities.get(point.city_id) is None:
        raise _not_found("city-not-found", f'City or zone "{point.city_id}" does not exist.')
    deps.points.save(point)


def create_support_point(raw: object, deps: SupportPointsDeps) -> str:
    point = PuntoApoyo.parse(raw, deps.points.new_id())
    _save_point(point, deps)
    return point.id


def update_support_point(raw_id: object, raw: object, deps: SupportPointsDeps) -> None:
    current = _require_point(raw_id, deps.points)
    _save_point(PuntoApoyo.parse(raw, current.id), deps)


def delete_support_point(raw_id: object, points: SupportPointRepository) -> None:
    """RF-06-4: the clients confirm first; the point stops being shown."""
    points.delete(_require_point(raw_id, points).id)


# ---------- Guarded trails ----------


def list_guarded_trails(
    raw_route_id: object, trails: GuardedTrailRepository
) -> list[ResguardoPolicial]:
    """RF-06-6: every guarded trail, or those of one route, sorted by segment and start time."""
    route_id = None if raw_route_id is None else parse_doc_id(raw_route_id, "invalid-route-id")
    return sorted(
        trails.list(route_id),
        key=lambda t: (t.route_id, t.segment_id or "", t.start_time, t.days, t.id),
    )


def _require_trail(raw_id: object, trails: GuardedTrailRepository) -> ResguardoPolicial:
    trail_id = parse_doc_id(raw_id, "invalid-guarded-trail-id")
    trail = trails.get(trail_id)
    if trail is None:
        raise _not_found("guarded-trail-not-found", f'Guarded trail "{trail_id}" does not exist.')
    return trail


def get_guarded_trail(raw_id: object, trails: GuardedTrailRepository) -> ResguardoPolicial:
    return _require_trail(raw_id, trails)


def _save_trail(trail: ResguardoPolicial, deps: SupportPointsDeps) -> None:
    """The route and the segment exist, and no other trail of the same segment overlaps."""
    state = deps.routes.state(trail.route_id)
    if state is None:
        raise _route_not_found(trail.route_id)
    if trail.segment_id is not None and not any(s.id == trail.segment_id for s in state.segments):
        raise _not_found("segment-not-found", f'Segment "{trail.segment_id}" does not exist.')
    for other in deps.trails.list(trail.route_id):
        if other.id != trail.id and trail.overlaps(other):
            raise DomainError(
                ErrorKind.FAILED_PRECONDITION,
                "guarded-trail-overlap",
                f"Overlaps the guarded trail {other.start_time}-{other.end_time}.",
            )
    deps.trails.save(trail)


def create_guarded_trail(raw: object, deps: SupportPointsDeps) -> str:
    trail = ResguardoPolicial.parse(raw, deps.trails.new_id())
    _save_trail(trail, deps)
    return trail.id


def update_guarded_trail(raw_id: object, raw: object, deps: SupportPointsDeps) -> None:
    current = _require_trail(raw_id, deps.trails)
    _save_trail(ResguardoPolicial.parse(raw, current.id), deps)


def delete_guarded_trail(raw_id: object, trails: GuardedTrailRepository) -> None:
    """RF-06-8: removes the police presence record, never the route or the segment."""
    trails.delete(_require_trail(raw_id, trails).id)
