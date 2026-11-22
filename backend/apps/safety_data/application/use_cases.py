"""EP-08: information sources and safety incidents.

Every incident change rewrites, in the same transaction, the safety index of the route it
belongs to (RF-07-11); deleting a source stops its incidents from counting and recalculates
their routes. Authority is the `routes.manage` permission, checked by the presentation layer.
"""

from collections.abc import Mapping
from dataclasses import dataclass, replace
from datetime import date, datetime
from typing import Literal

from apps.routes.application.ports import SERVER_TIMESTAMP, RouteRepository, WriteOp
from apps.routes.application.use_cases import with_recalc
from apps.routes.domain.models import RouteState, parse_doc_id
from apps.routes.domain.time import is_iso_date
from apps.safety_data.application.ports import IncidentRepository, SourceRepository
from apps.safety_data.domain.models import INCIDENT_TYPES, FuenteInformacion, IncidenteSeguridad
from apps.shared.domain.errors import DomainError, ErrorKind
from apps.shared.domain.text import sort_key


@dataclass(frozen=True, slots=True)
class SafetyDataDeps:
    sources: SourceRepository
    incidents: IncidentRepository
    routes: RouteRepository


def _incident_path(incident_id: str) -> str:
    return f"safetyIncidents/{incident_id}"


def _not_found(reason: str, message: str) -> DomainError:
    return DomainError(ErrorKind.NOT_FOUND, reason, message)


def _invalid(reason: str, message: str) -> DomainError:
    return DomainError(ErrorKind.INVALID_ARGUMENT, reason, message)


def _require_source(source_id: str, sources: SourceRepository) -> FuenteInformacion:
    source = sources.get(source_id)
    if source is None:
        raise _not_found("source-not-found", f'Information source "{source_id}" does not exist.')
    return source


def _require_incident(raw_id: object, incidents: IncidentRepository) -> IncidenteSeguridad:
    incident_id = parse_doc_id(raw_id, "invalid-incident-id")
    incident = incidents.get(incident_id)
    if incident is None:
        raise _not_found("incident-not-found", f'Incident "{incident_id}" does not exist.')
    return incident


def _require_route(state: RouteState | None, route_id: str) -> RouteState:
    if state is None:
        raise _not_found("route-not-found", f'Route "{route_id}" does not exist.')
    return state


# ---------- Information sources ----------


def list_sources(sources: SourceRepository) -> list[FuenteInformacion]:
    """Sorted by entity, then data type."""
    return sorted(sources.list(), key=lambda s: (sort_key(s.entity), sort_key(s.data_type), s.id))


def get_source(raw_id: object, sources: SourceRepository) -> FuenteInformacion:
    return _require_source(parse_doc_id(raw_id, "invalid-source-id"), sources)


def _assert_unique(source: FuenteInformacion, sources: SourceRepository) -> None:
    if any(other.id != source.id and other.same_origin(source) for other in sources.list()):
        raise DomainError(
            ErrorKind.ALREADY_EXISTS,
            "source-exists",
            "The entity is already registered with that data type.",
        )


def create_source(raw: object, today: date, sources: SourceRepository) -> str:
    source = FuenteInformacion.parse(raw, sources.new_id(), today)
    _assert_unique(source, sources)
    sources.save(source)
    return source.id


def update_source(raw_id: object, raw: object, today: date, sources: SourceRepository) -> None:
    """Changing a source stamps today as its load date (RF-08-7)."""
    source_id = parse_doc_id(raw_id, "invalid-source-id")
    _require_source(source_id, sources)
    source = FuenteInformacion.parse(raw, source_id, today)
    _assert_unique(source, sources)
    sources.save(source)


def _retire_source_on_route(route_id: str, incident_ids: set[str], routes: RouteRepository):
    """Flags the incidents of a deleted source and recalculates their route."""

    def plan(state: RouteState | None) -> list[WriteOp]:
        flags = [
            WriteOp(
                "update",
                _incident_path(incident_id),
                {"sourceDeleted": True, "updatedAt": SERVER_TIMESTAMP},
            )
            for incident_id in sorted(incident_ids)
        ]
        if state is None:  # The route was deleted: only the history remains.
            return flags
        incidents = [
            replace(incident, source_deleted=True) if incident.id in incident_ids else incident
            for incident in state.incidents
        ]
        return with_recalc(route_id, replace(state, incidents=incidents), flags)

    routes.mutate(route_id, plan)


