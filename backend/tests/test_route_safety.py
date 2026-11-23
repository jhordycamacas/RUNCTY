"""Ported from `functions/src/routes/domain/safety.test.ts` (RF-07)."""

import pytest

from apps.routes.domain.models import FactorDeRiesgo, FranjaHoraria
from apps.routes.domain.safety import (
    CalculadoraIndiceSeguridad as Calculator,
)
from apps.routes.domain.safety import (
    ExtraPenalty,
    FactorEvaluado,
    IndiceSeguridad,
    TramoEvaluado,
    level_for_score,
)
from apps.system_settings.domain.models import SystemSettings
from tests.fakes import SETTINGS

MORNING = FranjaHoraria("morning", "06:00", "09:00")
NIGHT = FranjaHoraria("night", "19:00", "23:00")


def factor(**overrides) -> FactorDeRiesgo:
    fields = {
        "id": "f",
        "type": "poor_lighting",
        "severity": "medium",
        "description": "Street lights out",
        **overrides,
    }
    return FactorDeRiesgo(**fields)


@pytest.mark.parametrize(
    ("score", "level"),
    [(100, "high"), (70, "high"), (69, "medium"), (40, "medium"), (39, "low"), (0, "low")],
)
def test_level_for_score_maps_scores_to_high_medium_and_low(score, level):
    assert level_for_score(score, SETTINGS) == level


class TestSegmentSafety:
    def test_starts_every_slot_at_100_without_factors(self):
        assert Calculator.segment_safety(SETTINGS, [MORNING, NIGHT], []) == {
            "morning": IndiceSeguridad("high", 100, ()),
            "night": IndiceSeguridad("high", 100, ()),
        }

    def test_subtracts_10_20_35_by_severity_for_factors_active_in_the_slot(self):
        result = Calculator.segment_safety(
            SETTINGS,
            [NIGHT],
            [
                factor(severity="low", type="traffic", description="Busy road"),
                factor(severity="medium"),
                factor(severity="high", type="isolated_area", description="No people around"),
            ],
        )

        assert result["night"].score == 100 - 10 - 20 - 35
        assert result["night"].level == "low"

    def test_only_applies_a_factor_to_slots_its_window_overlaps(self):
        result = Calculator.segment_safety(
            SETTINGS,
            [MORNING, NIGHT],
            [factor(severity="high", start_time="18:00", end_time="24:00")],
        )

        assert result["morning"] == IndiceSeguridad("high", 100, ())
        assert result["night"].score == 65
        assert result["night"].level == "medium"
        assert result["night"].factors == (
            FactorEvaluado("poor_lighting", "high", "Street lights out"),
        )

    def test_applies_a_factor_without_a_window_to_every_slot(self):
        result = Calculator.segment_safety(
            SETTINGS, [MORNING, NIGHT], [factor(severity="low", type="uneven_terrain")]
        )

        assert result["morning"].score == 90
        assert result["night"].score == 90

    def test_does_not_apply_a_factor_that_only_touches_the_slot_boundary(self):
        result = Calculator.segment_safety(
            SETTINGS, [MORNING], [factor(start_time="09:00", end_time="12:00")]
        )

        assert result["morning"].score == 100

    def test_floors_the_score_at_0(self):
        highs = [factor(severity="high") for _ in range(4)]

        result = Calculator.segment_safety(SETTINGS, [NIGHT], highs)["night"]

        assert (result.score, result.level) == (0, "low")

    def test_lists_the_explaining_factors_by_severity_high_first(self):
        result = Calculator.segment_safety(
            SETTINGS,
            [NIGHT],
            [
                factor(severity="low", type="traffic"),
                factor(severity="high", type="harassment"),
                factor(severity="medium"),
            ],
        )

        assert [f.severity for f in result["night"].factors] == ["high", "medium", "low"]

    def test_accepts_extra_penalty_sources_tagged_with_their_source(self):
        """Community reports (RF-17) plug in here."""
        report = ExtraPenalty(
            source="report",
            type="harassment",
            severity="medium",
            description="Reported twice",
            start_time="20:00",
            end_time="21:00",
        )

        result = Calculator.segment_safety(SETTINGS, [MORNING, NIGHT], [], [report])

        assert result["morning"].score == 100
        assert result["night"].score == 80
        assert result["night"].factors == (
            FactorEvaluado("harassment", "medium", "Reported twice", source="report"),
        )


