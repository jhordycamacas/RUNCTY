import pytest
from rest_framework.throttling import SimpleRateThrottle

from apps.shared.domain.errors import DomainError
from apps.users.application.use_cases import search_users
from apps.users.domain.models import Usuario
from apps.users.domain.search import (
    MAX_PAGE_SIZE,
    ScanBudget,
    SearchQuery,
    equality_filters,
    matches_name_prefixes,
    normalize_name,
    parse_search_query,
)
from apps.users.presentation.serializers import UserSummarySerializer
from tests.conftest import bearer
from tests.fakes import InMemoryUserRepository

URL = "/api/v1/users"


def user(uid: str, first_name: str, last_name: str, **extra) -> dict:
    return {
        "uid": uid,
        "email": f"{uid}@runcty.dev",
        "firstName": first_name,
        "lastName": last_name,
        "birthDate": "1990-01-01",
        "cityId": "loja",
        "role": "runner",
        "idNumber": "1104567890",
        "consent": {"lopdp": True},
        **extra,
    }


class TestParseSearchQuery:
    def test_trims_filters_lowercases_the_email_and_caps_the_page_size(self):
        raw = {"firstName": " Ana ", "email": " Ana@RUNCTY.dev ", "limit": 500}

        assert parse_search_query(raw) == SearchQuery(
            filters={"firstName": "Ana", "email": "ana@runcty.dev"},
            limit=MAX_PAGE_SIZE,
            cursor=None,
        )

    def test_drops_empty_filters_and_defaults_the_page_size(self):
        empty = SearchQuery(filters={}, limit=20, cursor=None)

        assert parse_search_query({"lastName": "   ", "cityId": "", "cursor": ""}) == empty
        assert parse_search_query(None) == empty

    @pytest.mark.parametrize(
        ("raw", "reason"),
        [
            ({"birthDate": "01/01/1990"}, "invalid-filter"),
            ({"idNumber": "123"}, "invalid-filter"),
            ({"firstName": 42}, "invalid-filter"),
            ({"firstName": "x" * 121}, "invalid-filter"),
            ({"limit": 0}, "invalid-limit"),
            ({"limit": 1.5}, "invalid-limit"),
            ({"limit": "ten"}, "invalid-limit"),
            ({"limit": True}, "invalid-limit"),
            ({"cursor": 5}, "invalid-cursor"),
            ({"cursor": "x" * 129}, "invalid-cursor"),
            ({"cursor": "u1/private/preferences"}, "invalid-cursor"),
        ],
    )
    def test_rejects_malformed_filters(self, raw, reason):
        with pytest.raises(DomainError) as error:
            parse_search_query(raw)

        assert error.value.reason == reason

    def test_reads_the_limit_of_a_query_string(self):
        assert parse_search_query({"limit": "7", "cursor": "u3"}) == SearchQuery({}, 7, "u3")


def test_maps_exact_match_filters_to_equality_filters():
    filters = {
        "email": "a@b.ec",
        "idNumber": "1104567890",
        "birthDate": "1990-01-01",
        "cityId": "loja",
        "firstName": "Ana",
    }

    assert equality_filters(filters) == [
        ("email", "a@b.ec"),
        ("idNumber", "1104567890"),
        ("birthDate", "1990-01-01"),
        ("cityId", "loja"),
    ]


class TestNameMatching:
    def test_normalizes_case_and_accents(self):
        assert normalize_name("  JOSÉ   Ñandú ") == "jose nandu"

    def test_matches_case_and_accent_insensitive_prefixes(self):
        jose = Usuario.from_document("u1", user("u1", "José", "Ordóñez"))

        assert matches_name_prefixes(jose, {"firstName": "jos", "lastName": "ORDO"})
        assert not matches_name_prefixes(jose, {"firstName": "ose"})
        assert matches_name_prefixes(jose, {})


def test_summary_returns_only_the_fields_the_admin_panel_needs():
    ana = Usuario.from_document("u1", user("u1", "Ana", "Paz"))

    assert UserSummarySerializer(ana).data == {
        "uid": "u1",
        "email": "u1@runcty.dev",
        "firstName": "Ana",
        "lastName": "Paz",
        "birthDate": "1990-01-01",
        "cityId": "loja",
        "role": "runner",
    }


@pytest.fixture
def four_users(firebase) -> None:
    firebase.users.clear()
    for uid, first_name, last_name in [
        ("a", "Ana", "Paz"),
        ("b", "Bruno", "Ríos"),
        ("c", "Andrés", "Loja"),
        ("d", "Ángela", "Mora"),
    ]:
        firebase.users[uid] = user(uid, first_name, last_name)


