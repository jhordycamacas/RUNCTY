import pytest
from rest_framework.throttling import SimpleRateThrottle

from apps.shared.domain.errors import DomainError
from apps.users.application.use_cases import search_users
from apps.users.domain.models import Usuario
from apps.users.domain.search import (
    MAX_PAGE_SIZE,
    ScanBudget,
    SearchQuery,
    equality_filter,
    matches_text,
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


def profile(first_name: str, last_name: str, email: str = "x@runcty.dev") -> Usuario:
    return Usuario.from_document("u1", user("u1", first_name, last_name, email=email))


class TestParseSearchQuery:
    def test_trims_the_text_and_caps_the_page_size(self):
        assert parse_search_query({"q": "  Ana Paz ", "limit": 500}) == SearchQuery(
            text="Ana Paz", limit=MAX_PAGE_SIZE, cursor=None
        )

    def test_no_text_lists_everyone_with_the_default_page_size(self):
        everyone = SearchQuery(text="", limit=20, cursor=None)

        assert parse_search_query({"q": "   ", "cursor": ""}) == everyone
        assert parse_search_query({}) == everyone
        assert parse_search_query(None) == everyone

    @pytest.mark.parametrize(
        ("raw", "reason"),
        [
            ({"q": 42}, "invalid-filter"),
            ({"q": ["ana"]}, "invalid-filter"),
            ({"q": "x" * 121}, "invalid-filter"),
            ({"limit": 0}, "invalid-limit"),
            ({"limit": 1.5}, "invalid-limit"),
            ({"limit": "ten"}, "invalid-limit"),
            ({"limit": True}, "invalid-limit"),
            ({"cursor": 5}, "invalid-cursor"),
            ({"cursor": "x" * 129}, "invalid-cursor"),
            ({"cursor": "u1/private/preferences"}, "invalid-cursor"),
        ],
    )
    def test_rejects_malformed_input(self, raw, reason):
        with pytest.raises(DomainError) as error:
            parse_search_query(raw)

        assert error.value.reason == reason

    def test_accepts_the_longest_text(self):
        assert parse_search_query({"q": "x" * 120}).text == "x" * 120

    def test_reads_the_limit_of_a_query_string(self):
        assert parse_search_query({"limit": "7", "cursor": "u3"}) == SearchQuery("", 7, "u3")


class TestEqualityFilter:
    def test_ten_ascii_digits_are_an_id_number(self):
        assert equality_filter("1104567890") == ("idNumber", "1104567890")

    def test_an_at_sign_is_an_email_in_lowercase(self):
        assert equality_filter("Ana@RUNCTY.dev") == ("email", "ana@runcty.dev")

    @pytest.mark.parametrize(
        "text", ["", "Ana", "110456789", "11045678901", "11045 6789", "١١٠٤٥٦٧٨٩٠"]
    )
    def test_anything_else_is_a_name_search(self, text):
        assert equality_filter(text) is None


class TestNameMatching:
    def test_normalizes_case_and_accents(self):
        assert normalize_name("  JOSÉ   Ñandú ") == "jose nandu"

    def test_matches_case_and_accent_insensitive_prefixes_of_the_names(self):
        jose = profile("José Luis", "Ordóñez")

        assert matches_text(jose, "jos")
        assert matches_text(jose, "ORDO")
        assert matches_text(jose, "luis")
        assert not matches_text(jose, "ose")

    def test_every_word_must_match_some_word_of_the_name(self):
        jose = profile("José", "Ordóñez Paz")

        assert matches_text(jose, "paz jos")
        assert matches_text(jose, "  jo   ord ")
        assert not matches_text(jose, "jose mora")

    def test_matches_the_prefix_of_the_email_local_part_only(self):
        ana = profile("Ana", "Paz", email="Ana.Paz99@runcty.dev")

        assert matches_text(ana, "ana.paz9")
        assert not matches_text(ana, "runcty")
        assert not matches_text(ana, "paz99")

    def test_no_text_matches_everyone(self):
        assert matches_text(profile("Ana", "Paz"), "")


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
    for uid, first_name, last_name, id_number in [
        ("a", "Ana", "Paz", "1100000001"),
        ("b", "Bruno", "Ríos", "1100000002"),
        ("c", "Andrés", "Loja", "1100000003"),
        ("d", "Ángela", "Mora", "1100000004"),
    ]:
        firebase.users[uid] = user(uid, first_name, last_name, idNumber=id_number)


class TestSearchUsers:
    def search(self, firebase, budget: ScanBudget | None = None, **query):
        users = InMemoryUserRepository(firebase)
        parsed = parse_search_query(query)
        return search_users(parsed, users, budget) if budget else search_users(parsed, users)

    def test_an_id_number_is_an_equality_filter_of_the_store(self, firebase, four_users):
        page = self.search(firebase, q="1100000003")

        assert [found.uid for found in page.users] == ["c"]
        assert page.next_cursor is None

    def test_an_email_is_an_equality_filter_of_the_store(self, firebase, four_users):
        page = self.search(firebase, q="B@Runcty.dev")

        assert [found.uid for found in page.users] == ["b"]

    def test_filters_names_in_memory_and_paginates_with_a_cursor(self, firebase, four_users):
        first = self.search(firebase, q="an", limit=2)

        assert [found.uid for found in first.users] == ["a", "c"]
        assert first.next_cursor == "c"

        second = self.search(firebase, q="an", limit=2, cursor=first.next_cursor)

        assert [found.uid for found in second.users] == ["d"]
        assert second.next_cursor is None

    def test_searches_by_first_and_last_name_together(self, firebase, four_users):
        page = self.search(firebase, q="PAZ ana")

        assert [found.uid for found in page.users] == ["a"]

    def test_lists_everyone_without_text(self, firebase, four_users):
        page = self.search(firebase)

        assert [found.uid for found in page.users] == ["a", "b", "c", "d"]

    def test_stops_at_the_scan_budget_and_returns_a_cursor_to_continue(self, firebase):
        firebase.users.clear()
        for index in range(30):
            firebase.users[f"u{index:02}"] = user(f"u{index:02}", "Zoe", "X")

        page = self.search(firebase, ScanBudget(batch_size=10, max_scanned=20), q="ana")

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
        response = client.get(URL, {"q": "an", "limit": "2"}, **bearer("user-reader-token"))

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
        response = client.get(URL, {"q": "an", "cursor": "c"}, **bearer("admin-token"))

        assert [found["uid"] for found in response.json()["users"]] == ["d"]
        assert response.json()["nextCursor"] is None

    def test_lists_everyone_without_q(self, client, four_users):
        response = client.get(URL, **bearer("admin-token"))

        assert [found["uid"] for found in response.json()["users"]] == ["a", "b", "c", "d"]

    def test_a_too_long_text_keeps_the_reason_of_the_domain(self, client):
        response = client.get(URL, {"q": "x" * 121}, **bearer("user-reader-token"))

        assert response.status_code == 400
        assert response.json()["error"]["reason"] == "invalid-filter"

    @pytest.mark.parametrize(
        "parameter", ["firstName", "lastName", "email", "idNumber", "birthDate", "cityId", "role"]
    )
    def test_the_old_filters_and_unknown_parameters_are_rejected(self, client, parameter):
        response = client.get(URL, {parameter: "x"}, **bearer("user-reader-token"))

        assert response.status_code == 400
        assert response.json()["error"]["fields"] == {parameter: "unknown"}

    def test_has_a_stricter_rate_limit_than_the_rest_of_the_api(self, client, monkeypatch):
        monkeypatch.setitem(SimpleRateThrottle.THROTTLE_RATES, "sensitive", "1/min")

        assert client.get(URL, **bearer("user-reader-token")).status_code == 200
        assert client.get(URL, **bearer("user-reader-token")).status_code == 429
        assert client.get("/api/v1/users/me", **bearer("user-reader-token")).status_code == 200
