import pytest
from rest_framework.throttling import SimpleRateThrottle

from apps.roles.domain.models import Rol
from apps.shared.domain.permissions import ALL_PERMISSIONS
from tests.conftest import bearer
from tests.fakes import ADMIN, RUNNER

ROLES = "/api/v1/roles"
SUPPORT = f"{ROLES}/support"
RUNNER_ROLE = f"/api/v1/users/{RUNNER.uid}/role"
SUPPORT_BODY = {"name": "Soporte", "description": "Mesa de ayuda", "permissions": ["users.read"]}


@pytest.fixture(autouse=True)
def roles(firebase):
    firebase.roles.update(
        runner=Rol("runner", "Corredor", "", (), system=True),
        admin=Rol("admin", "Administrador", "", tuple(sorted(ALL_PERMISSIONS)), system=True),
        support=Rol("support", "Soporte", "", ("users.read",)),
    )


def error_of(response) -> dict:
    return response.json()["error"]


@pytest.mark.parametrize(
    ("method", "url"),
    [
        ("get", ROLES),
        ("post", ROLES),
        ("put", SUPPORT),
        ("delete", SUPPORT),
        ("put", RUNNER_ROLE),
    ],
)
def test_anonymous_callers_are_unauthenticated(client, method, url):
    response = getattr(client, method)(url, {}, format="json")

    assert response.status_code == 401
    assert error_of(response)["reason"] == "unauthenticated"


@pytest.mark.parametrize(
    ("method", "url"),
    [("post", ROLES), ("put", SUPPORT), ("delete", SUPPORT), ("put", RUNNER_ROLE)],
)
def test_mutations_need_roles_manage(client, firebase, method, url):
    # club_rep enters the panel (admin.access) but does not manage roles.
    response = getattr(client, method)(url, SUPPORT_BODY, format="json", **bearer("club-rep-token"))

    assert response.status_code == 403
    assert error_of(response) == {
        "reason": "missing-permission",
        "message": "Missing permission roles.manage.",
    }
    assert firebase.calls == []


class TestListRoles:
    def test_requires_admin_access(self, client):
        response = client.get(ROLES, **bearer("runner-token"))

        assert response.status_code == 403
        assert error_of(response)["reason"] == "missing-permission"

    def test_panel_users_see_every_role(self, client):
        response = client.get(ROLES, **bearer("club-rep-token"))

        assert response.status_code == 200
        assert [role["id"] for role in response.json()["roles"]] == ["admin", "runner", "support"]
        assert response.json()["roles"][2] == {
            "id": "support",
            "name": "Soporte",
            "description": "",
            "permissions": ["users.read"],
            "system": False,
        }


class TestCreateRole:
    def test_creates_the_role(self, client, firebase):
        body = {"id": "viewer", "name": " Lector ", "permissions": ["users.read", "admin.access"]}

        response = client.post(ROLES, body, format="json", **bearer("manager-token"))

        assert response.status_code == 201
        assert response.json() == {
            "id": "viewer",
            "name": "Lector",
            "description": "",
            "permissions": ["admin.access", "users.read"],
            "system": False,
        }
        assert firebase.roles["viewer"].system is False

    def test_existing_id_is_a_conflict(self, client):
        body = {"id": "support", **SUPPORT_BODY}

        response = client.post(ROLES, body, format="json", **bearer("admin-token"))

        assert response.status_code == 409
        assert error_of(response)["reason"] == "role-exists"

    def test_invalid_values_keep_the_reason_of_the_domain(self, client):
        body = {"id": "Not A Slug", **SUPPORT_BODY}

        response = client.post(ROLES, body, format="json", **bearer("admin-token"))

        assert response.status_code == 400
        assert error_of(response)["reason"] == "invalid-role-id"

    def test_a_malformed_body_reports_each_field(self, client, firebase):
        body = {"id": "viewer", "permissions": "users.read", "system": True}

        response = client.post(ROLES, body, format="json", **bearer("admin-token"))

        assert response.status_code == 400
        assert error_of(response) == {
            "reason": "invalid-argument",
            "message": "The request is invalid.",
            "fields": {"system": "unknown", "name": "required", "permissions": "not-a-list"},
        }
        assert "viewer" not in firebase.roles

    def test_a_body_that_is_not_an_object_is_rejected(self, client):
        response = client.post(ROLES, ["viewer"], format="json", **bearer("admin-token"))

        assert response.status_code == 400
        assert error_of(response)["fields"] == {"body": "invalid"}

    def test_a_delegate_cannot_escalate(self, client):
        body = {"id": "boss", "name": "Jefe", "permissions": ["roles.manage"]}

        response = client.post(ROLES, body, format="json", **bearer("manager-token"))

        assert response.status_code == 403
        assert error_of(response)["reason"] == "admin-only"


