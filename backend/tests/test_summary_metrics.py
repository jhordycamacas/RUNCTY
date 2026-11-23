from datetime import date, datetime, timezone
from zoneinfo import ZoneInfo

from apps.cities.domain.models import Ciudad
from apps.risk_alerts.domain.models import AlertaZonaRiesgo
from apps.routes.domain.geo import LatLng
from apps.routes.domain.models import PuntoRuta, Ruta
from apps.summary.domain.metrics import (
    LatestUser,
    UserRecord,
    cities_summary,
    city_comparison,
    latest_registrations,
    routes_summary,
    safety_summary,
    signups,
    users_summary,
    week_start,
)

LOCAL = ZoneInfo("America/Guayaquil")  # UTC-5, no daylight saving
NOW = datetime(2026, 11, 17, 15, 0, tzinfo=timezone.utc)  # a Tuesday, 10:00 in Guayaquil
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


def at_local(day: str, hour: int = 12) -> datetime:
    """A moment of the local calendar day `day` (UTC-5), as the stored UTC timestamp."""
    local = datetime.fromisoformat(f"{day}T{hour:02d}:00:00").replace(tzinfo=LOCAL)
    return local.astimezone(timezone.utc)


def starts(series: list[dict]) -> list[str]:
    return [bucket["start"] for bucket in series]


def counts(series: list[dict]) -> list[int]:
    return [bucket["count"] for bucket in series]


class TestSignups:
    def test_each_range_has_its_fixed_number_of_buckets_oldest_first(self):
        result = signups([], NOW, LOCAL)

        assert [len(result[name]) for name in ("daily", "weekly", "monthly")] == [30, 12, 12]
        assert result["before"] == {"daily": 0, "weekly": 0, "monthly": 0}
        assert sum(sum(counts(result[name])) for name in ("daily", "weekly", "monthly")) == 0

    def test_the_daily_range_ends_today_in_the_local_time_zone(self):
        daily = signups([], NOW, LOCAL)["daily"]

        assert daily[0]["start"] == "2026-10-19"
        assert daily[-1]["start"] == "2026-11-17"

    def test_the_local_day_can_differ_from_the_utc_day(self):
        late_utc = datetime(2026, 11, 17, 3, 0, tzinfo=timezone.utc)  # Monday 22:00 in Guayaquil

        daily = signups([late_utc], late_utc, LOCAL)["daily"]

        assert daily[-1] == {"start": "2026-11-16", "count": 1}

    def test_a_registration_counts_in_the_local_day_not_the_utc_day(self):
        created = [
            datetime(2026, 11, 17, 4, 59, tzinfo=timezone.utc),  # 23:59 on the 16th
            datetime(2026, 11, 17, 5, 0, tzinfo=timezone.utc),  # 00:00 on the 17th
        ]

        daily = signups(created, NOW, LOCAL)["daily"]

        assert counts(daily)[-2:] == [1, 1]

    def test_weeks_start_on_monday_and_the_last_one_is_the_current_week(self):
        weekly = signups([], NOW, LOCAL)["weekly"]

        assert weekly[0]["start"] == "2026-08-31"
        assert weekly[-1]["start"] == "2026-11-16"
        assert all(date.fromisoformat(start).weekday() == 0 for start in starts(weekly))

    def test_sunday_night_local_time_belongs_to_the_week_that_ends(self):
        # Sunday 23:30 in Guayaquil is already Monday 04:30 UTC.
        created = [datetime(2026, 11, 16, 4, 30, tzinfo=timezone.utc)]

        weekly = signups(created, NOW, LOCAL)["weekly"]

        assert counts(weekly)[-2:] == [1, 0]

    def test_months_start_on_the_first_and_cross_the_year(self):
        monthly = signups([], NOW, LOCAL)["monthly"]

        assert monthly[0]["start"] == "2025-12-01"
        assert monthly[1]["start"] == "2026-01-01"
        assert monthly[-1]["start"] == "2026-11-01"

    def test_buckets_without_registrations_count_zero(self):
        created = [at_local("2026-11-17"), at_local("2026-11-17"), at_local("2026-09-02")]

        series = signups(created, NOW, LOCAL)

        assert counts(series["daily"]).count(0) == 29
        assert counts(series["monthly"])[-1] == 2
        assert counts(series["monthly"])[-3] == 1
        assert sum(counts(series["weekly"])) == 3

    def test_registrations_before_the_first_bucket_are_counted_apart_for_each_range(self):
        created = [
            at_local("2026-10-18"),  # one day before the daily range
            at_local("2026-08-30"),  # the Sunday before the first week
            at_local("2025-11-30"),  # before the first month
            at_local("2026-11-10"),  # inside every range
        ]

        before = signups(created, NOW, LOCAL)["before"]

        assert before == {"daily": 3, "weekly": 2, "monthly": 1}

    def test_registrations_after_now_fill_no_bucket_and_are_not_before_any(self):
        series = signups([at_local("2026-11-30")], NOW, LOCAL)

        assert sum(counts(series["daily"])) == 0
        assert series["before"] == {"daily": 0, "weekly": 0, "monthly": 0}

    def test_the_current_day_follows_the_given_time_zone(self):
        evening = datetime(2026, 11, 17, 23, 30, tzinfo=timezone.utc)

        assert signups([], evening, LOCAL)["daily"][-1]["start"] == "2026-11-17"
        assert signups([], evening, ZoneInfo("Asia/Tokyo"))["daily"][-1]["start"] == "2026-11-18"

    def test_a_naive_timestamp_is_read_as_utc(self):
        created = [datetime(2026, 11, 17, 3, 0)]  # 22:00 on the 16th in Guayaquil

        assert counts(signups(created, NOW, LOCAL)["daily"])[-2] == 1

    def test_accounts_without_a_valid_date_are_ignored_by_the_summary(self):
        users = [UserRecord("runner", None), UserRecord("runner", at_local("2026-11-17"))]

        result = users_summary(users, [], NOW, LOCAL)

        assert result["total"] == 2
        assert sum(counts(result["signups"]["daily"])) == 1


