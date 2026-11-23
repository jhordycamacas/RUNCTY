"""EP-08 domain: incident validation and how incidents become index penalties."""

from datetime import datetime

import pytest

from apps.routes.domain.safety import ExtraPenalty
from apps.safety_data.domain.models import IncidenteSeguridad, incident_penalties
from apps.shared.domain.errors import DomainError

NOW = datetime(2026, 11, 22, 18, 30)
TODAY = NOW.date()


def incident(**changes) -> IncidenteSeguridad:
    values = {
        "id": "i1",
        "route_id": "r1",
        "segment_id": "s1",
        "type": "robbery",
        "severity": "high",
        "date": "2026-11-01",
        "time": "20:30",
        "source_id": "src",
        **changes,
    }
    return IncidenteSeguridad(**values)


def test_an_incident_can_be_earlier_today_but_not_later():
    raw = {
        "routeId": "r1",
        "type": "Otro",
        "severity": "low",
        "date": "2026-11-22",
        "sourceId": "s",
    }

    assert IncidenteSeguridad.parse({**raw, "time": "18:30"}, "i1", NOW).segment_id is None
    with pytest.raises(DomainError) as error:
        IncidenteSeguridad.parse({**raw, "time": "18:31"}, "i1", NOW)
    assert error.value.reason == "incident-in-future"


@pytest.mark.parametrize("severity", ["low", "medium", "high"])
def test_the_penalty_severity_is_the_one_chosen_for_the_incident(severity):
    assert incident(type="Hurto", severity=severity).penalty().severity == severity


def test_the_penalty_covers_one_hour_around_the_incident():
    assert incident().penalty() == ExtraPenalty(
        "incident",
        "robbery",
        "high",
        "Incidente registrado el 2026-11-01 a las 20:30.",
        "19:30",
        "21:30",
    )


@pytest.mark.parametrize(
    ("time", "window"), [("00:20", ("00:00", "01:20")), ("23:40", ("22:40", "24:00"))]
)
def test_the_penalty_window_stays_within_the_day(time, window):
    penalty = incident(time=time).penalty()

    assert (penalty.start_time, penalty.end_time) == window


def test_only_recent_incidents_with_a_source_count():
    assert incident(date="2025-11-22").counts_on(TODAY)
    assert not incident(date="2025-11-21").counts_on(TODAY)
    assert not incident(source_deleted=True).counts_on(TODAY)


def test_a_segment_gets_its_incidents_and_those_of_the_whole_route():
    own, whole, other = incident(), incident(id="i2", segment_id=None), incident(segment_id="s2")

    penalties = incident_penalties([own, whole, other], "s1", TODAY)

    assert len(penalties) == 2


def test_a_malformed_stored_incident_is_skipped():
    assert IncidenteSeguridad.from_document("i1", {"type": "robbery", "date": "x"}) is None
    assert IncidenteSeguridad.from_document("i1", {"date": "2026-01-01", "time": "07:00"}) is None
    stored = IncidenteSeguridad.from_document(
        "i1", {"type": "Otro", "date": "2026-01-01", "time": "07:00", "routeId": "r1"}
    )
    assert stored is not None and stored.segment_id is None and stored.date == "2026-01-01"


def test_a_stored_incident_keeps_its_text_and_defaults_a_missing_severity_to_medium():
    base = {"date": "2026-01-01", "time": "07:00", "routeId": "r1"}

    legacy = IncidenteSeguridad.from_document("i1", {**base, "type": "fire"})
    chosen = IncidenteSeguridad.from_document("i2", {**base, "type": "Robo", "severity": "high"})
    unknown = IncidenteSeguridad.from_document("i3", {**base, "type": "Robo", "severity": "x"})

    assert legacy is not None and (legacy.type, legacy.severity) == ("fire", "medium")
    assert chosen is not None and (chosen.type, chosen.severity) == ("Robo", "high")
    assert unknown is not None and unknown.severity == "medium"
