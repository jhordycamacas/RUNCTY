import pytest

from apps.cities.domain.models import Ciudad, parse_city_id, parse_coverage
from apps.shared.domain.errors import DomainError, ErrorKind

LOJA = {
    "id": "loja",
    "name": "  Loja ",
    "province": "Loja",
    "type": "city",
    "location": {"lat": -3.99, "lng": -79.2},
    "coverage": "active",
}


def reason_of(call) -> str:
    with pytest.raises(DomainError) as error:
        call()
    assert error.value.kind is ErrorKind.INVALID_ARGUMENT
    return error.value.reason


class TestParse:
    def test_trims_and_returns_a_city(self):
        assert Ciudad.parse(LOJA, "EC") == Ciudad(
            "loja", "Loja", "Loja", "city", -3.99, -79.2, "active", None, "EC"
        )

    def test_a_parent_city_makes_it_a_zone_whatever_the_type_text(self):
        zone = Ciudad.parse(
            {**LOJA, "id": "loja-centro", "type": " Barrio ", "parentCityId": "loja"}, "EC"
        )

        assert zone.type == "Barrio"
        assert zone.parent_city_id == "loja"

    def test_type_and_coverage_are_free_text(self):
        city = Ciudad.parse({**LOJA, "type": "Región", "coverage": " En estudio "}, "EC")

        assert (city.type, city.coverage) == ("Región", "En estudio")

    @pytest.mark.parametrize(
        ("override", "reason"),
        [
            ({"id": "Loja"}, "invalid-city-id"),
            ({"id": "a"}, "invalid-city-id"),
            ({"name": " "}, "invalid-city-name"),
            ({"name": "x" * 81}, "invalid-city-name"),
            ({"province": ""}, "invalid-city-province"),
            ({"province": 5}, "invalid-city-province"),
            ({"type": " "}, "invalid-city-type"),
            ({"type": 5}, "invalid-city-type"),
            ({"type": "x" * 41}, "invalid-city-type"),
            ({"coverage": ""}, "invalid-coverage"),
            ({"coverage": None}, "invalid-coverage"),
            ({"coverage": "x" * 61}, "invalid-coverage"),
            ({"location": None}, "invalid-city-location"),
            ({"location": {"lat": 91, "lng": 0}}, "invalid-city-location"),
            ({"location": {"lat": 0, "lng": -181}}, "invalid-city-location"),
            ({"location": {"lat": "0", "lng": 0}}, "invalid-city-location"),
            ({"location": {"lat": True, "lng": 0}}, "invalid-city-location"),
            ({"location": {"lat": 0}}, "invalid-city-location"),
            ({"parentCityId": "loja"}, "invalid-parent-city"),
            ({"parentCityId": "Bad Id"}, "invalid-parent-city"),
            ({"parentCityId": 5}, "invalid-parent-city"),
        ],
    )
    def test_rejects_broken_input(self, override, reason):
        assert reason_of(lambda: Ciudad.parse({**LOJA, **override}, "EC")) == reason

    def test_requires_every_field(self):
        assert reason_of(lambda: Ciudad.parse({}, "EC")) == "invalid-city-id"


class TestWithChanges:
    ZONE = Ciudad("loja-centro", "Centro", "Loja", "zone", -3.99, -79.2, "planned", "loja", "EC")

    def test_replaces_only_the_given_fields(self):
        changed = self.ZONE.with_changes({"coverage": "active", "location": {"lat": 1, "lng": 2}})

        assert changed == Ciudad(
            "loja-centro", "Centro", "Loja", "zone", 1, 2, "active", "loja", "EC"
        )

    def test_validates_the_result(self):
        assert reason_of(lambda: self.ZONE.with_changes({"name": ""})) == "invalid-city-name"
        assert reason_of(lambda: self.ZONE.with_changes({"type": ""})) == "invalid-city-type"

    def test_type_and_parent_can_change(self):
        changed = self.ZONE.with_changes({"type": "Barrio", "parentCityId": None})

        assert (changed.type, changed.parent_city_id) == ("Barrio", None)


class TestStoredDocuments:
    def test_reads_tolerantly(self):
        city = Ciudad.from_document("old", {"name": 5, "location": "x", "coverage": 3})

        assert city == Ciudad("old", "old", "", "city", 0, 0, "planned")

    def test_keeps_stored_free_text_as_written(self):
        city = Ciudad.from_document("x", {"type": "Región", "coverage": "En estudio"})

        assert (city.type, city.coverage) == ("Región", "En estudio")

    def test_round_trips_the_stored_fields(self):
        zone = Ciudad("loja-centro", "Centro", "Loja", "zone", -3.99, -79.2, "active", "loja", "EC")

        document = zone.to_document()

        assert document == {
            "name": "Centro",
            "province": "Loja",
            "country": "EC",
            "type": "zone",
            "parentCityId": "loja",
            "location": {"lat": -3.99, "lng": -79.2},
            "coverage": "active",
        }
        assert Ciudad.from_document("loja-centro", document) == zone

    def test_a_city_has_no_parent_field(self):
        assert "parentCityId" not in Ciudad.parse(LOJA, "EC").to_document()


def test_parse_city_id_and_coverage():
    assert parse_city_id("loja-2") == "loja-2"
    assert reason_of(lambda: parse_city_id("x/y")) == "invalid-city-id"
    assert parse_coverage(" planned ") == "planned"
    assert reason_of(lambda: parse_coverage(" ")) == "invalid-coverage"