class TestSearchUsers:
    def search(self, firebase, budget: ScanBudget | None = None, **query):
        users = InMemoryUserRepository(firebase)
        parsed = parse_search_query(query)
        return search_users(parsed, users, budget) if budget else search_users(parsed, users)

    def test_applies_the_equality_filters_in_the_scan(self, firebase, four_users):
        firebase.users["b"]["cityId"] = "quito"

        page = self.search(firebase, cityId="loja")

        assert [found.uid for found in page.users] == ["a", "c", "d"]
        assert page.next_cursor is None

    def test_filters_names_in_memory_and_paginates_with_a_cursor(self, firebase, four_users):
        first = self.search(firebase, firstName="an", limit=2)

        assert [found.uid for found in first.users] == ["a", "c"]
        assert first.next_cursor == "c"

        second = self.search(firebase, firstName="an", limit=2, cursor=first.next_cursor)

        assert [found.uid for found in second.users] == ["d"]
        assert second.next_cursor is None

    def test_stops_at_the_scan_budget_and_returns_a_cursor_to_continue(self, firebase):
        firebase.users.clear()
        for index in range(30):
            firebase.users[f"u{index:02}"] = user(f"u{index:02}", "Zoe", "X")

        page = self.search(firebase, ScanBudget(batch_size=10, max_scanned=20), firstName="ana")

        assert page.users == []
        assert page.next_cursor == "u19"

    def test_reads_in_batches_until_the_page_is_full(self, firebase):
        firebase.users.clear()
        for index in range(30):
            firebase.users[f"u{index:02}"] = user(f"u{index:02}", "Zoe", "X")

        page = self.search(firebase, ScanBudget(batch_size=10, max_scanned=1000), limit=25)

        assert len(page.users) == 25
        assert page.next_cursor == "u24"


class TestSearchEndpoint:
    def test_anonymous_callers_are_unauthenticated(self, client):
        assert client.get(URL).status_code == 401

    @pytest.mark.parametrize("token", ["runner-token", "club-rep-token"])
    def test_requires_users_read(self, client, token):
        response = client.get(URL, **bearer(token))

        assert response.status_code == 403
        assert response.json()["error"] == {
            "reason": "missing-permission",
            "message": "Missing permission users.read.",
        }

    def test_returns_a_page_of_summaries(self, client, four_users):
        response = client.get(URL, {"firstName": "an", "limit": "2"}, **bearer("user-reader-token"))

        assert response.status_code == 200
        assert response.json() == {
            "users": [
                {
                    "uid": "a",
                    "email": "a@runcty.dev",
                    "firstName": "Ana",
                    "lastName": "Paz",
                    "birthDate": "1990-01-01",
                    "cityId": "loja",
                    "role": "runner",
                },
                {
                    "uid": "c",
                    "email": "c@runcty.dev",
                    "firstName": "Andrés",
                    "lastName": "Loja",
                    "birthDate": "1990-01-01",
                    "cityId": "loja",
                    "role": "runner",
                },
            ],
            "nextCursor": "c",
        }

    def test_continues_from_the_cursor(self, client, four_users):
        response = client.get(URL, {"firstName": "an", "cursor": "c"}, **bearer("admin-token"))

        assert [found["uid"] for found in response.json()["users"]] == ["d"]
        assert response.json()["nextCursor"] is None

    def test_malformed_filters_keep_the_reason_of_the_domain(self, client):
        response = client.get(URL, {"idNumber": "123"}, **bearer("user-reader-token"))

        assert response.status_code == 400
        assert response.json()["error"]["reason"] == "invalid-filter"

    def test_unknown_parameters_are_rejected(self, client):
        response = client.get(URL, {"role": "admin"}, **bearer("user-reader-token"))

        assert response.status_code == 400
        assert response.json()["error"]["fields"] == {"role": "unknown"}

    def test_has_a_stricter_rate_limit_than_the_rest_of_the_api(self, client, monkeypatch):
        monkeypatch.setitem(SimpleRateThrottle.THROTTLE_RATES, "sensitive", "1/min")

        assert client.get(URL, **bearer("user-reader-token")).status_code == 200
        assert client.get(URL, **bearer("user-reader-token")).status_code == 429
        assert client.get("/api/v1/users/me", **bearer("user-reader-token")).status_code == 200
