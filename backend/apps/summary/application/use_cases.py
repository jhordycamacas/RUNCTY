from dataclasses import dataclass
from datetime import datetime

from apps.cities.application.ports import CityRepository
from apps.shared.domain.models import Principal
from apps.summary.application.ports import SummarySource
from apps.summary.domain.metrics import cities_summary, routes_summary, users_summary

# Bounded scans: past these caps the figures are a lower bound and `truncated` says so.
MAX_SCAN = 5000
MAX_ROUTES = 2000


@dataclass(frozen=True, slots=True)
class SummaryDeps:
    source: SummarySource
    cities: CityRepository


def _bounded(read, limit: int):
    """`read(limit + 1)` trimmed to `limit`, and whether the cap was reached."""
    records = read(limit + 1)
    return records[:limit], len(records) > limit


def get_summary(principal: Principal, deps: SummaryDeps, now: datetime) -> dict[str, object]:
    """The blocks of the summary the caller may see; the others are `None`."""
    truncated = False
    users = routes = cities = None
    can_see_cities = principal.has_permission("cities.manage")
    can_see_routes = principal.has_permission("routes.manage")
    catalogue = deps.cities.list() if can_see_cities or can_see_routes else []
    if principal.has_permission("users.read"):
        records, cut_users = _bounded(deps.source.users, MAX_SCAN)
        private, cut_private = _bounded(deps.source.private_documents, MAX_SCAN)
        users = users_summary(records, private, now)
        truncated = truncated or cut_users or cut_private
    if can_see_routes:
        route_list, cut_routes = _bounded(deps.source.routes, MAX_ROUTES)
        factors, cut_factors = _bounded(deps.source.risk_factor_severities, MAX_SCAN)
        names = {city.id: city.name for city in catalogue}
        routes = routes_summary(route_list, names, deps.source.time_slot_count(), factors)
        truncated = truncated or cut_routes or cut_factors
    if can_see_cities:
        cities = cities_summary(catalogue)
    return {
        "generatedAt": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "truncated": truncated,
        "users": users,
        "routes": routes,
        "cities": cities,
    }
