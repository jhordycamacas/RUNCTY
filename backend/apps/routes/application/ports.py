from collections.abc import Callable
from dataclasses import dataclass
from enum import Enum
from typing import Literal, Protocol

from apps.routes.domain.models import RouteState, Ruta


class Marker(Enum):
    """Placeholders in write data that the adapter replaces with the store's own sentinels."""

    SERVER_TIMESTAMP = "server-timestamp"
    DELETE_FIELD = "delete-field"


SERVER_TIMESTAMP = Marker.SERVER_TIMESTAMP
# Removes a field from the document in an `update` write.
DELETE_FIELD = Marker.DELETE_FIELD


@dataclass(frozen=True, slots=True)
class WriteOp:
    """One document write, by full path (`routes/{id}/segments/{id}`)."""

    op: Literal["set", "update", "delete"]
    path: str
    data: dict[str, object] | None = None


# Planner run by `RouteRepository.mutate`; it may run more than once (transaction retries).
RoutePlan = Callable[[RouteState | None], list[WriteOp]]


class RouteRepository(Protocol):
    """The `routes/{id}` aggregate: the route and its segments, time slots and risk factors."""

    def new_id(self) -> str: ...

    def get(self, route_id: str) -> Ruta | None: ...

    def state(self, route_id: str) -> RouteState | None:
        """The segments, time slots and risk factors of a route; None if it does not exist."""
        ...

    def image(self, route_id: str) -> str | None:
        """The data URL of the custom image of a route, or None when it has none."""
        ...

    def commit(self, ops: list[WriteOp]) -> None:
        """Applies the writes atomically."""
        ...

    def mutate(self, route_id: str, plan: RoutePlan) -> None:
        """Reads the route state (None if the route is missing), plans and writes atomically."""
        ...

    def delete_tree(self, route_id: str) -> None:
        """Deletes the route document and everything under it."""
        ...

    # Last: the method name shadows the builtin `list` for the annotations that follow it.
    def list(self, city_id: str | None = None) -> list[Ruta]:
        """Every route, active or not, optionally of one city or zone."""
        ...
