"""RF-07: safety index per segment ("tramo") and time slot ("franja").

Each segment starts at 100 points per slot. Every penalty active in the slot (its window
overlaps the slot window) subtracts by severity, floored at 0. The penalty per severity and the
level thresholds are system parameters (`SystemSettings`, defaults: low -10, medium -20, high
-35; high >= 70, medium >= 40, low below). A route takes its worst segment per slot. The factors
explaining each result are always kept.

Penalty sources are pluggable: risk factors, plus `extra_penalties` tagged with their `source`:
safety incidents (EP-08, `source="incident"`) and later community reports (RF-17).
"""

from collections.abc import Mapping, Sequence
from dataclasses import dataclass, replace
from typing import Protocol

from apps.routes.domain.time import time_windows_overlap, to_window
from apps.system_settings.domain.models import SystemSettings

SEVERITIES = ("low", "medium", "high")

_MAX_SCORE = 100
_SEVERITY_RANK = {"high": 0, "medium": 1, "low": 2}


class SafetySlot(Protocol):
    id: str
    start_time: str
    end_time: str


class Penalty(Protocol):
    """A risk factor, or any penalty, with an optional application window."""

    type: str
    severity: str
    description: str
    start_time: str | None
    end_time: str | None


@dataclass(frozen=True, slots=True)
class ExtraPenalty:
    """An extra penalty source, e.g. `source="report"` for community reports."""

    source: str
    type: str
    severity: str
    description: str
    start_time: str | None = None
    end_time: str | None = None


@dataclass(frozen=True, slots=True)
class FactorEvaluado:
    """A penalty that explains an index. Route indexes also name the segment it comes from."""

    type: str
    severity: str
    description: str
    # Only present for extra penalty sources (risk factors omit it).
    source: str | None = None
    segment_id: str | None = None
    segment_name: str | None = None

    def to_document(self) -> dict[str, str]:
        fields = {
            "segmentId": self.segment_id,
            "segmentName": self.segment_name,
            "type": self.type,
            "severity": self.severity,
            "description": self.description,
            "source": self.source,
        }
        return {key: value for key, value in fields.items() if value is not None}


@dataclass(frozen=True, slots=True)
class IndiceSeguridad:
    """The safety of a segment in one time slot."""

    level: str
    score: int
    factors: tuple[FactorEvaluado, ...]

    def to_document(self) -> dict[str, object]:
        return {
            "level": self.level,
            "score": self.score,
            "factors": [factor.to_document() for factor in self.factors],
        }


@dataclass(frozen=True, slots=True)
class IndiceSeguridadRuta(IndiceSeguridad):
    """The safety of a route in one time slot: that of its worst segment."""

    start_time: str
    end_time: str
    worst_segment_id: str

    def to_document(self) -> dict[str, object]:
        return {
            **IndiceSeguridad.to_document(self),
            "startTime": self.start_time,
            "endTime": self.end_time,
            "worstSegmentId": self.worst_segment_id,
        }


@dataclass(frozen=True, slots=True)
class TramoEvaluado:
    """A segment with its freshly computed safety per slot id."""

    id: str
    name: str
    order: int
    safety: Mapping[str, IndiceSeguridad]


_FULL_SCORE = IndiceSeguridad("high", _MAX_SCORE, ())


def level_for_score(score: int, settings: SystemSettings) -> str:
    if score >= settings.threshold_high:
        return "high"
    if score >= settings.threshold_medium:
        return "medium"
    return "low"


def _by_severity(factor: FactorEvaluado) -> int:
    return _SEVERITY_RANK[factor.severity]


def _evaluated(penalty: Penalty) -> FactorEvaluado:
    source = penalty.source if isinstance(penalty, ExtraPenalty) else None
    return FactorEvaluado(penalty.type, penalty.severity, penalty.description, source=source)


class CalculadoraIndiceSeguridad:
    """Creates the `IndiceSeguridad` of segments and routes (RF-07)."""

    @staticmethod
    def segment_safety(
        settings: SystemSettings,
        slots: Sequence[SafetySlot],
        factors: Sequence[Penalty],
        extra_penalties: Sequence[ExtraPenalty] = (),
    ) -> dict[str, IndiceSeguridad]:
        penalties = [*factors, *extra_penalties]
        result = {}
        for slot in slots:
            window = to_window(slot.start_time, slot.end_time)
            active = [
                penalty
                for penalty in penalties
                if time_windows_overlap(window, to_window(penalty.start_time, penalty.end_time))
            ]
            penalty_points = sum(settings.penalty_for(penalty.severity) for penalty in active)
            score = max(0, _MAX_SCORE - penalty_points)
            explained = sorted((_evaluated(penalty) for penalty in active), key=_by_severity)
            result[slot.id] = IndiceSeguridad(
                level_for_score(score, settings), score, tuple(explained)
            )
        return result

    @staticmethod
    def route_safety(
        settings: SystemSettings, slots: Sequence[SafetySlot], segments: Sequence[TramoEvaluado]
    ) -> dict[str, IndiceSeguridadRuta]:
        """Route level per slot = worst segment (ties: first in route order)."""
        if not segments:
            return {}
        ordered = sorted(segments, key=lambda segment: (segment.order, segment.id))
        result = {}
        for slot in slots:
            worst = ordered[0]
            factors: list[FactorEvaluado] = []
            for segment in ordered:
                safety = segment.safety.get(slot.id, _FULL_SCORE)
                if safety.score < worst.safety.get(slot.id, _FULL_SCORE).score:
                    worst = segment
                factors.extend(
                    replace(factor, segment_id=segment.id, segment_name=segment.name)
                    for factor in safety.factors
                )
            score = worst.safety.get(slot.id, _FULL_SCORE).score
            result[slot.id] = IndiceSeguridadRuta(
                level=level_for_score(score, settings),
                score=score,
                # The sort is stable: route order is kept within the same severity.
                factors=tuple(sorted(factors, key=_by_severity)),
                start_time=slot.start_time,
                end_time=slot.end_time,
                worst_segment_id=worst.id,
            )
        return result
