import pytest

from apps.shared.domain.errors import DomainError, ErrorKind
from apps.system_settings.domain.models import SystemSettings

DEFAULTS = SystemSettings.defaults()


def fields_of(changes: dict[str, object]) -> dict[str, str]:
    with pytest.raises(DomainError) as error:
        SystemSettings.parse({**DEFAULTS.to_document(), **changes})
    assert error.value.kind is ErrorKind.INVALID_ARGUMENT
    return error.value.fields


class TestDefaults:
    def test_match_the_values_the_product_started_with(self):
        assert (DEFAULTS.penalty_low, DEFAULTS.penalty_medium, DEFAULTS.penalty_high) == (
            10,
            20,
            35,
        )
        assert (DEFAULTS.threshold_high, DEFAULTS.threshold_medium) == (70, 40)
        assert (DEFAULTS.incident_window_days, DEFAULTS.incident_margin_minutes) == (365, 60)
        assert DEFAULTS.time_zone == "America/Guayaquil"
        assert (DEFAULTS.nearby_radius_m, DEFAULTS.max_search_radius_m) == (500, 50_000)
        assert DEFAULTS.max_alert_radius_m == 5000
        assert (
            DEFAULTS.max_time_slots_per_route,
            DEFAULTS.max_segments_per_route,
            DEFAULTS.max_risk_factors_per_segment,
        ) == (12, 50, 20)
        assert (DEFAULTS.pace_min_sec_per_km, DEFAULTS.pace_max_sec_per_km) == (150, 1200)
        assert (DEFAULTS.distance_min_km, DEFAULTS.distance_max_km) == (1, 50)
        assert (DEFAULTS.safe_route_distance_tolerance, DEFAULTS.safe_route_max_distance_km) == (
            0.2,
            500,
        )
        assert DEFAULTS.country_code == "EC"

    def test_survive_a_document_round_trip(self):
        assert SystemSettings.parse(DEFAULTS.to_document()) == DEFAULTS

    def test_document_uses_camel_case_keys(self):
        document = DEFAULTS.to_document()

        assert document["penaltyHigh"] == 35
        assert document["thresholdMedium"] == 40
        assert document["timeZone"] == "America/Guayaquil"
        assert document["countryCode"] == "EC"


class TestDerivedValues:
    def test_penalty_per_severity(self):
        assert [DEFAULTS.penalty_for(s) for s in ("low", "medium", "high")] == [10, 20, 35]

    def test_zone_follows_the_time_zone(self):
        assert str(DEFAULTS.zone()) == "America/Guayaquil"

    def test_safety_change_detects_penalties_thresholds_window_margin_and_zone(self):
        document = DEFAULTS.to_document()
        for key, value in {
            "penaltyHigh": 40,
            "thresholdHigh": 80,
            "incidentWindowDays": 100,
            "incidentMarginMinutes": 30,
            "timeZone": "America/Bogota",
        }.items():
            assert DEFAULTS.changes_safety(SystemSettings.parse({**document, key: value}))

    def test_other_changes_do_not_alter_the_safety(self):
        other = SystemSettings.parse({**DEFAULTS.to_document(), "nearbyRadiusM": 300})

        assert not DEFAULTS.changes_safety(other)


