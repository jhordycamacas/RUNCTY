"""`GET`/`PUT /api/v1/catalogs/<id>` and the sport profile that reads the catalogs."""

import pytest

from apps.catalogs.domain.models import Catalog
from apps.shared.domain.models import Principal
from tests.conftest import bearer
from tests.fakes import PRINCIPALS
from tests.fakes import RUNNER as RUNNER_PRINCIPAL

LEVELS_URL = "/api/v1/catalogs/sportLevels"
GOALS_URL = "/api/v1/catalogs/sportGoals"
PROFILE_URL = "/api/v1/users/me/sport-profile"
ADMIN = bearer("admin-token")
RUNNER = bearer("runner-token")
LEVEL_ITEMS = Catalog.defaults("sportLevels").to_document()["items"]
PROFILE = {
    "level": "beginner",
    "goals": ["health"],
    "usualPaceSecPerKm": 390,
    "preferredDistanceKm": 10,
}


def with_item(code: str = "elite", order: int = 4, active: bool = True) -> list[dict]:
    return [*LEVEL_ITEMS, {"code": code, "label": "Élite", "order": order, "active": active}]


class TestAuthorization:
    def test_reading_needs_a_signed_in_user(self, client):
        assert client.get(LEVELS_URL).status_code == 401

    def test_writing_is_unauthenticated_without_a_token(self, client):
        assert client.put(LEVELS_URL, {"items": LEVEL_ITEMS}, format="json").status_code == 401

    @pytest.mark.parametrize("token", ["runner-token", "club-rep-token", "cataloguer-token"])
    def test_writing_needs_settings_manage(self, client, firebase, token):
        response = client.put(LEVELS_URL, {"items": with_item()}, format="json", **bearer(token))

        assert response.status_code == 403
        assert response.json()["error"]["reason"] == "missing-permission"
        assert "catalogs/sportLevels" not in firebase.docs

    @pytest.mark.parametrize("token", ["runner-token", "club-rep-token"])
    def test_any_signed_in_user_reads_a_catalog(self, client, token):
        assert client.get(LEVELS_URL, **bearer(token)).status_code == 200

    def test_a_delegate_with_the_permission_may_write(self, client, monkeypatch):
        editor = Principal("settings-1", None, True, "editor", ("admin.access", "settings.manage"))
        monkeypatch.setitem(PRINCIPALS, "settings-editor-token", editor)

        response = client.put(
            LEVELS_URL, {"items": with_item()}, format="json", **bearer("settings-editor-token")
        )

        assert response.status_code == 200


class TestGet:
    def test_gives_the_default_items_sorted_with_their_flags(self, client):
        response = client.get(LEVELS_URL, **RUNNER)

        assert response.status_code == 200
        assert response.json() == {
            "id": "sportLevels",
            "items": [
                {"code": "beginner", "label": "Principiante", "order": 1, "active": True},
                {"code": "intermediate", "label": "Intermedio", "order": 2, "active": True},
                {"code": "advanced", "label": "Avanzado", "order": 3, "active": True},
            ],
        }

    def test_the_goals_catalog_has_its_own_defaults(self, client):
        items = client.get(GOALS_URL, **RUNNER).json()["items"]

        assert [item["code"] for item in items] == [
            "health",
            "weightLoss",
            "racePrep",
            "pace",
            "social",
        ]

    def test_inactive_items_are_listed_unless_only_the_active_are_asked_for(self, client):
        client.put(LEVELS_URL, {"items": with_item("elite", 4, False)}, format="json", **ADMIN)

        everything = client.get(LEVELS_URL, **RUNNER).json()["items"]
        active = client.get(f"{LEVELS_URL}?active=true", **RUNNER).json()["items"]

        assert [(i["code"], i["active"]) for i in everything][-1] == ("elite", False)
        assert [i["code"] for i in active] == ["beginner", "intermediate", "advanced"]
        assert client.get(f"{LEVELS_URL}?active=false", **RUNNER).json()["items"] == everything

    def test_rejects_an_unknown_query_value_or_parameter(self, client):
        assert client.get(f"{LEVELS_URL}?active=maybe", **RUNNER).status_code == 400
        assert client.get(f"{LEVELS_URL}?sort=asc", **RUNNER).status_code == 400

    def test_an_unknown_catalog_is_not_found(self, client):
        response = client.get("/api/v1/catalogs/shoes", **RUNNER)

        assert response.status_code == 404
        assert response.json()["error"]["reason"] == "catalog-not-found"


