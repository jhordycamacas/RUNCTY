from typing import Protocol

from apps.support_points.domain.models import PuntoApoyo, ResguardoPolicial


class SupportPointRepository(Protocol):
    """The `supportPoints` collection."""

    def new_id(self) -> str: ...

    def get(self, point_id: str) -> PuntoApoyo | None: ...

    def save(self, point: PuntoApoyo) -> None:
        """Creates or replaces the support point."""
        ...

    def delete(self, point_id: str) -> None: ...

    # Last: the method name shadows the builtin `list` for the annotations that follow it.
    def list(self, city_id: str | None = None) -> list[PuntoApoyo]:
        """Every support point, or those of one city or zone."""
        ...


class GuardedTrailRepository(Protocol):
    """The `guardedTrails` collection."""

    def new_id(self) -> str: ...

    def get(self, trail_id: str) -> ResguardoPolicial | None: ...

    def save(self, trail: ResguardoPolicial) -> None:
        """Creates or replaces the guarded trail."""
        ...

    def delete(self, trail_id: str) -> None: ...

    # Last: the method name shadows the builtin `list` for the annotations that follow it.
    def list(self, route_id: str | None = None) -> list[ResguardoPolicial]:
        """Every guarded trail, or those of one route."""
        ...