class TestLatestRegistrations:
    def person(self, uid, day, **changes) -> LatestUser:
        fields = {"first_name": "Ana", "last_name": "Mora", "city_id": "loja"} | changes
        return LatestUser(uid=uid, created_at=at_local(day), **fields)

    def test_lists_the_newest_first_and_at_most_five(self):
        people = [self.person(f"u{i}", f"2026-11-{i:02d}") for i in range(1, 9)]

        latest = latest_registrations(people)

        assert [row["uid"] for row in latest] == ["u8", "u7", "u6", "u5", "u4"]

    def test_each_row_carries_only_what_the_list_shows(self):
        row = latest_registrations([self.person("u1", "2026-11-17")])[0]

        assert row == {
            "uid": "u1",
            "firstName": "Ana",
            "lastName": "Mora",
            "cityId": "loja",
            "createdAt": "2026-11-17T17:00:00Z",
        }

    def test_a_missing_city_stays_null(self):
        row = latest_registrations([self.person("u1", "2026-11-17", city_id=None)])[0]

        assert row["cityId"] is None

    def test_nothing_to_list_without_accounts(self):
        assert latest_registrations([]) == []


class TestSafetySummary:
    def alert(self, valid_from, valid_to, start=None, end=None) -> AlertaZonaRiesgo:
        return AlertaZonaRiesgo(
            id="a",
            type="Robos",
            severity="alta",
            description="",
            location=LatLng(-3.99, -79.2),
            radius_m=100,
            city_id="loja",
            valid_from=valid_from,
            valid_to=valid_to,
            start_time=start,
            end_time=end,
        )

    def test_counts_the_alerts_in_force_now_not_the_expired_or_future_ones(self):
        alerts = [
            self.alert("2026-11-01", "2026-11-30"),
            self.alert("2026-11-17", "2026-11-17"),
            self.alert("2026-10-01", "2026-11-16"),  # expired yesterday
            self.alert("2026-11-18", "2026-12-01"),  # starts tomorrow
        ]

        assert safety_summary(alerts, [], NOW, LOCAL)["activeAlerts"] == 2

    def test_an_alert_with_a_daily_window_counts_only_inside_it(self):
        evening = self.alert("2026-11-01", "2026-11-30", "18:00", "22:00")
        morning = self.alert("2026-11-01", "2026-11-30", "06:00", "11:00")  # it is 10:00 there

        assert safety_summary([evening, morning], [], NOW, LOCAL)["activeAlerts"] == 1

    def test_the_day_of_the_alerts_is_the_local_one(self):
        late_utc = datetime(2026, 11, 18, 3, 0, tzinfo=timezone.utc)  # still the 17th in Loja

        result = safety_summary([self.alert("2026-11-17", "2026-11-17")], [], late_utc, LOCAL)

        assert result["activeAlerts"] == 1

    def test_counts_the_incidents_of_the_last_30_days_including_today(self):
        dates = ["2026-11-17", "2026-10-19", "2026-10-18", "2026-11-18", "bogus", ""]

        assert safety_summary([], dates, NOW, LOCAL)["incidentsLast30Days"] == 2

    def test_there_is_nothing_to_count_without_alerts_or_incidents(self):
        assert safety_summary([], [], NOW, LOCAL) == {"activeAlerts": 0, "incidentsLast30Days": 0}


