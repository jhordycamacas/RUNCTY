"""Pure aggregation of the admin summary. Everything here returns counts, never personal data.

The functions return the response shape (camelCase) because that shape is the whole contract of
the summary; see `specs/transversal/panel-de-administracion.md`.
"""

from collections import Counter
from collections.abc import Iterable, Mapping, Sequence
from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone, tzinfo

from apps.cities.domain.models import Ciudad
from apps.risk_alerts.domain.models import AlertaZonaRiesgo
from apps.routes.domain.models import Ruta
from apps.routes.domain.safety import SEVERITIES
from apps.routes.domain.time import is_iso_date
from apps.users.domain.models import APPEARANCES, UNIT_SYSTEMS, PreferenciaUsuario

DAILY_BUCKETS = 30
WEEKLY_BUCKETS = 12
MONTHLY_BUCKETS = 12
LATEST_USERS = 5
INCIDENT_DAYS = 30
LONGEST_ROUTES = 8
CITIES_COMPARED = 8
_LEVELS_WORST_FIRST = ("low", "medium", "high")
_SPORT_PROFILE = "sportProfile"
_PREFERENCES = "preferences"
_UNSPECIFIED = "Sin definir"


@dataclass(frozen=True, slots=True)
class UserRecord:
    """The only facts the summary reads of an account: no name, email or id."""

    role: str | None
    created_at: datetime | None
    city_id: str | None = None


def week_start(day: date) -> date:
    """The Monday of the week of `day`."""
    return day - timedelta(days=day.weekday())


def _utc(moment: datetime) -> datetime:
    return (
        moment.replace(tzinfo=timezone.utc)
        if moment.tzinfo is None
        else moment.astimezone(timezone.utc)
    )


def _month_start(day: date) -> date:
    return day.replace(day=1)


def _months_back(day: date, months: int) -> date:
    """The first of the month `months` before the month of `day`."""
    index = day.year * 12 + day.month - 1 - months
    return date(index // 12, index % 12 + 1, 1)


# Each range: (name, buckets, bucket start of a day, the start `back` buckets before `today`).
_RANGES = (
    ("daily", DAILY_BUCKETS, lambda day: day, lambda today, back: today - timedelta(days=back)),
    (
        "weekly",
        WEEKLY_BUCKETS,
        week_start,
        lambda today, back: week_start(today) - timedelta(weeks=back),
    ),
    ("monthly", MONTHLY_BUCKETS, _month_start, lambda today, back: _months_back(today, back)),
)


def signups(created: Iterable[datetime], now: datetime, zone: tzinfo) -> dict[str, object]:
    """New accounts per day (30), week (12, Monday first) and month (12) in the local `zone`.

    Each series is oldest first and ends with the current bucket; `start` is the ISO date of
    the bucket start. `before` counts the accounts registered before the first bucket of each
    range, so a client can show the accumulated total. Accounts created after `now` are in no
    bucket and not in `before`.
    """
    days = [_utc(moment).astimezone(zone).date() for moment in created]
    today = _utc(now).astimezone(zone).date()
    result: dict[str, object] = {}
    before: dict[str, int] = {}
    for name, buckets, start_of, nth_start in _RANGES:
        starts = [nth_start(today, back) for back in range(buckets - 1, -1, -1)]
        per_bucket = Counter(start_of(day) for day in days)
        result[name] = [{"start": s.isoformat(), "count": per_bucket.get(s, 0)} for s in starts]
        before[name] = sum(1 for day in days if start_of(day) < starts[0])
    result["before"] = before
    return result


@dataclass(frozen=True, slots=True)
class LatestUser:
    """What the newest-accounts list shows: a name, a city and a date. No email or id number."""

    uid: str
    first_name: str
    last_name: str
    city_id: str | None
    created_at: datetime


def latest_registrations(users: Iterable[LatestUser]) -> list[dict[str, object]]:
    """The newest accounts first, at most `LATEST_USERS`."""
    newest = sorted(users, key=lambda user: (_utc(user.created_at), user.uid), reverse=True)
    return [
        {
            "uid": user.uid,
            "firstName": user.first_name,
            "lastName": user.last_name,
            "cityId": user.city_id,
            "createdAt": _utc(user.created_at).strftime("%Y-%m-%dT%H:%M:%SZ"),
        }
        for user in newest[:LATEST_USERS]
    ]


def safety_summary(
    alerts: Iterable[AlertaZonaRiesgo],
    incident_dates: Iterable[str],
    now: datetime,
    zone: tzinfo,
) -> dict[str, int]:
    """Risk zone alerts in force at `now` and incidents dated in the last 30 local days."""
    local = _utc(now).astimezone(zone)
    first_day = (local.date() - timedelta(days=INCIDENT_DAYS - 1)).isoformat()
    last_day = local.date().isoformat()
    return {
        "activeAlerts": sum(1 for alert in alerts if alert.is_active(local)),
        "incidentsLast30Days": sum(
            1 for day in incident_dates if is_iso_date(day) and first_day <= day <= last_day
        ),
    }


def _count_in(values: Iterable[str], keys: Sequence[str]) -> dict[str, int]:
    counts = Counter(values)
    return {key: counts.get(key, 0) for key in keys}


def _count_by_text(values: Iterable[str]) -> dict[str, int]:
    """Counts per stored text, most frequent first; a blank value counts as `Sin definir`."""
    counts = Counter(value or _UNSPECIFIED for value in values)
    return dict(sorted(counts.items(), key=lambda item: (-item[1], item[0].casefold())))


def _users_by_sport_level(
    private_documents: Sequence[tuple[str, Mapping[str, object]]],
) -> list[dict[str, object]]:
    """Profiles per stored level code, most common first; a profile with no level is left out."""
    levels = Counter(
        data["level"]
        for document_id, data in private_documents
        if document_id == _SPORT_PROFILE and isinstance(data.get("level"), str) and data["level"]
    )
    ordered = sorted(levels.items(), key=lambda item: (-item[1], item[0]))
    return [{"level": level, "users": count} for level, count in ordered]


def users_summary(
    users: Sequence[UserRecord],
    private_documents: Sequence[tuple[str, Mapping[str, object]]],
    now: datetime,
    zone: tzinfo,
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
        "signups": signups(created, now_utc, zone),
        "sportProfiles": {
            "completed": profiles,
            "percentage": round(profiles * 100 / total) if total else 0,
        },
        "bySportLevel": _users_by_sport_level(private_documents),
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
    zones = sum(1 for city in cities if city.parent_city_id is not None)
    return {"cities": len(cities) - zones, "zones": zones}


def city_comparison(
    routes: Sequence[Ruta], users: Sequence[UserRecord], city_names: Mapping[str, str]
) -> list[dict[str, object]]:
    """Routes and users per city, for the cities with the most users first (at most 8).

    Users without a city are left out; a city with routes and no users (or the reverse) shows 0.
    """
    route_counts = Counter(route.city_id for route in routes if route.city_id)
    user_counts = Counter(user.city_id for user in users if user.city_id)
    rows = [
        {
            "cityId": city_id,
            "name": city_names.get(city_id, city_id),
            "routes": route_counts.get(city_id, 0),
            "users": user_counts.get(city_id, 0),
        }
        for city_id in route_counts.keys() | user_counts.keys()
    ]
    rows.sort(key=lambda row: (-row["users"], -row["routes"], row["name"].casefold()))
    return rows[:CITIES_COMPARED]