def delete_source(raw_id: object, deps: SafetyDataDeps) -> None:
    """RF-08-8: its incidents stay for the history but stop counting in the index."""
    source_id = parse_doc_id(raw_id, "invalid-source-id")
    _require_source(source_id, deps.sources)
    affected = deps.incidents.of_source(source_id)
    for route_id in sorted({incident.route_id for incident in affected}):
        ids = {incident.id for incident in affected if incident.route_id == route_id}
        _retire_source_on_route(route_id, ids, deps.routes)
    deps.sources.delete(source_id)


# ---------- Safety incidents ----------


def _optional_id(query: Mapping[str, object], key: str, reason: str) -> str | None:
    value = query.get(key)
    return None if value is None else parse_doc_id(value, reason)


def _optional_date(query: Mapping[str, object], key: str) -> str | None:
    value = query.get(key)
    if value is not None and not is_iso_date(value):
        raise _invalid(f"invalid-{key}-date", f"{key} must be YYYY-MM-DD.")
    return value


def list_incidents(
    query: Mapping[str, object], incidents: IncidentRepository
) -> list[IncidenteSeguridad]:
    """RF-08-2: filtered by route, segment, type and date range; the newest first."""
    route_id = _optional_id(query, "routeId", "invalid-route-id")
    segment_id = _optional_id(query, "segmentId", "invalid-segment-id")
    incident_type = query.get("type")
    if incident_type is not None and incident_type not in INCIDENT_TYPES:
        raise _invalid("invalid-incident-type", "Unknown incident type.")
    first, last = _optional_date(query, "from"), _optional_date(query, "to")
    found = [
        incident
        for incident in incidents.list(route_id)
        if (segment_id is None or incident.segment_id == segment_id)
        and (incident_type is None or incident.type == incident_type)
        and (first is None or incident.date >= first)
        and (last is None or incident.date <= last)
    ]
    return sorted(found, key=lambda i: (i.date, i.time, i.id), reverse=True)


def get_incident(raw_id: object, incidents: IncidentRepository) -> IncidenteSeguridad:
    return _require_incident(raw_id, incidents)


def _save_on_route(
    incident: IncidenteSeguridad, op: Literal["set", "update"], routes: RouteRepository
) -> None:
    """Writes the incident and the recalculated index of its route in one transaction."""
    route_id = incident.route_id

    def plan(current: RouteState | None) -> list[WriteOp]:
        state = _require_route(current, route_id)
        if incident.segment_id is not None and not any(
            segment.id == incident.segment_id for segment in state.segments
        ):
            raise _not_found(
                "segment-not-found", f'Segment "{incident.segment_id}" does not exist.'
            )
        stamps = {"updatedAt": SERVER_TIMESTAMP}
        if op == "set":
            stamps["createdAt"] = SERVER_TIMESTAMP
        write = WriteOp(op, _incident_path(incident.id), {**incident.to_document(), **stamps})
        others = [i for i in state.incidents if i.id != incident.id]
        return with_recalc(route_id, replace(state, incidents=[*others, incident]), [write])

    routes.mutate(route_id, plan)


def _recalculate(route_id: str, routes: RouteRepository) -> None:
    routes.mutate(route_id, lambda state: [] if state is None else with_recalc(route_id, state, []))


def create_incident(raw: object, now: datetime, deps: SafetyDataDeps) -> str:
    """RF-08-1. `now` is the local wall clock."""
    incident = IncidenteSeguridad.parse(raw, deps.incidents.new_id(), now)
    _require_source(incident.source_id, deps.sources)
    _save_on_route(incident, "set", deps.routes)
    return incident.id


def update_incident(raw_id: object, raw: object, now: datetime, deps: SafetyDataDeps) -> None:
    """RF-08-3. Moving the incident to another route also recalculates the old one."""
    current = _require_incident(raw_id, deps.incidents)
    incident = IncidenteSeguridad.parse(raw, current.id, now)
    _require_source(incident.source_id, deps.sources)
    _save_on_route(incident, "update", deps.routes)
    if current.route_id != incident.route_id:
        _recalculate(current.route_id, deps.routes)


def delete_incident(raw_id: object, deps: SafetyDataDeps) -> None:
    """RF-08-4: the clients confirm first."""
    incident = _require_incident(raw_id, deps.incidents)
    route_id = incident.route_id

    def plan(state: RouteState | None) -> list[WriteOp]:
        delete = WriteOp("delete", _incident_path(incident.id))
        if state is None:  # The route was deleted: only the history remains.
            return [delete]
        remaining = [i for i in state.incidents if i.id != incident.id]
        return with_recalc(route_id, replace(state, incidents=remaining), [delete])

    deps.routes.mutate(route_id, plan)
