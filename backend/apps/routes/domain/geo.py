import math
from collections.abc import Sequence
from dataclasses import dataclass

_EARTH_RADIUS_M = 6_371_000


@dataclass(frozen=True, slots=True)
class LatLng:
    lat: float
    lng: float

    def to_document(self) -> dict[str, float]:
        return {"lat": self.lat, "lng": self.lng}


def distance_m(a: LatLng, b: LatLng) -> float:
    d_lat = math.radians(b.lat - a.lat)
    d_lng = math.radians(b.lng - a.lng)
    h = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(a.lat)) * math.cos(math.radians(b.lat)) * math.sin(d_lng / 2) ** 2
    )
    return 2 * _EARTH_RADIUS_M * math.asin(math.sqrt(h))


def path_length_m(points: Sequence[LatLng]) -> int:
    """Length of a polyline in whole meters."""
    total = sum(distance_m(a, b) for a, b in zip(points, points[1:], strict=False))
    return math.floor(total + 0.5)


def preview_polyline(points: Sequence[LatLng], max_points: int = 40) -> list[LatLng]:
    """Down-samples a polyline to at most `max_points` evenly picked points.

    The first and last points are always kept, so the shape of the route still reads. A polyline
    that already fits is returned unchanged.
    """
    if len(points) <= max_points:
        return list(points)
    last = len(points) - 1
    step = last / (max_points - 1)
    return [points[round(i * step)] for i in range(max_points)]