class TestUpdateRole:
    def test_updates_the_role_and_reports_the_synced_users(self, client, firebase):
        firebase.add_user("u1", {"role": "support", "perms": ["users.read"]})

        response = client.put(
            SUPPORT, {"name": "Soporte", "permissions": []}, format="json", **bearer("admin-token")
        )

        assert response.status_code == 200
        assert response.json() == {"syncedUsers": 1}
        assert firebase.claims["u1"] == {"role": "support", "perms": []}

    def test_unknown_role_is_not_found(self, client):
        response = client.put(
            f"{ROLES}/ghost", SUPPORT_BODY, format="json", **bearer("admin-token")
        )

        assert response.status_code == 404
        assert error_of(response)["reason"] == "role-not-found"

    def test_the_id_comes_from_the_url_only(self, client):
        body = {"id": "admin", **SUPPORT_BODY}

        response = client.put(SUPPORT, body, format="json", **bearer("admin-token"))

        assert response.status_code == 400
        assert error_of(response)["fields"] == {"id": "unknown"}

    def test_a_delegate_cannot_edit_a_system_role(self, client, firebase):
        response = client.put(
            f"{ROLES}/runner",
            {"name": "Corredor", "permissions": ["users.read"]},
            format="json",
            **bearer("manager-token"),
        )

        assert response.status_code == 403
        assert error_of(response)["reason"] == "admin-only"
        assert firebase.roles["runner"].permissions == ()


class TestDeleteRole:
    def test_deletes_a_role_without_users(self, client, firebase):
        response = client.delete(SUPPORT, **bearer("manager-token"))

        assert response.status_code == 204
        assert "support" not in firebase.roles

    def test_system_roles_are_protected(self, client):
        response = client.delete(f"{ROLES}/runner", **bearer("admin-token"))

        assert response.status_code == 400
        assert error_of(response)["reason"] == "system-role"


class TestSetUserRole:
    def test_assigns_the_role(self, client, firebase):
        response = client.put(
            RUNNER_ROLE, {"roleId": "support"}, format="json", **bearer("manager-token")
        )

        assert response.status_code == 200
        assert response.json() == {"uid": RUNNER.uid, "role": "support"}
        assert firebase.claims[RUNNER.uid] == {"role": "support", "perms": ["users.read"]}
        assert firebase.users[RUNNER.uid]["role"] == "support"

    def test_the_target_comes_from_the_url_only(self, client):
        body = {"roleId": "support", "uid": ADMIN.uid}

        response = client.put(RUNNER_ROLE, body, format="json", **bearer("admin-token"))

        assert response.status_code == 400
        assert error_of(response)["fields"] == {"uid": "unknown"}

    def test_unknown_account_is_not_found(self, client):
        response = client.put(
            "/api/v1/users/ghost/role",
            {"roleId": "support"},
            format="json",
            **bearer("admin-token"),
        )

        assert response.status_code == 404
        assert error_of(response)["reason"] == "user-not-found"

    def test_a_delegate_cannot_assign_the_admin_role(self, client, firebase):
        response = client.put(
            RUNNER_ROLE, {"roleId": "admin"}, format="json", **bearer("manager-token")
        )

        assert response.status_code == 403
        assert error_of(response)["reason"] == "admin-only"
        assert firebase.claims[RUNNER.uid]["role"] == "runner"

    def test_the_only_admin_cannot_demote_themselves(self, client):
        response = client.put(
            f"/api/v1/users/{ADMIN.uid}/role",
            {"roleId": "runner"},
            format="json",
            **bearer("admin-token"),
        )

        assert response.status_code == 400
        assert error_of(response)["reason"] == "self-lockout"

    def test_a_token_issued_before_a_demotion_cannot_manage_roles(self, client, firebase):
        # NEW-01: the ID token still says admin, the claims stored in Auth no longer do.
        firebase.claims[ADMIN.uid] = {"role": "runner", "perms": []}

        response = client.put(
            f"/api/v1/users/{ADMIN.uid}/role",
            {"roleId": "admin"},
            format="json",
            **bearer("admin-token"),
        )

        assert response.status_code == 403
        assert error_of(response)["reason"] == "missing-permission"
        assert firebase.claims[ADMIN.uid]["role"] == "runner"


def test_role_endpoints_have_a_stricter_rate_limit(client, monkeypatch):
    monkeypatch.setitem(SimpleRateThrottle.THROTTLE_RATES, "sensitive", "1/min")

    assert client.get(ROLES, **bearer("admin-token")).status_code == 200
    response = client.get(ROLES, **bearer("admin-token"))

    assert response.status_code == 429
    assert error_of(response)["reason"] == "rate-limited"
    assert client.get("/api/v1/me", **bearer("admin-token")).status_code == 200