class TestPut:
    def test_replaces_the_items_and_returns_them_sorted(self, client, firebase):
        body = {
            "items": [
                {"code": "elite", "label": " Élite ", "order": 0, "active": True},
                *LEVEL_ITEMS,
            ]
        }

        response = client.put(LEVELS_URL, body, format="json", **ADMIN)

        assert response.status_code == 200
        assert response.json()["id"] == "sportLevels"
        assert [i["code"] for i in response.json()["items"]] == [
            "elite",
            "beginner",
            "intermediate",
            "advanced",
        ]
        assert response.json()["items"][0]["label"] == "Élite"
        assert firebase.docs["catalogs/sportLevels"]["items"] == response.json()["items"]
        assert client.get(LEVELS_URL, **RUNNER).json() == response.json()

    def test_rejects_invalid_items_naming_each_field(self, client, firebase):
        body = {"items": [*LEVEL_ITEMS, {"code": "Bad", "label": "", "order": "x", "active": 1}]}

        response = client.put(LEVELS_URL, body, format="json", **ADMIN)

        assert response.status_code == 400
        error = response.json()["error"]
        assert error["reason"] == "invalid-argument"
        assert error["fields"] == {
            "items.3.code": "invalid-format",
            "items.3.label": "required",
            "items.3.order": "invalid",
            "items.3.active": "invalid",
        }
        assert "catalogs/sportLevels" not in firebase.docs

    def test_a_code_that_existed_cannot_be_removed(self, client):
        response = client.put(LEVELS_URL, {"items": LEVEL_ITEMS[:2]}, format="json", **ADMIN)

        assert response.status_code == 400
        assert response.json()["error"]["fields"] == {"items": "code-removed"}

    def test_at_least_one_item_stays_active(self, client):
        body = {"items": [{**item, "active": False} for item in LEVEL_ITEMS]}

        response = client.put(LEVELS_URL, body, format="json", **ADMIN)

        assert response.json()["error"]["fields"] == {"items": "no-active-item"}

    def test_the_body_needs_items_and_nothing_else(self, client):
        missing = client.put(LEVELS_URL, {}, format="json", **ADMIN)
        extra = client.put(LEVELS_URL, {"items": LEVEL_ITEMS, "name": "x"}, format="json", **ADMIN)

        assert missing.json()["error"]["fields"] == {"items": "required"}
        assert extra.json()["error"]["fields"] == {"name": "unknown"}

    def test_an_unknown_catalog_is_not_found(self, client):
        response = client.put("/api/v1/catalogs/shoes", {"items": []}, format="json", **ADMIN)

        assert response.status_code == 404
        assert response.json()["error"]["reason"] == "catalog-not-found"


class TestSportProfileUsesTheCatalogs:
    def test_a_newly_added_active_code_is_accepted(self, client):
        client.put(LEVELS_URL, {"items": with_item("elite")}, format="json", **ADMIN)

        response = client.put(PROFILE_URL, {**PROFILE, "level": "elite"}, format="json", **RUNNER)

        assert response.status_code == 200
        assert response.json()["level"] == "elite"

    def test_the_default_codes_keep_working_without_any_saved_catalog(self, client):
        response = client.put(PROFILE_URL, PROFILE, format="json", **RUNNER)

        assert response.status_code == 200

    def test_an_unknown_code_is_rejected(self, client):
        body = {**PROFILE, "level": "elite", "goals": ["fly"]}

        response = client.put(PROFILE_URL, body, format="json", **RUNNER)

        assert response.status_code == 400
        assert response.json()["error"]["fields"] == {
            "level": "invalid-choice",
            "goals": "invalid-choice",
        }

    def test_a_deactivated_code_is_rejected_on_save(self, client):
        items = [{**i, "active": i["code"] != "advanced"} for i in LEVEL_ITEMS]
        client.put(LEVELS_URL, {"items": items}, format="json", **ADMIN)

        response = client.put(
            PROFILE_URL, {**PROFILE, "level": "advanced"}, format="json", **RUNNER
        )

        assert response.status_code == 400
        assert response.json()["error"]["fields"] == {"level": "invalid-choice"}

    def test_a_stored_profile_keeps_a_code_that_was_deactivated_afterwards(self, client):
        client.put(
            PROFILE_URL,
            {**PROFILE, "level": "advanced", "goals": ["pace"]},
            format="json",
            **RUNNER,
        )
        items = [{**i, "active": i["code"] != "advanced"} for i in LEVEL_ITEMS]
        client.put(LEVELS_URL, {"items": items}, format="json", **ADMIN)

        response = client.get(PROFILE_URL, **RUNNER)

        assert response.status_code == 200
        assert response.json()["level"] == "advanced"

    def test_a_stored_profile_keeps_a_code_that_is_missing_from_the_catalog(self, client, firebase):
        firebase.private[(RUNNER_PRINCIPAL.uid, "sportProfile")] = {**PROFILE, "level": "legacy"}

        response = client.get(PROFILE_URL, **RUNNER)

        assert response.status_code == 200
        assert response.json()["level"] == "legacy"

    def test_the_goal_count_is_bounded_by_the_active_goals(self, client):
        body = {**PROFILE, "goals": ["health"] * 6}

        response = client.put(PROFILE_URL, body, format="json", **RUNNER)

        assert response.json()["error"]["fields"] == {"goals": "max-length"}
