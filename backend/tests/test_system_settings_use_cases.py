"""System settings use cases against the in-memory adapters."""

import pytest

from apps.cities.domain.models import Ciudad
from apps.routes.application import use_cases as route_use_cases
from apps.routes.application.use_cases import RoutesDeps
from apps.shared.domain.errors import DomainError
from apps.system_settings.application.use_cases import (
    SettingsDeps,
    get_settings,
    recalculate_routes,
    update_settings,
)
from apps.system_settings.domain.models import SystemSettings
from tests import fakes
from tests.fakes import FIREBASE, SETTINGS

ROUTE = {
    "name": "Jipiro loop",
    "cityId": "loja",
    "start": {"lat": -3.97, "lng": -79.2, "label": "Gate"},
    "end": {"lat": -3.98, "lng": -79.21, "label": "Lake"},
    "distanceKm": 5,
    "elevationGainM": 30,
    "surface": "asphalt",
    "difficulty": "beginner",
}
SEGMENT = {
    "name": "Bridge",
    "coordinates": [{"lat": -3.97, "lng": -79.2}, {"lat": -3.9, "lng": -79}],
}
SLOT = {"label": "Night", "startTime": "19:00", "endTime": "23:00"}
FACTOR = {"type": "dark", "severity": "high", "description": "Dark"}


@pytest.fixture
def deps() -> SettingsDeps:
    return SettingsDeps(
        settings=fakes.InMemorySettingsRepository(), routes=fakes.InMemoryRouteRepository()
    )


def make_route(route_deps: RoutesDeps) -> str:
    """A route with one segment, one time slot and one high risk factor."""
    FIREBASE.cities["loja"] = Ciudad("loja", "Loja", "Loja", "city", 0, 0, "active")
    route_id = route_use_cases.create_route(ROUTE, route_deps)
    segment_id = route_use_cases.create_segment({**SEGMENT, "routeId": route_id}, route_deps)
    route_use_cases.create_time_slot({**SLOT, "routeId": route_id}, route_deps)
    ids = {"routeId": route_id, "segmentId": segment_id}
    route_use_cases.create_risk_factor({**FACTOR, **ids}, route_deps)
    return route_id


def stored_score(route_id: str) -> int:
    (index,) = FIREBASE.docs[f"routes/{route_id}"]["safety"].values()
    return index["score"]


@pytest.fixture
def route_id(deps) -> str:
    return make_route(
        RoutesDeps(routes=deps.routes, cities=fakes.InMemoryCityRepository(), settings=SETTINGS)
    )


class TestGetSettings:
    def test_gives_the_defaults_when_nothing_was_saved(self, deps):
        assert get_settings(deps.settings) == SystemSettings.defaults()

    def test_gives_what_was_saved_completed_with_defaults(self, deps):
        FIREBASE.docs["systemSettings/global"] = {"penaltyHigh": 50}

        stored = get_settings(deps.settings)

        assert stored.penalty_high == 50
        assert stored.penalty_low == 10


class TestUpdateSettings:
    def test_merges_the_patch_over_the_current_values_and_saves(self, deps):
        result = update_settings({"nearbyRadiusM": 800}, deps)

        assert result.settings.nearby_radius_m == 800
        assert result.settings.penalty_high == 35
        assert deps.settings.get() == result.settings
        assert FIREBASE.docs["systemSettings/global"]["nearbyRadiusM"] == 800

    def test_successive_patches_accumulate(self, deps):
        update_settings({"nearbyRadiusM": 800}, deps)
        update_settings({"maxAlertRadiusM": 2000}, deps)

        stored = get_settings(deps.settings)
        assert (stored.nearby_radius_m, stored.max_alert_radius_m) == (800, 2000)

    def test_an_invalid_patch_saves_nothing(self, deps):
        with pytest.raises(DomainError) as error:
            update_settings({"penaltyHigh": 5}, deps)

        assert error.value.fields == {"penaltyHigh": "must-not-be-below-previous"}
        assert "systemSettings/global" not in FIREBASE.docs

    def test_a_patch_may_fix_an_order_with_several_fields(self, deps):
        result = update_settings({"penaltyLow": 1, "penaltyMedium": 2, "penaltyHigh": 3}, deps)

        assert result.settings.penalty_high == 3

    def test_changing_a_limit_does_not_recalculate_the_routes(self, deps, route_id):
        before = dict(FIREBASE.docs[f"routes/{route_id}"])

        result = update_settings({"nearbyRadiusM": 800}, deps)

        assert result.recalculated == 0
        assert FIREBASE.docs[f"routes/{route_id}"] == before

    def test_changing_the_high_penalty_recalculates_every_route(self, deps, route_id):
        assert stored_score(route_id) == 65

        result = update_settings({"penaltyHigh": 50}, deps)

        assert result.recalculated == 1
        assert stored_score(route_id) == 50

    @pytest.mark.parametrize(
        "change",
        [
            {"thresholdHigh": 90},
            {"thresholdMedium": 66},
            {"incidentWindowDays": 30},
            {"incidentMarginMinutes": 30},
            {"timeZone": "America/Bogota"},
        ],
    )
    def test_the_other_safety_parameters_recalculate_too(self, deps, route_id, change):
        assert update_settings(change, deps).recalculated == 1

    def test_the_levels_follow_the_thresholds(self, deps, route_id):
        (index,) = FIREBASE.docs[f"routes/{route_id}"]["safety"].values()
        assert index["level"] == "medium"

        update_settings({"thresholdMedium": 66}, deps)

        (index,) = FIREBASE.docs[f"routes/{route_id}"]["safety"].values()
        assert index["level"] == "low"

    def test_an_unchanged_safety_parameter_does_not_recalculate(self, deps, route_id):
        assert update_settings({"penaltyHigh": 35}, deps).recalculated == 0


class TestRecalculateRoutes:
    def test_recomputes_the_stored_index_with_the_current_settings(self, deps, route_id):
        FIREBASE.docs["systemSettings/global"] = {"penaltyHigh": 60}

        assert recalculate_routes(deps) == 1
        assert stored_score(route_id) == 40

    def test_counts_every_route(self, deps, route_id):
        route_deps = RoutesDeps(deps.routes, fakes.InMemoryCityRepository(), SETTINGS)
        route_use_cases.create_route(ROUTE, route_deps)

        assert recalculate_routes(deps) == 2

    def test_is_zero_without_routes(self, deps):
        assert recalculate_routes(deps) == 0