class TestRouteSafety:
    SLOTS = (MORNING, NIGHT)

    def segment(self, segment_id, name, order, *factors) -> TramoEvaluado:
        safety = Calculator.segment_safety(SETTINGS, self.SLOTS, factors)
        return TramoEvaluado(segment_id, name, order, safety)

    def test_takes_the_worst_segment_per_slot_and_keeps_every_factor_with_its_segment(self):
        lights = factor(severity="high", start_time="18:00", end_time="24:00")
        floods = factor(severity="medium", type="flood_risk", description="Floods")
        segments = [self.segment("a", "Park", 0, lights), self.segment("b", "River", 1, floods)]

        result = Calculator.route_safety(SETTINGS, self.SLOTS, segments)

        morning = result["morning"]
        assert (morning.level, morning.score, morning.worst_segment_id) == ("high", 80, "b")
        assert (morning.start_time, morning.end_time) == ("06:00", "09:00")
        assert morning.factors == (
            FactorEvaluado("flood_risk", "medium", "Floods", segment_id="b", segment_name="River"),
        )
        night = result["night"]
        assert (night.level, night.score, night.worst_segment_id) == ("medium", 65, "a")
        assert night.factors == (
            FactorEvaluado(
                "poor_lighting", "high", "Street lights out", segment_id="a", segment_name="Park"
            ),
            FactorEvaluado("flood_risk", "medium", "Floods", segment_id="b", segment_name="River"),
        )

    def test_breaks_ties_with_the_first_segment_in_route_order(self):
        segments = [self.segment("second", "B", 1), self.segment("first", "A", 0)]

        assert (
            Calculator.route_safety(SETTINGS, self.SLOTS, segments)["morning"].worst_segment_id
            == "first"
        )

    def test_returns_no_levels_for_a_route_without_segments(self):
        assert Calculator.route_safety(SETTINGS, self.SLOTS, []) == {}

    def test_treats_a_segment_missing_a_slot_entry_as_a_full_score(self):
        segments = [TramoEvaluado("a", "A", 0, {})]

        morning = Calculator.route_safety(SETTINGS, [MORNING], segments)["morning"]

        assert (morning.score, morning.level, morning.factors) == (100, "high", ())

    def test_serializes_to_the_stored_shape(self):
        lights = factor(severity="high", start_time="18:00", end_time="24:00")

        night = Calculator.route_safety(
            SETTINGS, self.SLOTS, [self.segment("a", "Park", 0, lights)]
        )["night"]

        assert night.to_document() == {
            "level": "medium",
            "score": 65,
            "startTime": "19:00",
            "endTime": "23:00",
            "worstSegmentId": "a",
            "factors": [
                {
                    "segmentId": "a",
                    "segmentName": "Park",
                    "type": "poor_lighting",
                    "severity": "high",
                    "description": "Street lights out",
                }
            ],
        }


class TestWithOtherSettings:
    """The penalties and the level thresholds come from the system settings."""

    CUSTOM = SystemSettings.defaults().with_changes(
        {
            "penaltyLow": 1,
            "penaltyMedium": 2,
            "penaltyHigh": 50,
            "thresholdHigh": 90,
            "thresholdMedium": 60,
        }
    )

    def test_penalties_follow_the_settings(self):
        result = Calculator.segment_safety(
            self.CUSTOM,
            [NIGHT],
            [factor(severity="low"), factor(severity="medium"), factor(severity="high")],
        )

        assert result["night"].score == 100 - 1 - 2 - 50

    @pytest.mark.parametrize(
        ("score", "level"), [(90, "high"), (89, "medium"), (60, "medium"), (59, "low")]
    )
    def test_thresholds_follow_the_settings(self, score, level):
        assert level_for_score(score, self.CUSTOM) == level
