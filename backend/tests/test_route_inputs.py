"""Ported from `functions/src/routes/domain/inputs.test.ts`."""

import pytest

from apps.routes.domain.geo import LatLng
from apps.routes.domain.models import (
    FactorDeRiesgo,
    FranjaHoraria,
    PuntoRuta,
    Ruta,
    TramoInput,
    parse_doc_id,
)
from apps.shared.domain.errors import DomainError, ErrorKind


def reason_of(call) -> str:
    with pytest.raises(DomainError) as error:
        call()
    assert error.value.kind is ErrorKind.INVALID_ARGUMENT
    return error.value.reason


def valid_route(**overrides) -> dict:
    return {
        "name": "  Parque Jipiro loop ",
        "cityId": "loja",
        "description": " Flat loop ",
        "start": {"lat": -3.97, "lng": -79.2, "label": "Main gate"},
        "end": {"lat": -3.98, "lng": -79.21, "label": "Lake"},
        "distanceKm": 5.2,
        "elevationGainM": 40,
        "surface": "asphalt",
        "difficulty": "beginner",
        "active": True,
        **overrides,
    }


class TestParseDocId:
    def test_accepts_firestore_auto_ids_and_slugs(self):
        assert parse_doc_id("aB3_x-Z9", "invalid-route-id") == "aB3_x-Z9"

    @pytest.mark.parametrize("value", ["", "a/b", "x" * 65, 42, None, "a b"])
    def test_rejects_malformed_ids_with_the_given_reason(self, value):
        assert reason_of(lambda: parse_doc_id(value, "invalid-route-id")) == "invalid-route-id"


class TestParseRoute:
    def test_trims_and_returns_a_valid_route(self):
        route = Ruta.parse(valid_route(), "r1")

        assert route == Ruta(
            id="r1",
            name="Parque Jipiro loop",
            city_id="loja",
            description="Flat loop",
            start=PuntoRuta(-3.97, -79.2, "Main gate"),
            end=PuntoRuta(-3.98, -79.21, "Lake"),
            distance_km=5.2,
            elevation_gain_m=40,
            surface="asphalt",
            difficulty="beginner",
            active=True,
        )

    def test_surface_and_difficulty_are_trimmed_free_text(self):
        route = Ruta.parse(valid_route(surface="  Adoquín ", difficulty="Media"), "r1")

        assert (route.surface, route.difficulty) == ("Adoquín", "Media")

    def test_defaults_description_to_empty_and_active_to_true(self):
        raw = valid_route()
        del raw["description"], raw["active"]

        route = Ruta.parse(raw, "r1")

        assert (route.description, route.active) == ("", True)

    @pytest.mark.parametrize(
        ("override", "reason"),
        [
            ({"name": " "}, "invalid-route-name"),
            ({"name": "x" * 81}, "invalid-route-name"),
            ({"cityId": "Loja"}, "invalid-city-id"),
            ({"description": 5}, "invalid-route-description"),
            ({"start": {"lat": 91, "lng": 0, "label": "x"}}, "invalid-route-start"),
            ({"start": {"lat": 0, "lng": 0, "label": ""}}, "invalid-route-start"),
            ({"end": None}, "invalid-route-end"),
            ({"end": {"lat": 0, "lng": 181, "label": "x"}}, "invalid-route-end"),
            ({"distanceKm": 0}, "invalid-distance"),
            ({"distanceKm": float("nan")}, "invalid-distance"),
            ({"distanceKm": 501}, "invalid-distance"),
            ({"distanceKm": True}, "invalid-distance"),
            ({"elevationGainM": -1}, "invalid-elevation-gain"),
            ({"surface": ""}, "invalid-surface"),
            ({"surface": "   "}, "invalid-surface"),
            ({"surface": "x" * 41}, "invalid-surface"),
            ({"surface": 3}, "invalid-surface"),
            ({"difficulty": ""}, "invalid-difficulty"),
            ({"difficulty": "x" * 41}, "invalid-difficulty"),
            ({"difficulty": None}, "invalid-difficulty"),
            ({"active": "yes"}, "invalid-active"),
            ({"active": None}, "invalid-active"),
        ],
    )
    def test_rejects_broken_input(self, override, reason):
        assert reason_of(lambda: Ruta.parse(valid_route(**override), "r1")) == reason

    def test_a_null_description_counts_as_empty(self):
        assert Ruta.parse(valid_route(description=None), "r1").description == ""

    def test_rejects_a_malformed_route_id(self):
        assert reason_of(lambda: Ruta.parse(valid_route(), "a/b")) == "invalid-route-id"

    def test_rejects_a_non_object_payload(self):
        assert reason_of(lambda: Ruta.parse(None, "r1")) == "invalid-route-name"


