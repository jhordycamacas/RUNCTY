"""RF-05 (routes and segments) and RF-07 (time slots, risk factors and safety index).

Every mutation that can change the index returns one write plan that also rewrites the computed
`safety` of every segment and of the route; `RouteRepository.mutate` applies it atomically.
Authority is the `routes.manage` permission of the verified token, checked by the presentation
layer before any mutation. Mutations take the raw request data with the ids of the path in it
(`routeId`, `segmentId`, `slotId`, `factorId`), like the callables did.
"""

from collections.abc import Mapping
from dataclasses import dataclass, field, replace

from apps.cities.application.ports import CityRepository
from apps.cities.domain.models import parse_city_id
from apps.routes.application.ports import (
    DELETE_FIELD,
    SERVER_TIMESTAMP,
    RouteRepository,
    WriteOp,
)
from apps.routes.domain.geo import path_length_m, preview_polyline
from apps.routes.domain.models import (
    FactorDeRiesgo,
    FranjaHoraria,
    RouteState,
    Ruta,
    Tramo,
    TramoInput,
    parse_doc_id,
)
from apps.routes.domain.reorder import insert_at, move_to, order_updates, ordered_ids, remove_id
from apps.routes.domain.route_image import RouteImage
from apps.routes.domain.safety import CalculadoraIndiceSeguridad, TramoEvaluado
from apps.routes.domain.time import local_now, time_windows_overlap, to_window
from apps.safety_data.domain.models import incident_penalties
from apps.shared.domain.errors import DomainError, ErrorKind
from apps.shared.domain.text import sort_key
from apps.system_settings.domain.models import SystemSettings


@dataclass(frozen=True, slots=True)
class RoutesDeps:
    routes: RouteRepository
    cities: CityRepository
    settings: SystemSettings


@dataclass(frozen=True, slots=True)
class RouteDetail:
    """A route with its segments in route order. Time slots and risk factors are for managers."""

    route: Ruta
    segments: list[Tramo]
    slots: list[FranjaHoraria] | None = None
    factors: dict[str, list[FactorDeRiesgo]] | None = None


@dataclass(slots=True)
class _SegmentWrite:
    op: str
    data: dict[str, object] = field(default_factory=dict)


def _route_path(route_id: str) -> str:
    return f"routes/{route_id}"


def _segment_path(route_id: str, segment_id: str) -> str:
    return f"routes/{route_id}/segments/{segment_id}"


def _slot_path(route_id: str, slot_id: str) -> str:
    return f"routes/{route_id}/timeSlots/{slot_id}"


def _factor_path(route_id: str, segment_id: str, factor_id: str) -> str:
    return f"routes/{route_id}/segments/{segment_id}/riskFactors/{factor_id}"


def _not_found(reason: str, message: str) -> DomainError:
    return DomainError(ErrorKind.NOT_FOUND, reason, message)


def _precondition(reason: str, message: str) -> DomainError:
    return DomainError(ErrorKind.FAILED_PRECONDITION, reason, message)


def _as_mapping(raw: object) -> Mapping[str, object]:
    return raw if isinstance(raw, Mapping) else {}


def _require_state(state: RouteState | None, route_id: str) -> RouteState:
    if state is None:
        raise _not_found("route-not-found", f'Route "{route_id}" does not exist.')
    return state


def _require_segment(state: RouteState, segment_id: str) -> Tramo:
    segment = next((s for s in state.segments if s.id == segment_id), None)
    if segment is None:
        raise _not_found("segment-not-found", f'Segment "{segment_id}" does not exist.')
    return segment


def _require_city(cities: CityRepository, city_id: str) -> None:
    if cities.get(city_id) is None:
        raise _not_found("city-not-found", f'City or zone "{city_id}" does not exist.')


def _apply_order(
    segments: list[Tramo], ids: list[str], writes: dict[str, _SegmentWrite]
) -> list[Tramo]:
    """Applies the id order to the segments.

    Changed orders are merged into `writes`; the returned segments carry the new contiguous order.
    """
    for segment_id, order in order_updates(segments, ids).items():
        writes.setdefault(segment_id, _SegmentWrite("update")).data["order"] = order
    by_id = {segment.id: segment for segment in segments}
    return [replace(by_id[segment_id], order=order) for order, segment_id in enumerate(ids)]


def _preview_document(segments: list[Tramo]) -> list[dict[str, float]]:
    """The whole route as one light polyline (segments in route order) for the list."""
    ordered = sorted(segments, key=lambda segment: (segment.order, segment.id))
    shape = preview_polyline([point for segment in ordered for point in segment.coordinates])
    return [point.to_document() for point in shape]