class TestUsersSummary:
    def test_counts_roles_and_moving_windows(self):
        users = [
            UserRecord("runner", days_ago(1)),
            UserRecord("runner", days_ago(8)),
            UserRecord("admin", days_ago(40)),
            UserRecord("runner", None),
            UserRecord(None, days_ago(2)),
        ]

        summary = users_summary(users, [], NOW, LOCAL)

        assert summary["total"] == 5
        assert summary["byRole"] == {"runner": 3, "admin": 1, "none": 1}
        assert summary["registeredLast7Days"] == 2
        assert summary["registeredLast30Days"] == 3

    def test_sport_profile_completion_is_a_rounded_percentage(self):
        users = [UserRecord("runner", None)] * 3
        private = [("sportProfile", {}), ("other", {}), ("sportProfile", {})]

        profiles = users_summary(users, private, NOW, LOCAL)["sportProfiles"]

        assert profiles == {"completed": 2, "percentage": 67}

    def test_there_is_no_percentage_without_users(self):
        profiles = users_summary([], [("sportProfile", {})], NOW, LOCAL)["sportProfiles"]

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

        preferences = users_summary([], private, NOW, LOCAL)["preferences"]

        assert preferences["saved"] == 3
        assert preferences["appearance"] == {"system": 0, "light": 1, "dark": 2}
        assert preferences["units"] == {"metric": 2, "imperial": 1}
        assert preferences["notificationsEnabled"] == 2


class TestUsersBySportLevel:
    def level(self, code) -> tuple[str, dict]:
        return ("sportProfile", {"level": code})

    def test_counts_the_stored_level_of_each_profile_most_common_first(self):
        private = [
            self.level("beginner"),
            self.level("advanced"),
            self.level("beginner"),
            self.level("zeta"),  # a code the catalogue no longer lists keeps its raw code
            ("preferences", {"level": "advanced"}),  # only the sport profile counts
        ]

        by_level = users_summary([], private, NOW, LOCAL)["bySportLevel"]

        assert by_level == [
            {"level": "beginner", "users": 2},
            {"level": "advanced", "users": 1},
            {"level": "zeta", "users": 1},
        ]

    def test_a_profile_without_a_usable_level_is_not_listed(self):
        private = [
            ("sportProfile", {}),
            ("sportProfile", {"level": ""}),
            ("sportProfile", {"level": 3}),
        ]

        assert users_summary([], private, NOW, LOCAL)["bySportLevel"] == []

    def test_there_is_nothing_to_list_without_profiles(self):
        assert users_summary([UserRecord("runner", None)], [], NOW, LOCAL)["bySportLevel"] == []


