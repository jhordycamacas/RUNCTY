"""Seeds the local Firebase emulators with the minimum data for development: the pilot city,
the system roles, an admin account, sample routes with segments, time slots, risk factors,
incidents and the safety index, and the sources, support points, guarded trails and risk zone
alerts of Sprint 3, the system settings and the option catalogs (each only when absent: an
admin's edits stay).
Every step is idempotent, so running it again the same day leaves the same data (incident and
alert dates are relative to the day it runs)."""

import math
from collections.abc import Callable
from dataclasses import dataclass
from datetime import date, datetime, timedelta

from apps.catalogs.application.ports import CatalogRepository
from apps.catalogs.application.use_cases import ensure_default_catalogs
from apps.catalogs.domain.models import CATALOG_IDS
from apps.cities.application.ports import CityRepository
from apps.cities.domain.models import Ciudad
from apps.risk_alerts.application.ports import RiskZoneAlertRepository
from apps.risk_alerts.domain.models import AlertaZonaRiesgo
from apps.roles.application.ports import RoleRepository
from apps.roles.domain.system_roles import SYSTEM_ROLES
from apps.routes.application.ports import SERVER_TIMESTAMP, RouteRepository, WriteOp
from apps.routes.domain.geo import path_length_m
from apps.routes.domain.models import FactorDeRiesgo, FranjaHoraria, Ruta, TramoInput
from apps.routes.domain.safety import CalculadoraIndiceSeguridad, TramoEvaluado
from apps.routes.domain.time import local_now
from apps.safety_data.application.ports import SourceRepository
from apps.safety_data.domain.models import (
    FuenteInformacion,
    IncidenteSeguridad,
    incident_penalties,
)
from apps.seed.application.ports import SeedAccounts
from apps.seed.domain import data
from apps.shared.application.ports import AuthGateway
from apps.shared.domain.permissions import ADMIN_ROLE, ALL_PERMISSIONS
from apps.support_points.application.ports import GuardedTrailRepository, SupportPointRepository
from apps.support_points.domain.models import PuntoApoyo, ResguardoPolicial
from apps.system_settings.application.ports import SettingsRepository
from apps.system_settings.domain.models import SystemSettings

_LEVEL_LABELS = {"high": "Alto", "medium": "Medio", "low": "Bajo"}


@dataclass(frozen=True, slots=True)
class SeedDeps:
    cities: CityRepository
    roles: RoleRepository
    auth: AuthGateway
    accounts: SeedAccounts
    routes: RouteRepository
    sources: SourceRepository
    support_points: SupportPointRepository
    guarded_trails: GuardedTrailRepository
    alerts: RiskZoneAlertRepository
    settings: SettingsRepository
    catalogs: CatalogRepository


def run_seed(deps: SeedDeps, report: Callable[[str], None]) -> None:
    settings = _seed_settings(deps.settings, report)
    _seed_catalogs(deps.catalogs, report)
    now = local_now(settings)
    _seed_city(deps.cities, settings, report)
    _seed_roles(deps.roles, report)
    _seed_admin(deps, report)
    _seed_sources(deps.sources, now.date(), report)
    _seed_routes(deps.routes, now, settings, report)
    _seed_support_points(deps, report)
    _seed_alerts(deps.alerts, now.date(), settings, report)


def _seed_settings(repository: SettingsRepository, report: Callable[[str], None]) -> SystemSettings:
    """Saves the defaults once; later runs keep what an admin changed. Returns the ones in force."""
    stored = repository.get()
    if stored is not None:
        report("System settings kept: systemSettings/global")
        return stored
    defaults = SystemSettings.defaults()
    repository.save(defaults)
    report("System settings seeded: systemSettings/global")
    return defaults


def _seed_catalogs(catalogs: CatalogRepository, report: Callable[[str], None]) -> None:
    """Saves the default catalogs that are absent; later runs keep what an admin changed."""
    seeded = ensure_default_catalogs(catalogs)
    kept = [catalog_id for catalog_id in CATALOG_IDS if catalog_id not in seeded]
    if seeded:
        report(f"Catalogs seeded: {', '.join(seeded)}")
    if kept:
        report(f"Catalogs kept: {', '.join(kept)}")


def _seed_city(
    cities: CityRepository, settings: SystemSettings, report: Callable[[str], None]
) -> None:
    city = Ciudad.parse(data.CITY, settings.country_code)
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