def with_recalc(
    route_id: str,
    state: RouteState,
    writes: list[WriteOp],
    settings: SystemSettings,
    segment_writes: dict[str, _SegmentWrite] | None = None,
) -> list[WriteOp]:
    """`writes` followed by the recalculated safety of every segment (merged into its pending
    write) and of the route (RF-07-11). Risk factors and recent incidents (EP-08) penalize."""
    segment_writes = segment_writes or {}
    today = local_now(settings).date()
    evaluated = [
        TramoEvaluado(
            segment.id,
            segment.name,
            segment.order,
            CalculadoraIndiceSeguridad.segment_safety(
                settings,
                state.slots,
                state.factors.get(segment.id, []),
                incident_penalties(state.incidents, segment.id, today, settings),
            ),
        )
        for segment in state.segments
    ]
    ops = list(writes)
    for segment in evaluated:
        write = segment_writes.get(segment.id) or _SegmentWrite("update")
        safety = {slot_id: index.to_document() for slot_id, index in segment.safety.items()}
        ops.append(
            WriteOp(
                write.op,  # type: ignore[arg-type]
                _segment_path(route_id, segment.id),
                {**write.data, "safety": safety},
            )
        )
    route_safety = CalculadoraIndiceSeguridad.route_safety(settings, state.slots, evaluated)
    ops.append(
        WriteOp(
            "update",
            _route_path(route_id),
            {
                "safety": {slot_id: index.to_document() for slot_id, index in route_safety.items()},
                "safetyUpdatedAt": SERVER_TIMESTAMP,
                "segmentCount": len(evaluated),
                "preview": _preview_document(state.segments),
                "updatedAt": SERVER_TIMESTAMP,
            },
        )
    )
    return ops


def recalculate_route(route_id: str, routes: RouteRepository, settings: SystemSettings) -> None:
    """Rewrites the stored safety of one route with `settings` (nothing if it is gone)."""
    routes.mutate(
        route_id, lambda state: [] if state is None else with_recalc(route_id, state, [], settings)
    )


def recalculate_all_routes(routes: RouteRepository, settings: SystemSettings) -> int:
    """Rewrites the stored safety of every route with `settings`; returns how many routes."""
    route_ids = [route.id for route in routes.list()]
    for route_id in route_ids:
        recalculate_route(route_id, routes, settings)
    return len(route_ids)


# ---------- Reading ----------


def list_routes(city_id: object, can_manage: bool, routes: RouteRepository) -> list[Ruta]:
    """Routes sorted by name; inactive ones only for `routes.manage`."""
    found = routes.list(None if city_id is None else parse_city_id(city_id))
    visible = [route for route in found if route.active or can_manage]
    return sorted(visible, key=lambda route: (sort_key(route.name), route.id))


def get_route(raw_route_id: object, can_manage: bool, routes: RouteRepository) -> RouteDetail:
    route_id = parse_doc_id(raw_route_id, "invalid-route-id")
    route = routes.get(route_id)
    # An inactive route does not exist for who cannot manage routes.
    if route is None or not (route.active or can_manage):
        raise _not_found("route-not-found", f'Route "{route_id}" does not exist.')
    state = routes.state(route_id) or RouteState([], [], {})
    segments = sorted(state.segments, key=lambda segment: (segment.order, segment.id))
    if not can_manage:
        return RouteDetail(route, segments)
    slots = sorted(state.slots, key=lambda slot: (slot.start_time, slot.id))
    return RouteDetail(route, segments, slots, state.factors)


# ---------- Routes ----------


def create_route(raw: object, deps: RoutesDeps) -> str:
    route = Ruta.parse(raw, deps.routes.new_id(), deps.settings)
    _require_city(deps.cities, route.city_id)
    deps.routes.commit(
        [
            WriteOp(
                "set",
                _route_path(route.id),
                {
                    **route.to_document(),
                    "segmentCount": 0,
                    "preview": [],
                    "safety": {},
                    "safetyUpdatedAt": SERVER_TIMESTAMP,
                    "createdAt": SERVER_TIMESTAMP,
                    "updatedAt": SERVER_TIMESTAMP,
                },
            )
        ]
    )
    return route.id


def update_route(raw: object, deps: RoutesDeps) -> None:
    route_id = parse_doc_id(_as_mapping(raw).get("id"), "invalid-route-id")
    route = Ruta.parse(raw, route_id, deps.settings)
    _require_city(deps.cities, route.city_id)

    def plan(state: RouteState | None) -> list[WriteOp]:
        _require_state(state, route_id)
        data = {**route.to_document(), "updatedAt": SERVER_TIMESTAMP}
        return [WriteOp("update", _route_path(route_id), data)]

    deps.routes.mutate(route_id, plan)


