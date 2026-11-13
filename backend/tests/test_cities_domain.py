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
        assert Ciudad.parse(LOJA) == Ciudad("loja", "Loja", "Loja", "city", -3.99, -79.2, "active")

    def test_a_zone_names_its_parent_city(self):
        zone = Ciudad.parse({**LOJA, "id": "loja-centro", "type": "zone", "parentCityId": "loja"})

        assert zone.type == "zone"
        assert zone.parent_city_id == "loja"

    @pytest.mark.parametrize(
        ("override", "reason"),
        [
            ({"id": "Loja"}, "invalid-city-id"),
            ({"id": "a"}, "invalid-city-id"),
            ({"name": " "}, "invalid-city-name"),
            ({"name": "x" * 81}, "invalid-city-name"),
            ({"province": ""}, "invalid-city-province"),
            ({"province": 5}, "invalid-city-province"),
            ({"type": "region"}, "invalid-city-type"),
            ({"coverage": "unknown"}, "invalid-coverage"),
            ({"location": None}, "invalid-city-location"),
            ({"location": {"lat": 91, "lng": 0}}, "invalid-city-location"),
            ({"location": {"lat": 0, "lng": -181}}, "invalid-city-location"),
            ({"location": {"lat": "0", "lng": 0}}, "invalid-city-location"),
            ({"location": {"lat": True, "lng": 0}}, "invalid-city-location"),
            ({"location": {"lat": 0}}, "invalid-city-location"),
            ({"parentCityId": "loja"}, "invalid-parent-city"),
            ({"type": "zone"}, "invalid-parent-city"),
            ({"type": "zone", "parentCityId": "loja"}, "invalid-parent-city"),
            ({"type": "zone", "parentCityId": "Bad Id"}, "invalid-parent-city"),
        ],
    )
    def test_rejects_broken_input(self, override, reason):
        assert reason_of(lambda: Ciudad.parse({**LOJA, **override})) == reason

    def test_requires_every_field(self):
        assert reason_of(lambda: Ciudad.parse({})) == "invalid-city-id"


class TestWithChanges:
    ZONE = Ciudad("loja-centro", "Centro", "Loja", "zone", -3.99, -79.2, "planned", "loja")

    def test_replaces_only_the_given_fields(self):
        changed = self.ZONE.with_changes({"coverage": "active", "location": {"lat": 1, "lng": 2}})

        assert changed == Ciudad("loja-centro", "Centro", "Loja", "zone", 1, 2, "active", "loja")

    def test_validates_the_result(self):
        assert reason_of(lambda: self.ZONE.with_changes({"name": ""})) == "invalid-city-name"
        assert reason_of(lambda: self.ZONE.with_changes({"parentCityId": None})) == (
            "invalid-parent-city"
        )

    def test_a_city_cannot_get_a_parent(self):
        city = Ciudad.parse(LOJA)

        assert reason_of(lambda: city.with_changes({"parentCityId": "quito"})) == (
            "invalid-parent-city"
        )


class TestStoredDocuments:
    def test_reads_tolerantly(self):
        city = Ciudad.from_document("old", {"name": 5, "location": "x", "coverage": "bogus"})

        assert city == Ciudad("old", "old", "", "city", 0, 0, "planned")

    def test_round_trips_the_stored_fields(self):
        zone = Ciudad("loja-centro", "Centro", "Loja", "zone", -3.99, -79.2, "active", "loja")

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
        assert "parentCityId" not in Ciudad.parse(LOJA).to_document()


def test_parse_city_id_and_coverage():
    assert parse_city_id("loja-2") == "loja-2"
    assert reason_of(lambda: parse_city_id("x/y")) == "invalid-city-id"
    assert parse_coverage("planned") == "planned"
    assert reason_of(lambda: parse_coverage("off")) == "invalid-coverage"