class TestParseSegment:
    COORDINATES = [{"lat": -3.97, "lng": -79.2}, {"lat": -3.971, "lng": -79.201}]
    POINTS = (LatLng(-3.97, -79.2), LatLng(-3.971, -79.201))

    def test_returns_name_coordinates_and_the_optional_order(self):
        with_order = TramoInput.parse(
            {"name": " Bridge ", "coordinates": self.COORDINATES, "order": 2}
        )
        without_order = TramoInput.parse({"name": "Bridge", "coordinates": self.COORDINATES})

        assert with_order == TramoInput("Bridge", self.POINTS, 2)
        assert without_order == TramoInput("Bridge", self.POINTS, None)

    def test_drops_extra_keys_from_coordinates(self):
        parsed = TramoInput.parse(
            {"name": "A", "coordinates": [{"lat": 1, "lng": 2, "x": 3}, {"lat": 1, "lng": 3}]}
        )

        assert parsed.coordinates[0] == LatLng(1, 2)

    def test_accepts_a_whole_number_sent_as_a_float(self):
        assert (
            TramoInput.parse({"name": "A", "coordinates": self.COORDINATES, "order": 2.0}).order
            == 2
        )

    @pytest.mark.parametrize(
        ("override", "reason"),
        [
            ({"name": ""}, "invalid-segment-name"),
            ({"coordinates": [{"lat": 0, "lng": 0}]}, "invalid-coordinates"),
            ({"coordinates": "x"}, "invalid-coordinates"),
            (
                {"coordinates": [{"lat": 0, "lng": 0}, {"lat": "a", "lng": 0}]},
                "invalid-coordinates",
            ),
            ({"coordinates": [{"lat": 0, "lng": 0}] * 501}, "invalid-coordinates"),
            ({"order": -1}, "invalid-segment-order"),
            ({"order": 1.5}, "invalid-segment-order"),
            ({"order": None}, "invalid-segment-order"),
            ({"order": True}, "invalid-segment-order"),
        ],
    )
    def test_rejects_broken_input(self, override, reason):
        raw = {"name": "A", "coordinates": self.COORDINATES, **override}

        assert reason_of(lambda: TramoInput.parse(raw)) == reason


class TestParseTimeSlot:
    def test_returns_a_valid_slot_with_optional_fields(self):
        full = FranjaHoraria.parse(
            {
                "label": " Night ",
                "startTime": "19:00",
                "endTime": "24:00",
                "validFrom": "2026-11-01",
                "validTo": "2026-12-31",
            },
            "s1",
        )
        plain = FranjaHoraria.parse({"startTime": "06:00", "endTime": "09:00"}, "s2")

        assert full == FranjaHoraria("s1", "19:00", "24:00", "Night", "2026-11-01", "2026-12-31")
        assert plain == FranjaHoraria("s2", "06:00", "09:00")

    def test_an_empty_label_is_dropped(self):
        slot = FranjaHoraria.parse({"startTime": "06:00", "endTime": "09:00", "label": " "}, "s1")

        assert slot.label is None

    @pytest.mark.parametrize(
        ("override", "reason"),
        [
            ({"startTime": "6:00"}, "invalid-start-time"),
            ({"startTime": "24:00", "endTime": "24:00"}, "invalid-start-time"),
            ({"endTime": "25:00"}, "invalid-end-time"),
            ({"startTime": "09:00", "endTime": "09:00"}, "invalid-time-range"),
            ({"startTime": "10:00", "endTime": "09:00"}, "invalid-time-range"),
            ({"label": "x" * 41}, "invalid-slot-label"),
            ({"label": 3}, "invalid-slot-label"),
            ({"validFrom": "2026-02-30"}, "invalid-valid-from"),
            ({"validTo": "tomorrow"}, "invalid-valid-to"),
            ({"validTo": None}, "invalid-valid-to"),
            ({"validFrom": "2026-12-31", "validTo": "2026-01-01"}, "invalid-date-range"),
        ],
    )
    def test_rejects_broken_input(self, override, reason):
        raw = {"startTime": "06:00", "endTime": "09:00", **override}

        assert reason_of(lambda: FranjaHoraria.parse(raw, "s1")) == reason

    def test_requires_both_bounds(self):
        assert reason_of(lambda: FranjaHoraria.parse({"endTime": "09:00"}, "s1")) == (
            "invalid-start-time"
        )
        assert reason_of(lambda: FranjaHoraria.parse({"startTime": "06:00"}, "s1")) == (
            "invalid-end-time"
        )

    def test_rejects_a_malformed_slot_id(self):
        raw = {"startTime": "06:00", "endTime": "09:00"}

        assert reason_of(lambda: FranjaHoraria.parse(raw, "a b")) == "invalid-time-slot-id"