def _image_path(route_id: str) -> str:
    return f"{_route_path(route_id)}/private/image"


def get_route_image(raw_route_id: object, can_manage: bool, routes: RouteRepository) -> str:
    """The data URL of the custom image; an inactive route has none for who cannot manage."""
    route_id = parse_doc_id(raw_route_id, "invalid-route-id")
    route = routes.get(route_id)
    image = routes.image(route_id) if route and (route.active or can_manage) else None
    if image is None:
        raise _not_found("route-image-not-found", f'Route "{route_id}" has no image.')
    return image


def set_route_image(raw: object, deps: RoutesDeps) -> None:
    """Stores the full image under the route and its thumbnail in the route document."""
    route_id = parse_doc_id(_as_mapping(raw).get("routeId"), "invalid-route-id")
    image = RouteImage.parse(raw)

    def plan(state: RouteState | None) -> list[WriteOp]:
        _require_state(state, route_id)
        stored = {**image.to_document(), "updatedAt": SERVER_TIMESTAMP}
        return [
            WriteOp("set", _image_path(route_id), stored),
            WriteOp(
                "update",
                _route_path(route_id),
                {"imageThumb": image.thumbnail, "updatedAt": SERVER_TIMESTAMP},
            ),
        ]

    deps.routes.mutate(route_id, plan)


def remove_route_image(raw: object, deps: RoutesDeps) -> None:
    """Idempotent: removing a missing image is not an error, a missing route is."""
    route_id = parse_doc_id(_as_mapping(raw).get("routeId"), "invalid-route-id")

    def plan(state: RouteState | None) -> list[WriteOp]:
        _require_state(state, route_id)
        return [
            WriteOp("delete", _image_path(route_id)),
            WriteOp(
                "update",
                _route_path(route_id),
                {"imageThumb": DELETE_FIELD, "updatedAt": SERVER_TIMESTAMP},
            ),
        ]

    deps.routes.mutate(route_id, plan)


def delete_route(raw: object, deps: RoutesDeps) -> None:
    """Cascades to segments, risk factors, time slots and the image."""
    route_id = parse_doc_id(_as_mapping(raw).get("id"), "invalid-route-id")
    if deps.routes.get(route_id) is None:
        raise _not_found("route-not-found", f'Route "{route_id}" does not exist.')
    deps.routes.delete_tree(route_id)


# ---------- Segments ----------


def create_segment(raw: object, deps: RoutesDeps) -> str:
    data = _as_mapping(raw)
    route_id = parse_doc_id(data.get("routeId"), "invalid-route-id")
    segment = TramoInput.parse(raw, deps.settings)
    segment_id = deps.routes.new_id()

    def plan(current: RouteState | None) -> list[WriteOp]:
        state = _require_state(current, route_id)
        max_segments = deps.settings.max_segments_per_route
        if len(state.segments) >= max_segments:
            raise _precondition(
                "too-many-segments", f"A route can have at most {max_segments} segments."
            )
        length_m = path_length_m(segment.coordinates)
        writes = {
            segment_id: _SegmentWrite(
                "set",
                {
                    "name": segment.name,
                    "coordinates": [point.to_document() for point in segment.coordinates],
                    "lengthM": length_m,
                    "createdAt": SERVER_TIMESTAMP,
                    "updatedAt": SERVER_TIMESTAMP,
                },
            )
        }
        record = Tramo(segment_id, segment.name, -1, segment.coordinates, length_m)
        ids = insert_at(ordered_ids(state.segments), segment_id, segment.order)
        segments = _apply_order([*state.segments, record], ids, writes)
        return with_recalc(route_id, replace(state, segments=segments), [], deps.settings, writes)

    deps.routes.mutate(route_id, plan)
    return segment_id


