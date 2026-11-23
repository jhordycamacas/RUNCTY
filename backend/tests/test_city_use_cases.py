import pytest

from apps.cities.application.use_cases import (
    CitiesDeps,
    create_city,
    delete_city,
    list_cities,
    update_city,
)
from apps.cities.domain.models import Ciudad
from apps.shared.domain.errors import DomainError, ErrorKind
from tests.fakes import SETTINGS, InMemoryCityRepository, InMemoryCityUsage

LOJA = Ciudad("loja", "Loja", "Loja", "city", -3.99, -79.2, "active")
ZONE = Ciudad("loja-centro", "Centro", "Loja", "zone", -3.99, -79.2, "planned", "loja")
NEW_CITY = {
    "id": "quito",
    "name": "Quito",
    "province": "Pichincha",
    "type": "city",
    "location": {"lat": -0.18, "lng": -78.46},
    "coverage": "planned",
}


@pytest.fixture
def deps(firebase) -> CitiesDeps:
    firebase.cities.update(loja=LOJA)
    return CitiesDeps(cities=InMemoryCityRepository(), usage=InMemoryCityUsage(), settings=SETTINGS)


def failure(call) -> DomainError:
    with pytest.raises(DomainError) as error:
        call()
    return error.value


class TestListCities:
    def test_sorts_by_name_and_filters_by_coverage(self, firebase, deps):
        firebase.cities.update(
            ambato=Ciudad("ambato", "Ámbar", "Tungurahua", "city", 0, 0, "planned"),
            zeta=Ciudad("zeta", "zeta", "Loja", "city", 0, 0, "suspended"),
        )

        assert [city.id for city in list_cities(None, deps.cities)] == ["ambato", "loja", "zeta"]
        assert [city.id for city in list_cities("planned", deps.cities)] == ["ambato"]

    def test_rejects_an_unknown_coverage(self, deps):
        assert failure(lambda: list_cities("off", deps.cities)).reason == "invalid-coverage"


class TestCreateCity:
    def test_stores_the_city(self, firebase, deps):
        city = create_city(NEW_CITY, deps)

        assert firebase.cities["quito"] == city
        assert city.name == "Quito"

    def test_rejects_an_existing_id(self, deps):
        error = failure(lambda: create_city({**NEW_CITY, "id": "loja"}, deps))

        assert (error.kind, error.reason) == (ErrorKind.ALREADY_EXISTS, "city-exists")

    def test_a_zone_needs_an_existing_city_as_parent(self, firebase, deps):
        zone = {**NEW_CITY, "id": "loja-sur", "type": "zone"}

        create_city({**zone, "parentCityId": "loja"}, deps)
        assert firebase.cities["loja-sur"].parent_city_id == "loja"

        for parent in ("ghost", "loja-sur", "loja-centro"):
            firebase.cities["loja-centro"] = ZONE
            error = failure(
                lambda parent=parent: create_city({**zone, "parentCityId": parent}, deps)
            )
            assert error.reason == "invalid-parent-city"

    def test_invalid_input_writes_nothing(self, firebase, deps):
        assert failure(lambda: create_city({**NEW_CITY, "name": ""}, deps)).reason == (
            "invalid-city-name"
        )
        assert set(firebase.cities) == {"loja"}


class TestUpdateCity:
    def test_changes_the_given_fields(self, firebase, deps):
        city = update_city("loja", {"coverage": "suspended"}, deps)

        assert city.coverage == "suspended"
        assert firebase.cities["loja"] == city

    def test_reports_a_missing_city(self, deps):
        error = failure(lambda: update_city("ghost", {}, deps))

        assert (error.kind, error.reason) == (ErrorKind.NOT_FOUND, "city-not-found")

    def test_rejects_a_malformed_id(self, deps):
        assert failure(lambda: update_city("Bad", {}, deps)).reason == "invalid-city-id"

    def test_a_zone_cannot_move_under_a_zone(self, firebase, deps):
        firebase.cities["loja-centro"] = ZONE
        firebase.cities["loja-sur"] = Ciudad(
            "loja-sur", "Sur", "Loja", "zone", 0, 0, "planned", "loja"
        )

        error = failure(lambda: update_city("loja-sur", {"parentCityId": "loja-centro"}, deps))

        assert error.reason == "invalid-parent-city"


class TestDeleteCity:
    """RF-04-4: ported from `deleteCity.test.ts`."""

    def test_deletes_a_city_without_routes_or_zones(self, firebase, deps):
        firebase.cities["quito"] = Ciudad.parse(NEW_CITY, "EC")

        delete_city("quito", deps)

        assert "quito" not in firebase.cities

    def test_rejects_a_city_with_associated_routes(self, firebase, deps):
        firebase.docs["routes/r1"] = {"cityId": "loja"}

        error = failure(lambda: delete_city("loja", deps))

        assert (error.kind, error.reason) == (ErrorKind.FAILED_PRECONDITION, "city-has-routes")
        assert "loja" in firebase.cities

    def test_rejects_a_city_that_still_has_zones(self, firebase, deps):
        firebase.cities["loja-centro"] = ZONE

        error = failure(lambda: delete_city("loja", deps))

        assert (error.kind, error.reason) == (ErrorKind.FAILED_PRECONDITION, "city-has-zones")
        assert "loja" in firebase.cities

    def test_reports_a_missing_city(self, deps):
        error = failure(lambda: delete_city("ghost", deps))

        assert (error.kind, error.reason) == (ErrorKind.NOT_FOUND, "city-not-found")

    @pytest.mark.parametrize("city_id", ["", "Loja", "a/b", 42, None, "x" * 65])
    def test_rejects_malformed_ids(self, deps, city_id):
        assert failure(lambda: delete_city(city_id, deps)).reason == "invalid-city-id"