class TestParseRiskFactor:
    def test_returns_a_factor_with_or_without_a_window(self):
        windowed = FactorDeRiesgo.parse(
            {
                "type": "traffic",
                "severity": "high",
                "description": " Busy ",
                "startTime": "17:00",
                "endTime": "19:00",
            },
            "f1",
        )
        plain = FactorDeRiesgo.parse(
            {"type": "other", "severity": "low", "description": "Dogs"}, "f2"
        )

        assert windowed == FactorDeRiesgo("f1", "traffic", "high", "Busy", "17:00", "19:00")
        assert plain == FactorDeRiesgo("f2", "other", "low", "Dogs")

    @pytest.mark.parametrize(
        ("override", "reason"),
        [
            ({"type": "  "}, "invalid-factor-type"),
            ({"type": "x" * 41}, "invalid-factor-type"),
            ({"type": 3}, "invalid-factor-type"),
            ({"severity": "extreme"}, "invalid-severity"),
            ({"description": " "}, "invalid-factor-description"),
            ({"description": "x" * 201}, "invalid-factor-description"),
            ({"startTime": "17:00"}, "invalid-time-range"),
            ({"endTime": "17:00"}, "invalid-time-range"),
            ({"startTime": "18:00", "endTime": "17:00"}, "invalid-time-range"),
            ({"startTime": "x", "endTime": "17:00"}, "invalid-start-time"),
            ({"startTime": None, "endTime": "17:00"}, "invalid-start-time"),
            ({"startTime": "17:00", "endTime": "26:00"}, "invalid-end-time"),
        ],
    )
    def test_rejects_broken_input(self, override, reason):
        raw = {"type": "traffic", "severity": "low", "description": "Busy", **override}

        assert reason_of(lambda: FactorDeRiesgo.parse(raw, "f1")) == reason

    def test_the_type_is_trimmed_free_text(self):
        raw = {"type": "  Perros sueltos ", "severity": "low", "description": "Busy"}

        assert FactorDeRiesgo.parse(raw, "f1").type == "Perros sueltos"

    def test_rejects_a_malformed_factor_id(self):
        raw = {"type": "traffic", "severity": "low", "description": "Busy"}

        assert reason_of(lambda: FactorDeRiesgo.parse(raw, "x/y")) == "invalid-risk-factor-id"


class TestStoredDocuments:
    def test_a_malformed_stored_factor_is_ignored(self):
        assert FactorDeRiesgo.from_document("f1", {"type": 7, "severity": "low"}) is None
        assert FactorDeRiesgo.from_document("f1", {"type": "other", "severity": "x"}) is None

    def test_a_stored_factor_type_is_never_rewritten(self):
        factor = FactorDeRiesgo.from_document("f1", {"type": "crime", "severity": "low"})

        assert factor is not None and factor.type == "crime"

    def test_a_factor_round_trips(self):
        factor = FactorDeRiesgo("f1", "traffic", "high", "Busy", "17:00", "19:00")

        assert factor.to_document() == {
            "type": "traffic",
            "severity": "high",
            "description": "Busy",
            "startTime": "17:00",
            "endTime": "19:00",
        }
        assert FactorDeRiesgo.from_document("f1", factor.to_document()) == factor

    def test_a_slot_round_trips(self):
        slot = FranjaHoraria("s1", "06:00", "09:00", "Morning", "2026-01-01", "2026-12-31")

        assert FranjaHoraria.from_document("s1", slot.to_document()) == slot
        assert FranjaHoraria("s2", "06:00", "09:00").to_document() == {
            "startTime": "06:00",
            "endTime": "09:00",
        }

    def test_a_route_reads_tolerantly(self):
        route = Ruta.from_document("r1", {"name": 7, "surface": "Adoquín", "safety": "x"})

        assert route.name == "r1"
        assert (route.surface, route.difficulty, route.active) == ("Adoquín", "", False)
        assert route.safety == {}

    def test_a_route_keeps_the_computed_fields(self):
        stored = Ruta.parse(valid_route(), "r1").to_document()

        route = Ruta.from_document(
            "r1", {**stored, "segmentCount": 3, "safety": {"morning": {"score": 90}}}
        )

        assert route.segment_count == 3
        assert route.safety == {"morning": {"score": 90}}
        assert route.to_document() == stored