def update_segment(raw: object, deps: RoutesDeps) -> None:
    data = _as_mapping(raw)
    route_id = parse_doc_id(data.get("routeId"), "invalid-route-id")
    segment_id = parse_doc_id(data.get("segmentId"), "invalid-segment-id")
    input_ = TramoInput.parse(raw, deps.settings)

    def plan(current: RouteState | None) -> list[WriteOp]:
        state = _require_state(current, route_id)
        segment = _require_segment(state, segment_id)
        length_m = path_length_m(input_.coordinates)
        write = _SegmentWrite(
            "update",
            {
                "name": input_.name,
                "coordinates": [point.to_document() for point in input_.coordinates],
                "lengthM": length_m,
                "updatedAt": SERVER_TIMESTAMP,
            },
        )
        writes = {segment_id: write}
        current_ids = ordered_ids(state.segments)
        ids = (
            current_ids if input_.order is None else move_to(current_ids, segment_id, input_.order)
        )
        changed = replace(
            segment, name=input_.name, coordinates=input_.coordinates, length_m=length_m
        )
        updated = [changed if s.id == segment_id else s for s in state.segments]
        segments = _apply_order(updated, ids, writes)
        write.data["order"] = ids.index(segment_id)
        return with_recalc(route_id, replace(state, segments=segments), [], deps.settings, writes)

    deps.routes.mutate(route_id, plan)


def delete_segment(raw: object, deps: RoutesDeps) -> None:
    """Also deletes the segment's risk factors and closes the order gap."""
    data = _as_mapping(raw)
    route_id = parse_doc_id(data.get("routeId"), "invalid-route-id")
    segment_id = parse_doc_id(data.get("segmentId"), "invalid-segment-id")

    def plan(current: RouteState | None) -> list[WriteOp]:
        state = _require_state(current, route_id)
        _require_segment(state, segment_id)
        deletes = [
            WriteOp("delete", _factor_path(route_id, segment_id, factor.id))
            for factor in state.factors.get(segment_id, [])
        ]
        deletes.append(WriteOp("delete", _segment_path(route_id, segment_id)))
        writes: dict[str, _SegmentWrite] = {}
        remaining = [s for s in state.segments if s.id != segment_id]
        segments = _apply_order(
            remaining, remove_id(ordered_ids(state.segments), segment_id), writes
        )
        factors = {key: value for key, value in state.factors.items() if key != segment_id}
        return with_recalc(
            route_id,
            replace(state, segments=segments, factors=factors),
            deletes,
            deps.settings,
            writes,
        )

    deps.routes.mutate(route_id, plan)


# ---------- Time slots ----------


def _assert_no_overlap(
    slots: list[FranjaHoraria], candidate: FranjaHoraria, ignore_id: str | None = None
) -> None:
    window = to_window(candidate.start_time, candidate.end_time)
    for slot in slots:
        if slot.id != ignore_id and time_windows_overlap(
            window, to_window(slot.start_time, slot.end_time)
        ):
            name = slot.label or f"{slot.start_time}-{slot.end_time}"
            raise _precondition("time-slot-overlap", f"Overlaps the time slot {name}.")


def _require_slot(state: RouteState, slot_id: str) -> None:
    if not any(slot.id == slot_id for slot in state.slots):
        raise _not_found("time-slot-not-found", f'Time slot "{slot_id}" does not exist.')


def create_time_slot(raw: object, deps: RoutesDeps) -> str:
    route_id = parse_doc_id(_as_mapping(raw).get("routeId"), "invalid-route-id")
    slot = FranjaHoraria.parse(raw, deps.routes.new_id())

    def plan(current: RouteState | None) -> list[WriteOp]:
        state = _require_state(current, route_id)
        max_slots = deps.settings.max_time_slots_per_route
        if len(state.slots) >= max_slots:
            raise _precondition(
                "too-many-time-slots", f"A route can have at most {max_slots} time slots."
            )
        _assert_no_overlap(state.slots, slot)
        write = WriteOp(
            "set",
            _slot_path(route_id, slot.id),
            {**slot.to_document(), "createdAt": SERVER_TIMESTAMP, "updatedAt": SERVER_TIMESTAMP},
        )
        return with_recalc(
            route_id, replace(state, slots=[*state.slots, slot]), [write], deps.settings
        )

    deps.routes.mutate(route_id, plan)
    return slot.id


def update_time_slot(raw: object, deps: RoutesDeps) -> None:
    data = _as_mapping(raw)
    route_id = parse_doc_id(data.get("routeId"), "invalid-route-id")
    slot = FranjaHoraria.parse(raw, data.get("slotId"))

    def plan(current: RouteState | None) -> list[WriteOp]:
        state = _require_state(current, route_id)
        _require_slot(state, slot.id)
        _assert_no_overlap(state.slots, slot, slot.id)
        write = WriteOp(
            "update",
            _slot_path(route_id, slot.id),
            {
                "startTime": slot.start_time,
                "endTime": slot.end_time,
                "label": DELETE_FIELD if slot.label is None else slot.label,
                "validFrom": DELETE_FIELD if slot.valid_from is None else slot.valid_from,
                "validTo": DELETE_FIELD if slot.valid_to is None else slot.valid_to,
                "updatedAt": SERVER_TIMESTAMP,
            },
        )
        slots = [slot if s.id == slot.id else s for s in state.slots]
        return with_recalc(route_id, replace(state, slots=slots), [write], deps.settings)

    deps.routes.mutate(route_id, plan)


