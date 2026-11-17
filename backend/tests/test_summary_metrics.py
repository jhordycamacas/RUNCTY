from datetime import date, datetime, timezone

from apps.cities.domain.models import Ciudad
from apps.routes.domain.models import PuntoRuta, Ruta
from apps.summary.domain.metrics import (
    UserRecord,
    cities_summary,
    registrations_by_week,
    routes_summary,
    users_summary,
    week_start,
)

NOW = datetime(2026, 11, 17, 15, 0, tzinfo=timezone.utc)  # a Tuesday
POINT = PuntoRuta(-3.99, -79.2, "A")


def route(
    route_id,
    *,
    city="loja",
    km=10.0,
    surface="asphalt",
    difficulty="beginner",
    active=True,
    safety=None,
) -> Ruta:
    return Ruta(
        id=route_id,
        name=route_id,
        city_id=city,
        description="",
        start=POINT,
        end=POINT,
        distance_km=km,
        elevation_gain_m=0,
        surface=surface,
        difficulty=difficulty,
        active=active,
        safety=safety or {},
    )


def days_ago(days: float) -> datetime:
    return datetime.fromtimestamp(NOW.timestamp() - days * 86400, tz=timezone.utc)


class TestWeeks:
    def test_a_week_starts_on_monday(self):
        assert week_start(date(2026, 11, 17)) == date(2026, 11, 16)
        assert week_start(date(2026, 11, 22)) == date(2026, 11, 16)
        assert week_start(date(2026, 11, 16)) == date(2026, 11, 16)

    def test_there_are_eight_weeks_oldest_first_ending_with_the_current_one(self):
        weeks = registrations_by_week([], NOW)

        assert len(weeks) == 8
        assert weeks[0] == {"weekStart": "2026-09-28", "count": 0}
        assert weeks[-1] == {"weekStart": "2026-11-16", "count": 0}

    def test_each_registration_counts_in_its_own_utc_week(self):
        created = [
            datetime(2026, 11, 16, 0, 0, tzinfo=timezone.utc),
            datetime(2026, 11, 15, 23, 59, tzinfo=timezone.utc),
            datetime(2026, 9, 28, 8, 0, tzinfo=timezone.utc),
            datetime(2026, 9, 27, 23, 0, tzinfo=timezone.utc),  # before the window
        ]

        counts = [week["count"] for week in registrations_by_week(created, NOW)]

        assert counts == [1, 0, 0, 0, 0, 0, 1, 1]


class TestUsersSummary:
    def test_counts_roles_and_moving_windows(self):
        users = [
            UserRecord("runner", days_ago(1)),
            UserRecord("runner", days_ago(8)),
            UserRecord("admin", days_ago(40)),
            UserRecord("runner", None),
            UserRecord(None, days_ago(2)),
        ]

        summary = users_summary(users, [], NOW)

        assert summary["total"] == 5
        assert summary["byRole"] == {"runner": 3, "admin": 1, "none": 1}
        assert summary["registeredLast7Days"] == 2
        assert summary["registeredLast30Days"] == 3

    def test_sport_profile_completion_is_a_rounded_percentage(self):
        users = [UserRecord("runner", None)] * 3
        private = [("sportProfile", {}), ("other", {}), ("sportProfile", {})]

        profiles = users_summary(users, private, NOW)["sportProfiles"]

        assert profiles == {"completed": 2, "percentage": 67}

    def test_there_is_no_percentage_without_users(self):
        profiles = users_summary([], [("sportProfile", {})], NOW)["sportProfiles"]

        assert profiles["percentage"] == 0

    def test_preferences_are_aggregated_with_defaults_for_missing_fields(self):
        private = [
            (
                "preferences",
                {"appearance": "dark", "units": "imperial", "notifications": {"enabled": False}},
            ),
            ("preferences", {"appearance": "dark"}),
            ("preferences", {"appearance": "bogus"}),
        ]

        preferences = users_summary([], private, NOW)["preferences"]

        assert preferences["saved"] == 3
        assert preferences["appearance"] == {"system": 0, "light": 1, "dark": 2}
        assert preferences["units"] == {"metric": 2, "imperial": 1}
        assert preferences["notificationsEnabled"] == 2


class TestRoutesSummary:
    def levels(self, *levels) -> dict:
        return {f"slot-{i}": {"level": level, "score": 50} for i, level in enumerate(levels)}

    def test_counts_by_status_difficulty_surface_and_distance(self):
        routes = [
            route("a", km=5.5, difficulty="advanced", surface="trail"),
            route("b", km=4.5, active=False),
        ]

        summary = routes_summary(routes, {"loja": "Loja"}, 3, ["low", "high", "high", "bogus"])

        assert summary["total"] == 2
        assert (summary["active"], summary["inactive"]) == (1, 1)
        assert summary["totalKm"] == 10.0
        assert summary["byDifficulty"] == {"beginner": 1, "intermediate": 0, "advanced": 1}
        assert summary["bySurface"] == {"asphalt": 1, "trail": 1, "mixed": 0, "track": 0}
        assert summary["timeSlots"] == 3
        assert summary["riskFactors"] == {
            "total": 4,
            "bySeverity": {"low": 1, "medium": 0, "high": 2},
        }

    def test_the_safety_level_of_a_route_is_its_worst_slot(self):
        routes = [
            route("a", safety=self.levels("high", "low", "medium")),
            route("b", safety=self.levels("high", "medium")),
            route("c", safety=self.levels("high")),
            route("d"),
            route("e", safety={"x": {"level": "weird"}}),
        ]

        levels = routes_summary(routes, {}, 0, [])["safetyLevels"]

        assert levels == {"high": 1, "medium": 1, "low": 1, "unrated": 2}

    def test_routes_by_city_use_names_and_sort_by_count_then_name(self):
        routes = [
            route("a", city="quito"),
            route("b", city="loja"),
            route("c", city="loja"),
            route("d", city="gone"),
            route("e", city="cuenca"),
        ]
        names = {"loja": "Loja", "quito": "Quito", "cuenca": "Cuenca"}

        by_city = routes_summary(routes, names, 0, [])["byCity"]

        assert by_city == [
            {"cityId": "loja", "cityName": "Loja", "count": 2},
            {"cityId": "cuenca", "cityName": "Cuenca", "count": 1},
            {"cityId": "gone", "cityName": "gone", "count": 1},
            {"cityId": "quito", "cityName": "Quito", "count": 1},
        ]


def test_cities_summary_counts_cities_and_zones():
    cities = [
        Ciudad("loja", "Loja", "Loja", "city", 0, 0, "active"),
        Ciudad("z1", "Centro", "Loja", "zone", 0, 0, "planned", "loja"),
        Ciudad("z2", "Norte", "Loja", "zone", 0, 0, "planned", "loja"),
    ]

    assert cities_summary(cities) == {"cities": 1, "zones": 2}
