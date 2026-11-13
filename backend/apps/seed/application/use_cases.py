"""Seeds the local Firebase emulators with the minimum data for development: the pilot city,
the system roles, an admin account and sample routes with segments, time slots, risk factors
and the safety index. Every step is idempotent, so running it again leaves the same data."""

import math
from collections.abc import Callable
from dataclasses import dataclass

from apps.cities.application.ports import CityRepository
from apps.cities.domain.models import Ciudad
from apps.roles.application.ports import RoleRepository
from apps.roles.domain.system_roles import SYSTEM_ROLES
from apps.routes.application.ports import SERVER_TIMESTAMP, RouteRepository, WriteOp
from apps.routes.domain.geo import path_length_m
from apps.routes.domain.models import FactorDeRiesgo, FranjaHoraria, Ruta, TramoInput
from apps.routes.domain.safety import CalculadoraIndiceSeguridad, TramoEvaluado
from apps.seed.application.ports import SeedAccounts
from apps.seed.domain import data
from apps.shared.application.ports import AuthGateway
from apps.shared.domain.permissions import ADMIN_ROLE, ALL_PERMISSIONS

_LEVEL_LABELS = {"high": "Alto", "medium": "Medio", "low": "Bajo"}


@dataclass(frozen=True, slots=True)
class SeedDeps:
    cities: CityRepository
    roles: RoleRepository
    auth: AuthGateway
    accounts: SeedAccounts
    routes: RouteRepository


def run_seed(deps: SeedDeps, report: Callable[[str], None]) -> None:
    _seed_city(deps.cities, report)
    _seed_roles(deps.roles, report)
    _seed_admin(deps, report)
    _seed_routes(deps.routes, report)


def _seed_city(cities: CityRepository, report: Callable[[str], None]) -> None:
    city = Ciudad.parse(data.CITY)
    if not cities.create(city):
        cities.update(city)
    report(f"City seeded: cities/{city.id}")


def _seed_roles(roles: RoleRepository, report: Callable[[str], None]) -> None:
    """`create` stamps `createdAt` once; a re-run only updates the role."""
    for role in SYSTEM_ROLES:
        if not roles.create(role):
            roles.update(role)
    report(f"Roles seeded: {', '.join(role.id for role in SYSTEM_ROLES)}")


def _seed_admin(deps: SeedDeps, report: Callable[[str], None]) -> None:
    uid = deps.accounts.ensure_admin_account(
        data.ADMIN_EMAIL, data.ADMIN_PASSWORD, data.ADMIN_DISPLAY_NAME
    )
    deps.auth.set_custom_claims(uid, {"role": ADMIN_ROLE, "perms": list(ALL_PERMISSIONS)})
    deps.accounts.save_admin_profile(
        uid,
        {
            "uid": uid,
            "email": data.ADMIN_EMAIL,
            "firstName": data.ADMIN_FIRST_NAME,
            "lastName": data.ADMIN_LAST_NAME,
            "cityId": data.CITY_ID,
            "role": ADMIN_ROLE,
        },
    )
    report(f"Admin seeded: {data.ADMIN_EMAIL} (uid {uid})")


def _seed_routes(routes: RouteRepository, report: Callable[[str], None]) -> None:
    """Rewrites each sample route from scratch under its fixed id: route, segments, time slots
    and risk factors, with lengths and the safety index computed like the endpoints do."""
    for spec in data.SEED_ROUTES:
        # Drops the segments or factors left by an older version of the seed.
        routes.delete_tree(spec.id)
        ops, summary = _route_writes(spec)
        routes.commit(ops)
        report(f"Route seeded: routes/{spec.id} — {summary}")


def _timestamps() -> dict[str, object]:
    return {"createdAt": SERVER_TIMESTAMP, "updatedAt": SERVER_TIMESTAMP}


def _route_writes(spec: data.SeedRoute) -> tuple[list[WriteOp], str]:
    base = f"routes/{spec.id}"
    slots = [FranjaHoraria.parse(raw, raw["id"]) for raw in data.SEED_SLOTS]

    evaluated: list[TramoEvaluado] = []
    lengths: list[int] = []
    ops: list[WriteOp] = []
    for order, segment in enumerate(spec.segments):
        segment_id = f"seg-{order + 1}"
        coordinates = TramoInput.parse(
            {"name": segment.name, "coordinates": segment.coordinates}
        ).coordinates
        factors = [
            FactorDeRiesgo.parse(raw, f"factor-{number}")
            for number, raw in enumerate(segment.factors, start=1)
        ]
        length_m = path_length_m(coordinates)
        safety = CalculadoraIndiceSeguridad.segment_safety(slots, factors)
        evaluated.append(TramoEvaluado(segment_id, segment.name, order, safety))
        lengths.append(length_m)
        ops.append(
            WriteOp(
                "set",
                f"{base}/segments/{segment_id}",
                {
                    "name": segment.name,
                    "order": order,
                    "coordinates": [point.to_document() for point in coordinates],
                    "lengthM": length_m,
                    "safety": {slot_id: index.to_document() for slot_id, index in safety.items()},
                    **_timestamps(),
                },
            )
        )
        ops.extend(
            WriteOp(
                "set",
                f"{base}/segments/{segment_id}/riskFactors/{factor.id}",
                {**factor.to_document(), **_timestamps()},
            )
            for factor in factors
        )
    ops.extend(
        WriteOp("set", f"{base}/timeSlots/{slot.id}", {**slot.to_document(), **_timestamps()})
        for slot in slots
    )

    route_safety = CalculadoraIndiceSeguridad.route_safety(slots, evaluated)
    # Round half up like the TypeScript seed did, not half to even.
    distance_km = math.floor(sum(lengths) / 1000 * spec.repeats * 10 + 0.5) / 10
    route = Ruta.parse(
        {
            "name": spec.name,
            "cityId": data.CITY_ID,
            "description": spec.description,
            "start": spec.start,
            "end": spec.end,
            "distanceKm": distance_km,
            "elevationGainM": spec.elevation_gain_m,
            "surface": spec.surface,
            "difficulty": spec.difficulty,
            "active": True,
        },
        spec.id,
    )
    route_op = WriteOp(
        "set",
        base,
        {
            **route.to_document(),
            "segmentCount": len(evaluated),
            "safety": {slot_id: index.to_document() for slot_id, index in route_safety.items()},
            "safetyUpdatedAt": SERVER_TIMESTAMP,
            **_timestamps(),
        },
    )

    summary = ", ".join(
        f"{slot.start_time}–{slot.end_time} "
        f"{_LEVEL_LABELS[route_safety[slot.id].level]} ({route_safety[slot.id].score})"
        for slot in slots
    )
    return [route_op, *ops], f"{spec.name}, {distance_km} km — {summary}"