def delete_time_slot(raw: object, deps: RoutesDeps) -> None:
    data = _as_mapping(raw)
    route_id = parse_doc_id(data.get("routeId"), "invalid-route-id")
    slot_id = parse_doc_id(data.get("slotId"), "invalid-time-slot-id")

    def plan(current: RouteState | None) -> list[WriteOp]:
        state = _require_state(current, route_id)
        _require_slot(state, slot_id)
        slots = [s for s in state.slots if s.id != slot_id]
        delete = WriteOp("delete", _slot_path(route_id, slot_id))
        return with_recalc(route_id, replace(state, slots=slots), [delete], deps.settings)

    deps.routes.mutate(route_id, plan)


# ---------- Risk factors ----------


def _require_factor(state: RouteState, segment_id: str, factor_id: str) -> None:
    if not any(f.id == factor_id for f in state.factors.get(segment_id, [])):
        raise _not_found("risk-factor-not-found", f'Risk factor "{factor_id}" does not exist.')


def _factor_ids(raw: object) -> tuple[str, str]:
    data = _as_mapping(raw)
    return (
        parse_doc_id(data.get("routeId"), "invalid-route-id"),
        parse_doc_id(data.get("segmentId"), "invalid-segment-id"),
    )


def create_risk_factor(raw: object, deps: RoutesDeps) -> str:
    route_id, segment_id = _factor_ids(raw)
    factor = FactorDeRiesgo.parse(raw, deps.routes.new_id())

    def plan(current: RouteState | None) -> list[WriteOp]:
        state = _require_state(current, route_id)
        _require_segment(state, segment_id)
        existing = state.factors.get(segment_id, [])
        max_factors = deps.settings.max_risk_factors_per_segment
        if len(existing) >= max_factors:
            raise _precondition(
                "too-many-risk-factors",
                f"A segment can have at most {max_factors} risk factors.",
            )
        write = WriteOp(
            "set",
            _factor_path(route_id, segment_id, factor.id),
            {**factor.to_document(), "createdAt": SERVER_TIMESTAMP, "updatedAt": SERVER_TIMESTAMP},
        )
        factors = {**state.factors, segment_id: [*existing, factor]}
        return with_recalc(route_id, replace(state, factors=factors), [write], deps.settings)

    deps.routes.mutate(route_id, plan)
    return factor.id


def update_risk_factor(raw: object, deps: RoutesDeps) -> None:
    route_id, segment_id = _factor_ids(raw)
    factor = FactorDeRiesgo.parse(raw, _as_mapping(raw).get("factorId"))

    def plan(current: RouteState | None) -> list[WriteOp]:
        state = _require_state(current, route_id)
        _require_segment(state, segment_id)
        _require_factor(state, segment_id, factor.id)
        write = WriteOp(
            "update",
            _factor_path(route_id, segment_id, factor.id),
            {
                "type": factor.type,
                "severity": factor.severity,
                "description": factor.description,
                "startTime": DELETE_FIELD if factor.start_time is None else factor.start_time,
                "endTime": DELETE_FIELD if factor.end_time is None else factor.end_time,
                "updatedAt": SERVER_TIMESTAMP,
            },
        )
        updated = [factor if f.id == factor.id else f for f in state.factors[segment_id]]
        return with_recalc(
            route_id,
            replace(state, factors={**state.factors, segment_id: updated}),
            [write],
            deps.settings,
        )

    deps.routes.mutate(route_id, plan)


def delete_risk_factor(raw: object, deps: RoutesDeps) -> None:
    route_id, segment_id = _factor_ids(raw)
    factor_id = parse_doc_id(_as_mapping(raw).get("factorId"), "invalid-risk-factor-id")

    def plan(current: RouteState | None) -> list[WriteOp]:
        state = _require_state(current, route_id)
        _require_segment(state, segment_id)
        _require_factor(state, segment_id, factor_id)
        remaining = [f for f in state.factors[segment_id] if f.id != factor_id]
        delete = WriteOp("delete", _factor_path(route_id, segment_id, factor_id))
        return with_recalc(
            route_id,
            replace(state, factors={**state.factors, segment_id: remaining}),
            [delete],
            deps.settings,
        )

    deps.routes.mutate(route_id, plan)
