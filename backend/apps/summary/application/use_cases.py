from dataclasses import dataclass
from datetime import datetime

from apps.cities.application.ports import CityRepository
from apps.shared.domain.models import Principal
from apps.summary.application.ports import SummarySource
from apps.summary.domain.metrics import (
    LATEST_USERS,
    UserRecord,
    cities_summary,
    city_comparison,
    latest_registrations,
    routes_summary,
    safety_summary,
    users_summary,
)
from apps.system_settings.application.ports import SettingsRepository
from apps.system_settings.application.use_cases import get_settings

# Bounded scans: past these caps the figures are a lower bound and `truncated` says so.
MAX_SCAN = 5000
MAX_ROUTES = 2000


@dataclass(frozen=True, slots=True)
class SummaryDeps:
    source: SummarySource
    cities: CityRepository
    settings: SettingsRepository


def _bounded(read, limit: int):
    """`read(limit + 1)` trimmed to `limit`, and whether the cap was reached."""
    records = read(limit + 1)
    return records[:limit], len(records) > limit


def get_summary(principal: Principal, deps: SummaryDeps, now: datetime) -> dict[str, object]:
    """The blocks of the summary the caller may see; the others are `None`."""
    truncated = False
    users = routes = cities = by_city = safety = None
    zone = get_settings(deps.settings).zone()
    records: list[UserRecord] = []
    can_see_cities = principal.has_permission("cities.manage")
    can_see_routes = principal.has_permission("routes.manage")
    catalogue = deps.cities.list() if can_see_cities or can_see_routes else []
    if principal.has_permission("users.read"):
        records, cut_users = _bounded(deps.source.users, MAX_SCAN)
        private, cut_private = _bounded(deps.source.private_documents, MAX_SCAN)
        users = users_summary(records, private, now, zone)
        users["latest"] = latest_registrations(deps.source.latest_users(LATEST_USERS))
        truncated = truncated or cut_users or cut_private
    if can_see_routes:
        route_list, cut_routes = _bounded(deps.source.routes, MAX_ROUTES)
        factors, cut_factors = _bounded(deps.source.risk_factor_severities, MAX_SCAN)
        names = {city.id: city.name for city in catalogue}
        routes = routes_summary(route_list, names, deps.source.time_slot_count(), factors)
        if users is not None:  # needs both blocks: users per city come from the users scan
            by_city = city_comparison(route_list, records, names)
        alerts, cut_alerts = _bounded(deps.source.risk_zone_alerts, MAX_SCAN)
        incident_dates, cut_incidents = _bounded(deps.source.incident_dates, MAX_SCAN)
        safety = safety_summary(alerts, incident_dates, now, zone)
        truncated = truncated or cut_routes or cut_factors or cut_alerts or cut_incidents
    if can_see_cities:
        cities = cities_summary(catalogue)
    return {
        "generatedAt": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "truncated": truncated,
        "users": users,
        "routes": routes,
        "cities": cities,
        "byCity": by_city,
        "safety": safety,
    }