class TestCityComparison:
    def test_each_city_shows_its_routes_and_its_users(self):
        routes = [route("a", city="loja"), route("b", city="loja"), route("c", city="quito")]
        users = [UserRecord("runner", None, "loja"), UserRecord("runner", None, "quito")] * 2

        rows = city_comparison(routes, users, {"loja": "Loja", "quito": "Quito"})

        assert rows == [
            {"cityId": "loja", "name": "Loja", "routes": 2, "users": 2},
            {"cityId": "quito", "name": "Quito", "routes": 1, "users": 2},
        ]

    def test_sorts_by_users_then_routes_then_name(self):
        routes = [route("a", city="b"), route("b", city="b"), route("c", city="a")]
        users = [UserRecord("runner", None, "c")]
        names = {"a": "Alfa", "b": "Beta", "c": "Gamma"}

        rows = city_comparison(routes, users, names)

        assert [row["cityId"] for row in rows] == ["c", "b", "a"]

    def test_a_city_with_routes_but_no_users_and_the_reverse_show_zero(self):
        routes = [route("a", city="loja")]
        users = [UserRecord("runner", None, "cuenca")]

        rows = city_comparison(routes, users, {"loja": "Loja", "cuenca": "Cuenca"})

        assert {row["cityId"]: (row["routes"], row["users"]) for row in rows} == {
            "loja": (1, 0),
            "cuenca": (0, 1),
        }

    def test_users_without_a_city_are_left_out_and_a_removed_city_keeps_its_id(self):
        routes = [route("a", city="gone")]
        users = [UserRecord("runner", None, None), UserRecord("runner", None, "")]

        rows = city_comparison(routes, users, {})

        assert rows == [{"cityId": "gone", "name": "gone", "routes": 1, "users": 0}]

    def test_keeps_the_eight_cities_with_most_users(self):
        users = [UserRecord("runner", None, f"c{i}") for i in range(10) for _ in range(i + 1)]

        rows = city_comparison([], users, {})

        assert len(rows) == 8
        assert rows[0]["cityId"] == "c9"


class TestRoutesSummary:
    def levels(self, *levels) -> dict:
        return {f"slot-{i}": {"level": level, "score": 50} for i, level in enumerate(levels)}

    def test_groups_surface_and_difficulty_by_stored_text(self):
        routes = [
            route("a", surface="Adoquín", difficulty="Media"),
            route("b", surface="Adoquín", difficulty="Alta"),
            route("c", surface="", difficulty="Media"),
        ]

        summary = routes_summary(routes, {"loja": "Loja"}, 0, [])

        assert summary["bySurface"] == {"Adoquín": 2, "Sin definir": 1}
        assert summary["byDifficulty"] == {"Media": 2, "Alta": 1}

    def test_counts_by_status_difficulty_surface_and_distance(self):
        routes = [
            route("a", km=5.5, difficulty="advanced", surface="trail"),
            route("b", km=4.5, active=False),
        ]

        summary = routes_summary(routes, {"loja": "Loja"}, 3, ["low", "high", "high", "bogus"])

        assert summary["total"] == 2
        assert (summary["active"], summary["inactive"]) == (1, 1)
        assert summary["totalKm"] == 10.0
        assert summary["byDifficulty"] == {"advanced": 1, "beginner": 1}
        assert summary["bySurface"] == {"asphalt": 1, "trail": 1}
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

    def test_lists_the_longest_routes_first_and_at_most_eight(self):
        routes = [route(f"r{i}", km=float(i)) for i in range(1, 11)]

        distances = routes_summary(routes, {}, 0, [])["distances"]

        assert len(distances) == 8
        assert distances[0] == {"name": "r10", "distanceKm": 10.0}
        assert [item["distanceKm"] for item in distances] == sorted(
            (item["distanceKm"] for item in distances), reverse=True
        )

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
