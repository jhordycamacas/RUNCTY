from typing import Protocol

from apps.safe_routes.domain.models import SolicitudRutaSegura


class SafeRouteRequestRepository(Protocol):
    """The `safeRouteRequests` collection."""

    def new_id(self) -> str: ...

    def get(self, request_id: str) -> SolicitudRutaSegura | None: ...

    def save(self, request: SolicitudRutaSegura) -> None: ...

    def delete(self, request_id: str) -> None: ...

    def of_runner(self, uid: str) -> list[SolicitudRutaSegura]: ...
