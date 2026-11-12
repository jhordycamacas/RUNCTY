from types import SimpleNamespace

import pytest

from apps.shared.presentation.permissions import HasPermission, IsAdmin, IsAuthenticated
from tests.conftest import bearer
from tests.fakes import ADMIN, CLUB_REP, RUNNER, USER_READER


def allows(permission_class, principal) -> bool:
    return permission_class().has_permission(SimpleNamespace(user=principal), view=None)


def test_is_authenticated_requires_a_principal():
    assert allows(IsAuthenticated, RUNNER)
    assert not allows(IsAuthenticated, None)


def test_is_admin_requires_the_admin_role():
    assert allows(IsAdmin, ADMIN)
    assert not allows(IsAdmin, CLUB_REP)
    assert not allows(IsAdmin, None)


def test_has_permission_checks_the_perms_claim():
    assert allows(HasPermission("users.read"), USER_READER)
    assert not allows(HasPermission("users.read"), CLUB_REP)
    assert not allows(HasPermission("users.read"), None)


def test_admin_role_passes_every_permission_check():
    assert allows(HasPermission("roles.manage"), ADMIN)


def test_has_permission_rejects_permissions_outside_the_catalogue():
    with pytest.raises(ValueError, match="users.write"):
        HasPermission("users.write")


@pytest.mark.urls("tests.urls")
class TestPermissionResponses:
    def test_holder_is_allowed(self, client):
        assert client.get("/probe/users-read", **bearer("user-reader-token")).status_code == 200

    def test_missing_permission_is_403_with_reason(self, client):
        response = client.get("/probe/users-read", **bearer("runner-token"))

        assert response.status_code == 403
        assert response.json() == {
            "error": {"reason": "missing-permission", "message": "Missing permission users.read."}
        }

    def test_anonymous_caller_is_401_not_403(self, client):
        response = client.get("/probe/users-read")

        assert response.status_code == 401
        assert response.json()["error"]["reason"] == "unauthenticated"
