"""Pure aggregation of the admin summary. Everything here returns counts, never personal data.

The functions return the response shape (camelCase) because that shape is the whole contract of
the summary; see `specs/transversal/panel-de-administracion.md`.
"""

from collections import Counter
from collections.abc import Iterable, Mapping, Sequence
from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone

from apps.cities.domain.models import Ciudad
from apps.routes.domain.models import Ruta
from apps.routes.domain.safety import SEVERITIES
from apps.users.domain.models import APPEARANCES, UNIT_SYSTEMS, PreferenciaUsuario

WEEKS = 8
LONGEST_ROUTES = 8
_LEVELS_WORST_FIRST = ("low", "medium", "high")
_SPORT_PROFILE = "sportProfile"
_PREFERENCES = "preferences"
_UNSPECIFIED = "Sin definir"


@dataclass(frozen=True, slots=True)
class UserRecord:
    """The only two facts the summary reads of an account."""

    role: str | None
    created_at: datetime | None


def week_start(day: date) -> date:
    """The Monday of the week of `day`."""
    return day - timedelta(days=day.weekday())


def _utc(moment: datetime) -> datetime:
    return (
        moment.replace(tzinfo=timezone.utc)
        if moment.tzinfo is None
        else moment.astimezone(timezone.utc)
    )


def registrations_by_week(created: Iterable[datetime], now: datetime) -> list[dict[str, object]]:
    """The last `WEEKS` weeks (UTC, Monday to Sunday), oldest first, with their sign-ups."""
    current = week_start(_utc(now).date())
    starts = [current - timedelta(weeks=offset) for offset in range(WEEKS - 1, -1, -1)]
    counts = Counter(week_start(_utc(moment).date()) for moment in created)
    return [{"weekStart": start.isoformat(), "count": counts.get(start, 0)} for start in starts]


def _count_in(values: Iterable[str], keys: Sequence[str]) -> dict[str, int]:
    counts = Counter(values)
    return {key: counts.get(key, 0) for key in keys}


def _count_by_text(values: Iterable[str]) -> dict[str, int]:
    """Counts per stored text, most frequent first; a blank value counts as `Sin definir`."""
    counts = Counter(value or _UNSPECIFIED for value in values)
    return dict(sorted(counts.items(), key=lambda item: (-item[1], item[0].casefold())))


def users_summary(
    users: Sequence[UserRecord],
    private_documents: Sequence[tuple[str, Mapping[str, object]]],
    now: datetime,
) -> dict[str, object]:
    created = [_utc(user.created_at) for user in users if user.created_at is not None]
    now_utc = _utc(now)
    total = len(users)
    profiles = sum(1 for document_id, _ in private_documents if document_id == _SPORT_PROFILE)
    preferences = [
        PreferenciaUsuario.from_document(data)
        for document_id, data in private_documents
        if document_id == _PREFERENCES
    ]
    return {
        "total": total,
        "byRole": dict(Counter(user.role or "none" for user in users)),
        "registeredLast7Days": sum(
            1 for moment in created if now_utc - moment <= timedelta(days=7)
        ),
        "registeredLast30Days": sum(
            1 for moment in created if now_utc - moment <= timedelta(days=30)
        ),
        "registrationsByWeek": registrations_by_week(created, now_utc),
        "sportProfiles": {
            "completed": profiles,
            "percentage": round(profiles * 100 / total) if total else 0,
        },
        "preferences": {
            "saved": len(preferences),
            "appearance": _count_in((p.appearance for p in preferences), APPEARANCES),
            "units": _count_in((p.units for p in preferences), UNIT_SYSTEMS),
            "notificationsEnabled": sum(1 for p in preferences if p.notifications.enabled),
        },
    }


def _worst_level(route: Ruta) -> str:
    """The lowest stored level of the route across its time slots, or `unrated`."""
    levels = {
        index.get("level")
        for index in route.safety.values()
        if isinstance(index, Mapping) and index.get("level") in _LEVELS_WORST_FIRST
    }
    return next((level for level in _LEVELS_WORST_FIRST if level in levels), "unrated")


def routes_summary(
    routes: Sequence[Ruta],
    city_names: Mapping[str, str],
    time_slot_count: int,
    risk_factor_severities: Sequence[str],
) -> dict[str, object]:
    per_city = Counter(route.city_id for route in routes)
    by_city = [
        {"cityId": city_id, "cityName": city_names.get(city_id, city_id), "count": count}
        for city_id, count in per_city.items()
    ]
    by_city.sort(key=lambda item: (-item["count"], item["cityName"].casefold()))
    levels = _count_in((_worst_level(route) for route in routes), (*_LEVELS_WORST_FIRST, "unrated"))
    active = sum(1 for route in routes if route.active)
    return {
        "total": len(routes),
        "active": active,
        "inactive": len(routes) - active,
        "totalKm": round(sum(route.distance_km for route in routes), 1),
        "byDifficulty": _count_by_text(route.difficulty for route in routes),
        "bySurface": _count_by_text(route.surface for route in routes),
        "byCity": by_city,
        "safetyLevels": {level: levels[level] for level in ("high", "medium", "low", "unrated")},
        "distances": [
            {"name": route.name, "distanceKm": route.distance_km}
            for route in sorted(routes, key=lambda r: (-r.distance_km, r.name.casefold()))[
                :LONGEST_ROUTES
            ]
        ],
        "timeSlots": time_slot_count,
        "riskFactors": {
            "total": len(risk_factor_severities),
            "bySeverity": _count_in(risk_factor_severities, SEVERITIES),
        },
    }


def cities_summary(cities: Sequence[Ciudad]) -> dict[str, int]:
    zones = sum(1 for city in cities if city.type == "zone")
    return {"cities": len(cities) - zones, "zones": zones}