def _seed_sources(sources: SourceRepository, today: date, report: Callable[[str], None]) -> None:
    for raw in data.SEED_SOURCES:
        sources.save(FuenteInformacion.parse(raw, raw["id"], today))
    report(f"Sources seeded: {', '.join(raw['id'] for raw in data.SEED_SOURCES)}")


def _seed_routes(
    routes: RouteRepository,
    now: datetime,
    settings: SystemSettings,
    report: Callable[[str], None],
) -> None:
    """Rewrites each sample route from scratch under its fixed id: route, segments, time slots,
    risk factors and incidents, with lengths and the safety index computed like the endpoints
    do."""
    for spec in data.SEED_ROUTES:
        # Drops the segments or factors left by an older version of the seed.
        routes.delete_tree(spec.id)
        incidents = _seed_incidents(spec.id, now, settings)
        ops, summary = _route_writes(spec, incidents, now.date(), settings)
        routes.commit(ops)
        report(f"Route seeded: routes/{spec.id} — {summary}")


def _seed_incidents(
    route_id: str, now: datetime, settings: SystemSettings
) -> list[IncidenteSeguridad]:
    return [
        IncidenteSeguridad.parse(
            {
                "routeId": incident.route_id,
                "segmentId": incident.segment_id,
                "type": incident.type,
                "severity": incident.severity,
                "date": (now.date() - timedelta(days=incident.days_ago)).isoformat(),
                "time": incident.time,
                "sourceId": incident.source_id,
            },
            incident.id,
            now,
        )
        for incident in data.SEED_INCIDENTS
        if incident.route_id == route_id
    ]


def _seed_support_points(deps: SeedDeps, report: Callable[[str], None]) -> None:
    for raw in data.SEED_SUPPORT_POINTS:
        deps.support_points.save(PuntoApoyo.parse(raw, raw["id"]))
    for raw in data.SEED_GUARDED_TRAILS:
        deps.guarded_trails.save(ResguardoPolicial.parse(raw, raw["id"]))
    report(
        f"Support points seeded: {len(data.SEED_SUPPORT_POINTS)}; "
        f"guarded trails: {len(data.SEED_GUARDED_TRAILS)}"
    )


def _seed_alerts(
    alerts: RiskZoneAlertRepository,
    today: date,
    settings: SystemSettings,
    report: Callable[[str], None],
) -> None:
    """Alerts in force from a few days ago to some days ahead, so the runner sees them."""
    for alert in data.SEED_ALERTS:
        valid = {
            "validFrom": (today - timedelta(days=alert.days_before)).isoformat(),
            "validTo": (today + timedelta(days=alert.days_after)).isoformat(),
        }
        alerts.save(AlertaZonaRiesgo.parse({**alert.body, **valid}, alert.id, settings))
    report(f"Risk zone alerts seeded: {', '.join(alert.id for alert in data.SEED_ALERTS)}")


def _timestamps() -> dict[str, object]:
    return {"createdAt": SERVER_TIMESTAMP, "updatedAt": SERVER_TIMESTAMP}


def _route_writes(
    spec: data.SeedRoute, incidents: list[IncidenteSeguridad], today: date, settings: SystemSettings
) -> tuple[list[WriteOp], str]:
    base = f"routes/{spec.id}"
    slots = [FranjaHoraria.parse(raw, raw["id"]) for raw in data.SEED_SLOTS]

    evaluated: list[TramoEvaluado] = []
    lengths: list[int] = []
    ops: list[WriteOp] = []
    for order, segment in enumerate(spec.segments):
        segment_id = f"seg-{order + 1}"
        coordinates = TramoInput.parse(
            {"name": segment.name, "coordinates": segment.coordinates}, settings
        ).coordinates
        factors = [
            FactorDeRiesgo.parse(raw, f"factor-{number}")
            for number, raw in enumerate(segment.factors, start=1)
        ]
        length_m = path_length_m(coordinates)
        safety = CalculadoraIndiceSeguridad.segment_safety(
            settings, slots, factors, incident_penalties(incidents, segment_id, today, settings)
        )
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
    ops.extend(
        WriteOp(
            "set", f"safetyIncidents/{incident.id}", {**incident.to_document(), **_timestamps()}
        )
        for incident in incidents
    )

    route_safety = CalculadoraIndiceSeguridad.route_safety(settings, slots, evaluated)
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
        settings,
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