class TestParse:
    def test_rejects_a_missing_field(self):
        document = DEFAULTS.to_document()
        del document["penaltyLow"]

        with pytest.raises(DomainError) as error:
            SystemSettings.parse(document)

        assert error.value.fields == {"penaltyLow": "required"}

    @pytest.mark.parametrize("value", ["10", None, True, 1.5, float("nan")])
    def test_rejects_a_penalty_that_is_not_a_whole_number(self, value):
        assert fields_of({"penaltyLow": value}) == {
            "penaltyLow": "required" if value is None else "invalid"
        }

    @pytest.mark.parametrize(("value", "reason"), [(-1, "out-of-range"), (101, "out-of-range")])
    def test_rejects_a_penalty_out_of_bounds(self, value, reason):
        assert fields_of({"penaltyLow": value}) == {"penaltyLow": reason}

    def test_penalties_must_not_decrease_with_severity(self):
        assert fields_of({"penaltyLow": 30, "penaltyMedium": 20}) == {
            "penaltyMedium": "must-not-be-below-previous"
        }
        assert fields_of({"penaltyHigh": 15}) == {"penaltyHigh": "must-not-be-below-previous"}

    def test_equal_penalties_are_allowed(self):
        parsed = SystemSettings.parse(
            {**DEFAULTS.to_document(), "penaltyLow": 5, "penaltyMedium": 5, "penaltyHigh": 5}
        )

        assert parsed.penalty_high == 5

    def test_accepts_whole_floats(self):
        assert (
            SystemSettings.parse({**DEFAULTS.to_document(), "penaltyLow": 12.0}).penalty_low == 12
        )

    def test_thresholds_need_medium_below_high_and_high_at_most_100(self):
        assert fields_of({"thresholdMedium": 70}) == {"thresholdMedium": "must-be-below-high"}
        assert fields_of({"thresholdHigh": 101}) == {"thresholdHigh": "out-of-range"}
        assert fields_of({"thresholdMedium": 0}) == {"thresholdMedium": "out-of-range"}

    def test_window_and_margin_bounds(self):
        assert fields_of({"incidentWindowDays": 0}) == {"incidentWindowDays": "out-of-range"}
        assert fields_of({"incidentMarginMinutes": -1}) == {"incidentMarginMinutes": "out-of-range"}

    def test_time_zone_must_be_an_iana_id(self):
        assert fields_of({"timeZone": "Mars/Olympus"}) == {"timeZone": "invalid-time-zone"}
        assert fields_of({"timeZone": ""}) == {"timeZone": "invalid-time-zone"}
        assert fields_of({"timeZone": "../etc"}) == {"timeZone": "invalid-time-zone"}
        assert fields_of({"timeZone": 5}) == {"timeZone": "invalid"}

    def test_accepts_another_time_zone(self):
        parsed = SystemSettings.parse({**DEFAULTS.to_document(), "timeZone": "America/Bogota"})

        assert str(parsed.zone()) == "America/Bogota"

    def test_country_code_is_two_uppercase_letters(self):
        assert fields_of({"countryCode": "ec"}) == {"countryCode": "invalid-country-code"}
        assert fields_of({"countryCode": "ECU"}) == {"countryCode": "invalid-country-code"}
        assert SystemSettings.parse({**DEFAULTS.to_document(), "countryCode": "PE"}).country_code

    def test_pace_and_distance_ranges_need_min_below_max(self):
        assert fields_of({"paceMinSecPerKm": 1200}) == {"paceMaxSecPerKm": "must-exceed-min"}
        assert fields_of({"distanceMinKm": 50}) == {"distanceMaxKm": "must-exceed-min"}

    def test_fractional_tolerance_and_distances_are_allowed(self):
        parsed = SystemSettings.parse(
            {**DEFAULTS.to_document(), "safeRouteDistanceTolerance": 0.35, "distanceMinKm": 0.5}
        )

        assert (parsed.safe_route_distance_tolerance, parsed.distance_min_km) == (0.35, 0.5)

    def test_reports_every_rejected_field(self):
        assert fields_of({"nearbyRadiusM": 0, "maxAlertRadiusM": "x"}) == {
            "nearbyRadiusM": "out-of-range",
            "maxAlertRadiusM": "invalid",
        }

    @pytest.mark.parametrize(
        "key",
        [
            "nearbyRadiusM",
            "maxSearchRadiusM",
            "maxAlertRadiusM",
            "maxTimeSlotsPerRoute",
            "maxSegmentsPerRoute",
            "maxRiskFactorsPerSegment",
            "routeNameMaxLength",
            "routeDescriptionMaxLength",
            "routeMaxDistanceKm",
            "routeMaxElevationM",
            "segmentMaxPoints",
            "safeRouteMaxDistanceKm",
        ],
    )
    def test_every_limit_rejects_zero_and_negative_values(self, key):
        assert fields_of({key: -5}) == {key: "out-of-range"}


class TestFromDocument:
    def test_an_empty_document_gives_the_defaults(self):
        assert SystemSettings.from_document({}) == DEFAULTS

    def test_keeps_the_stored_values(self):
        stored = SystemSettings.from_document({"penaltyHigh": 50, "timeZone": "America/Bogota"})

        assert stored.penalty_high == 50
        assert stored.time_zone == "America/Bogota"
        assert stored.penalty_low == 10

    def test_an_invalid_stored_field_falls_back_to_its_default(self):
        stored = SystemSettings.from_document(
            {"penaltyLow": "x", "timeZone": "Mars/Olympus", "nearbyRadiusM": -3}
        )

        assert stored == DEFAULTS

    def test_inconsistent_stored_groups_fall_back_to_their_defaults(self):
        stored = SystemSettings.from_document(
            {
                "penaltyLow": 50,
                "penaltyMedium": 10,
                "penaltyHigh": 20,
                "thresholdHigh": 30,
                "thresholdMedium": 60,
                "paceMinSecPerKm": 900,
                "paceMaxSecPerKm": 300,
            }
        )

        assert stored == DEFAULTS
