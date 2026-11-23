import pytest

from apps.cities.domain.models import Ciudad
from tests.conftest import bearer

CITIES = "/api/v1/cities"
LOJA_URL = f"{CITIES}/loja"
LOJA = Ciudad("loja", "Loja", "Loja", "city", -3.99, -79.2, "active", None, "EC")
ZONE = Ciudad("loja-centro", "Centro", "Loja", "zone", -3.99, -79.2, "planned", "loja", "EC")
NEW_CITY = {
    "id": "quito",
    "name": "Quito",
    "province": "Pichincha",
    "type": "city",
    "location": {"lat": -0.18, "lng": -78.46},
    "coverage": "planned",
}


@pytest.fixture(autouse=True)
def cities(firebase):
    firebase.cities.update({"loja": LOJA, "loja-centro": ZONE})


def error_of(response) -> dict:
    return response.json()["error"]


class TestListCities:
    def test_is_public(self, client):
        response = client.get(CITIES)

        assert response.status_code == 200
        assert [city["id"] for city in response.json()["cities"]] == ["loja-centro", "loja"]

    def test_describes_each_city_and_zone(self, client):
        cities = {city["id"]: city for city in client.get(CITIES).json()["cities"]}

        assert cities["loja"] == {
            "id": "loja",
            "name": "Loja",
            "province": "Loja",
            "country": "EC",
            "type": "city",
            "parentCityId": None,
            "location": {"lat": -3.99, "lng": -79.2},
            "coverage": "active",
        }
        assert cities["loja-centro"]["parentCityId"] == "loja"

    def test_filters_by_coverage(self, client):
        response = client.get(CITIES, {"coverage": "active"})

        assert [city["id"] for city in response.json()["cities"]] == ["loja"]

    def test_rejects_unknown_parameters(self, client):
        assert error_of(client.get(CITIES, {"page": "2"}))["reason"] == "invalid-argument"

    def test_a_signed_in_runner_reads_it_too(self, client):
        assert client.get(CITIES, **bearer("runner-token")).status_code == 200

    def test_a_bad_token_is_still_rejected(self, client):
        assert client.get(CITIES, **bearer("revoked-token")).status_code == 401


@pytest.mark.parametrize(
    ("method", "url"), [("post", CITIES), ("patch", LOJA_URL), ("delete", LOJA_URL)]
)
class TestMutationAuthorization:
    def test_anonymous_callers_are_unauthenticated(self, client, method, url):
        response = getattr(client, method)(url, NEW_CITY, format="json")

        assert response.status_code == 401
        assert error_of(response)["reason"] == "unauthenticated"

    @pytest.mark.parametrize("token", ["runner-token", "club-rep-token", "manager-token"])
    def test_need_cities_manage(self, client, firebase, method, url, token):
        response = getattr(client, method)(url, NEW_CITY, format="json", **bearer(token))

        assert response.status_code == 403
        assert error_of(response) == {
            "reason": "missing-permission",
            "message": "Missing permission cities.manage.",
        }
        assert set(firebase.cities) == {"loja", "loja-centro"}


class TestCreateCity:
    @pytest.mark.parametrize("token", ["cataloguer-token", "admin-token"])
    def test_stores_the_city(self, client, firebase, token):
        response = client.post(CITIES, NEW_CITY, format="json", **bearer(token))

        assert response.status_code == 201
        assert response.json()["id"] == "quito"
        assert firebase.cities["quito"].province == "Pichincha"

    def test_an_existing_id_is_a_conflict(self, client):
        body = {**NEW_CITY, "id": "loja"}

        response = client.post(CITIES, body, format="json", **bearer("admin-token"))

        assert response.status_code == 409
        assert error_of(response)["reason"] == "city-exists"

    def test_domain_rules_use_their_reason(self, client):
        body = {**NEW_CITY, "coverage": ""}

        response = client.post(CITIES, body, format="json", **bearer("admin-token"))

        assert response.status_code == 400
        assert error_of(response)["reason"] == "invalid-coverage"

    def test_rejects_unknown_fields(self, client, firebase):
        body = {**NEW_CITY, "country": "PE"}

        response = client.post(CITIES, body, format="json", **bearer("admin-token"))

        assert response.status_code == 400
        assert error_of(response)["fields"] == {"country": "unknown"}
        assert "quito" not in firebase.cities


class TestUpdateCity:
    def test_changes_the_given_fields(self, client, firebase):
        body = {"coverage": "suspended", "name": "Loja ciudad"}

        response = client.patch(LOJA_URL, body, format="json", **bearer("cataloguer-token"))

        assert response.status_code == 200
        assert response.json()["coverage"] == "suspended"
        assert firebase.cities["loja"].name == "Loja ciudad"

    def test_the_type_is_free_text_and_editable(self, client, firebase):
        response = client.patch(
            LOJA_URL, {"type": "Región"}, format="json", **bearer("cataloguer-token")
        )

        assert response.status_code == 200
        assert firebase.cities["loja"].type == "Región"

    def test_the_id_cannot_change(self, client, firebase):
        response = client.patch(LOJA_URL, {"id": "x"}, format="json", **bearer("cataloguer-token"))

        assert response.status_code == 400
        assert error_of(response)["fields"] == {"id": "unknown"}

    def test_a_missing_city_is_not_found(self, client):
        response = client.patch(f"{CITIES}/ghost", {}, format="json", **bearer("cataloguer-token"))

        assert response.status_code == 404
        assert error_of(response)["reason"] == "city-not-found"


class TestDeleteCity:
    def test_removes_a_free_city(self, client, firebase):
        firebase.cities["quito"] = Ciudad.parse(NEW_CITY, "EC")

        response = client.delete(f"{CITIES}/quito", **bearer("cataloguer-token"))

        assert response.status_code == 204
        assert "quito" not in firebase.cities

    def test_a_city_with_zones_is_refused(self, client, firebase):
        response = client.delete(LOJA_URL, **bearer("cataloguer-token"))

        assert response.status_code == 400
        assert error_of(response)["reason"] == "city-has-zones"
        assert "loja" in firebase.cities

    def test_a_city_with_routes_is_refused(self, client, firebase):
        del firebase.cities["loja-centro"]
        firebase.docs["routes/r1"] = {"cityId": "loja"}

        response = client.delete(LOJA_URL, **bearer("cataloguer-token"))

        assert response.status_code == 400
        assert error_of(response)["reason"] == "city-has-routes"

    def test_a_missing_city_is_not_found(self, client):
        response = client.delete(f"{CITIES}/ghost", **bearer("cataloguer-token"))

        assert response.status_code == 404
        assert error_of(response)["reason"] == "city-not-found"
