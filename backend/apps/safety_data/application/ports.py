from typing import Protocol

from apps.safety_data.domain.models import FuenteInformacion, IncidenteSeguridad


class SourceRepository(Protocol):
    """The `informationSources` collection."""

    def new_id(self) -> str: ...

    def get(self, source_id: str) -> FuenteInformacion | None: ...

    def save(self, source: FuenteInformacion) -> None:
        """Creates or replaces the source."""
        ...

    def delete(self, source_id: str) -> None: ...

    # Last: the method name shadows the builtin `list` for the annotations that follow it.
    def list(self) -> list[FuenteInformacion]: ...


class IncidentRepository(Protocol):
    """Reads of the `safetyIncidents` collection. Incidents are written through
    `RouteRepository.mutate`, together with the recalculated index of their route."""

    def new_id(self) -> str: ...

    def get(self, incident_id: str) -> IncidenteSeguridad | None: ...

    def of_source(self, source_id: str) -> list[IncidenteSeguridad]: ...

    # Last: the method name shadows the builtin `list` for the annotations that follow it.
    def list(self, route_id: str | None = None) -> list[IncidenteSeguridad]:
        """Every incident, or those of one route."""
        ...
