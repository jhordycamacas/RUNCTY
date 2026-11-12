import pytest

from apps.roles.application.use_cases import (
    RolesDeps,
    create_role,
    delete_role,
    set_user_role,
    update_role,
)
from apps.roles.domain.models import Rol
from apps.shared.domain.errors import DomainError, ErrorKind
from apps.shared.domain.permissions import ALL_PERMISSIONS
from tests.fakes import (
    ADMIN,
    MANAGER,
    RUNNER,
    InMemoryAuthGateway,
    InMemoryRoleMembers,
    InMemoryRoleRepository,
)

EVERY_PERMISSION = tuple(sorted(ALL_PERMISSIONS))
ADMIN_CLAIMS = {"role": "admin", "perms": list(EVERY_PERMISSION)}


def custom(role_id: str, *permissions: str) -> Rol:
    return Rol(role_id, role_id.title(), "", tuple(sorted(permissions)))


@pytest.fixture(autouse=True)
def system_roles(firebase):
    firebase.roles.update(
        runner=Rol("runner", "Corredor", "", (), system=True),
        admin=Rol("admin", "Administrador", "", EVERY_PERMISSION, system=True),
    )


@pytest.fixture
def deps(firebase) -> RolesDeps:
    return RolesDeps(
        roles=InMemoryRoleRepository(firebase),
        members=InMemoryRoleMembers(firebase),
        auth=InMemoryAuthGateway(firebase),
    )


def reason_of(call, *args) -> str:
    with pytest.raises(DomainError) as error:
        call(*args)
    return error.value.reason


class TestCreateRole:
    def test_creates_a_new_non_system_role(self, deps, firebase):
        body = {"id": "support", "name": "Soporte", "permissions": ["users.read"]}

        created = create_role(body, ADMIN.uid, deps)

        assert created == Rol("support", "Soporte", "", ("users.read",), system=False)
        assert firebase.roles["support"] == created

    def test_rejects_an_id_that_already_exists(self, deps, firebase):
        body = {"id": "admin", "name": "Otro", "permissions": []}

        assert reason_of(create_role, body, ADMIN.uid, deps) == "role-exists"
        assert firebase.roles["admin"].name == "Administrador"


class TestUpdateRole:
    def test_updates_the_role_and_resyncs_the_claims_of_its_users(self, deps, firebase):
        firebase.roles["support"] = custom("support")
        firebase.add_user("u1", {"role": "support", "perms": [], "beta": True})
        firebase.add_user("u2", None, role="support")
        body = {"id": "support", "name": "Soporte", "permissions": ["users.read"]}

        synced = update_role(body, ADMIN.uid, deps)

        assert firebase.roles["support"] == Rol("support", "Soporte", "", ("users.read",))
        assert firebase.claims["u1"] == {"role": "support", "perms": ["users.read"], "beta": True}
        assert firebase.claims["u2"] == {"role": "support", "perms": ["users.read"]}
        assert synced == 2

    def test_skips_users_deleted_from_auth_while_syncing(self, deps, firebase):
        firebase.roles["support"] = custom("support")
        firebase.users["gone"] = {"role": "support"}
        firebase.add_user("u2", {"role": "support", "perms": []})
        body = {"id": "support", "name": "Soporte", "permissions": []}

        assert update_role(body, ADMIN.uid, deps) == 1

    def test_rejects_an_unknown_role(self, deps):
        body = {"id": "ghost", "name": "X", "permissions": []}

        assert reason_of(update_role, body, ADMIN.uid, deps) == "role-not-found"

    def test_keeps_every_permission_on_the_admin_role(self, deps):
        narrowed = {"id": "admin", "name": "Admin", "permissions": ["users.read"]}
        complete = {"id": "admin", "name": "Admin", "permissions": list(ALL_PERMISSIONS)}

        assert reason_of(update_role, narrowed, ADMIN.uid, deps) == "admin-permissions"
        assert update_role(complete, ADMIN.uid, deps) == 1  # the admin caller itself

    def test_keeps_the_system_flag_of_the_stored_role(self, deps, firebase):
        update_role({"id": "runner", "name": "Runner", "permissions": []}, ADMIN.uid, deps)

        assert firebase.roles["runner"] == Rol("runner", "Runner", "", (), system=True)


class TestDeleteRole:
    def test_deletes_a_custom_role_without_users(self, deps, firebase):
        firebase.roles["support"] = custom("support")

        delete_role("support", ADMIN.uid, deps)

        assert "support" not in firebase.roles

    def test_rejects_system_roles(self, deps, firebase):
        firebase.users.clear()  # no runner holds it: the system flag alone protects it

        assert reason_of(delete_role, "runner", ADMIN.uid, deps) == "system-role"
        assert "runner" in firebase.roles

    def test_rejects_roles_that_still_have_users(self, deps, firebase):
        firebase.roles["support"] = custom("support")
        firebase.add_user("u1", {"role": "support", "perms": []})

        assert reason_of(delete_role, "support", ADMIN.uid, deps) == "role-has-users"
        assert "support" in firebase.roles

    def test_rejects_unknown_roles(self, deps):
        assert reason_of(delete_role, "ghost", ADMIN.uid, deps) == "role-not-found"

    def test_rejects_ids_that_are_not_slugs(self, deps):
        assert reason_of(delete_role, "Not A Slug", ADMIN.uid, deps) == "invalid-role-id"


class TestSetUserRole:
    @pytest.fixture(autouse=True)
    def _roles(self, firebase):
        firebase.roles["support"] = custom("support", "admin.access", "users.read")

    def test_mirrors_the_role_then_sets_the_claims_and_revokes_the_sessions(self, deps, firebase):
        firebase.add_user("u1", {"role": "runner", "perms": []})

        set_user_role("u1", "support", ADMIN.uid, deps)

        assert firebase.claims["u1"] == {"role": "support", "perms": ["admin.access", "users.read"]}
        assert firebase.users["u1"]["role"] == "support"
        assert firebase.calls == [("mirror", "u1", "support"), ("claims", "u1"), ("revoke", "u1")]

    def test_rejects_an_unknown_role_or_a_missing_uid(self, deps, firebase):
        firebase.add_user("u1")

        assert reason_of(set_user_role, "u1", "ghost", ADMIN.uid, deps) == "role-not-found"
        assert reason_of(set_user_role, "", "runner", ADMIN.uid, deps) == "invalid-argument"
        assert reason_of(set_user_role, "x" * 129, "runner", ADMIN.uid, deps) == "invalid-argument"

    def test_reports_a_user_that_does_not_exist_in_auth(self, deps):
        with pytest.raises(DomainError) as error:
            set_user_role("ghost", "runner", ADMIN.uid, deps)

        assert error.value.reason == "user-not-found"
        assert error.value.kind is ErrorKind.NOT_FOUND

    def test_prevents_an_admin_from_removing_their_own_admin_role(self, deps, firebase):
        firebase.add_user("admin-2", ADMIN_CLAIMS)

        assert reason_of(set_user_role, ADMIN.uid, "support", ADMIN.uid, deps) == "self-lockout"
        assert reason_of(set_user_role, ADMIN.uid, "runner", ADMIN.uid, deps) == "self-lockout"
        assert firebase.calls == []

    def test_lets_an_admin_change_the_role_of_another_admin(self, deps, firebase):
        firebase.add_user("admin-2", ADMIN_CLAIMS)

        set_user_role("admin-2", "runner", ADMIN.uid, deps)

        assert firebase.claims["admin-2"] == {"role": "runner", "perms": []}

    def test_keeps_unrelated_claims_of_the_target(self, deps, firebase):
        firebase.add_user("u1", {"role": "runner", "perms": [], "beta": True})

        set_user_role("u1", "support", ADMIN.uid, deps)

        assert firebase.claims["u1"]["beta"] is True


class TestPrivilegeEscalationGuards:
    """SEC-02: a delegate with `roles.manage` must not be able to escalate to admin."""

    @pytest.fixture(autouse=True)
    def _roles(self, firebase):
        firebase.roles["support"] = custom("support", "users.read")
        firebase.roles["ops"] = custom("ops", "roles.manage", "users.read")
        firebase.add_user("u1", {"role": "runner", "perms": []})

    def test_only_an_admin_can_create_a_role_that_includes_roles_manage(self, deps, firebase):
        body = {"id": "boss", "name": "Jefe", "permissions": ["roles.manage"]}

        assert reason_of(create_role, body, MANAGER.uid, deps) == "admin-only"
        assert "boss" not in firebase.roles
        assert create_role(body, ADMIN.uid, deps).id == "boss"

    def test_a_non_admin_cannot_grant_a_permission_they_do_not_hold(self, deps):
        beyond = {"id": "cityboss", "name": "C", "permissions": ["users.read", "cities.manage"]}
        within = {"id": "viewer", "name": "Lector", "permissions": ["users.read"]}

        assert reason_of(create_role, beyond, MANAGER.uid, deps) == "permission-escalation"
        assert create_role(within, MANAGER.uid, deps).id == "viewer"

    def test_a_non_admin_cannot_widen_an_existing_role(self, deps, firebase):
        with_manage = {"id": "support", "name": "S", "permissions": ["users.read", "roles.manage"]}
        with_cities = {"id": "support", "name": "S", "permissions": ["users.read", "cities.manage"]}

        assert reason_of(update_role, with_manage, MANAGER.uid, deps) == "admin-only"
        assert reason_of(update_role, with_cities, MANAGER.uid, deps) == "permission-escalation"
        assert firebase.roles["support"] == custom("support", "users.read")

    def test_a_non_admin_cannot_keep_roles_manage_on_a_role_they_edit(self, deps):
        body = {"id": "ops", "name": "Ops", "permissions": ["roles.manage", "users.read"]}

        assert reason_of(update_role, body, MANAGER.uid, deps) == "admin-only"

    def test_a_non_admin_can_still_narrow_an_existing_role(self, deps, firebase):
        update_role({"id": "support", "name": "Soporte", "permissions": []}, MANAGER.uid, deps)

        assert firebase.roles["support"].permissions == ()

    def test_only_an_admin_can_assign_or_revoke_the_admin_role(self, deps, firebase):
        firebase.add_user("u2", ADMIN_CLAIMS)

        assert reason_of(set_user_role, "u1", "admin", MANAGER.uid, deps) == "admin-only"
        assert reason_of(set_user_role, "u2", "runner", MANAGER.uid, deps) == "admin-only"
        assert firebase.calls == []

    def test_a_non_admin_cannot_assign_a_role_with_roles_manage(self, deps):
        assert reason_of(set_user_role, "u1", "ops", MANAGER.uid, deps) == "admin-only"

    def test_a_non_admin_cannot_assign_a_role_holding_permissions_they_lack(self, deps, firebase):
        firebase.roles["cities"] = custom("cities", "cities.manage")

        assert (
            reason_of(set_user_role, "u1", "cities", MANAGER.uid, deps) == "permission-escalation"
        )

    def test_a_non_admin_can_assign_a_role_within_their_own_permissions(self, deps, firebase):
        set_user_role("u1", "support", MANAGER.uid, deps)

        assert firebase.claims["u1"]["role"] == "support"

    def test_nobody_can_remove_their_own_ability_to_manage_roles(self, deps):
        assert reason_of(set_user_role, MANAGER.uid, "support", MANAGER.uid, deps) == "self-lockout"


class TestTokenRevocation:
    """SEC-03: stale claims must stop working at the next token refresh."""

    def test_revokes_refresh_tokens_after_changing_a_user_role(self, deps, firebase):
        firebase.add_user("u1")

        set_user_role("u1", "runner", ADMIN.uid, deps)

        assert firebase.calls[-2:] == [("claims", "u1"), ("revoke", "u1")]

    def test_revokes_refresh_tokens_of_every_user_resynced_by_update_role(self, deps, firebase):
        firebase.roles["support"] = custom("support")
        firebase.add_user("u1", {"role": "support", "perms": []})
        firebase.add_user("u2", {"role": "support", "perms": []})

        update_role({"id": "support", "name": "S", "permissions": ["users.read"]}, ADMIN.uid, deps)

        assert ("revoke", "u1") in firebase.calls
        assert ("revoke", "u2") in firebase.calls


class TestLastAdminGuard:
    """SEC-08 and NEW-03: the panel must always keep at least one admin."""

    def test_blocks_demoting_the_last_admin_in_the_role_mirror(self, deps, firebase):
        firebase.add_user("admin-2", ADMIN_CLAIMS)
        firebase.users[ADMIN.uid]["role"] = "runner"  # only admin-2 is an admin in the mirror

        assert reason_of(set_user_role, "admin-2", "runner", ADMIN.uid, deps) == "last-admin"
        assert firebase.claims["admin-2"] == ADMIN_CLAIMS
        assert firebase.calls == []

    def test_fails_closed_when_the_mirror_shows_no_admin_at_all(self, deps, firebase):
        firebase.add_user("admin-2", ADMIN_CLAIMS)
        firebase.users["admin-2"]["role"] = "runner"  # stale mirror of the target
        del firebase.users[ADMIN.uid]

        assert reason_of(set_user_role, "admin-2", "runner", ADMIN.uid, deps) == "last-admin"

    def test_does_not_need_another_admin_when_the_target_is_not_an_admin(self, deps, firebase):
        firebase.add_user("u1", {"role": "runner", "perms": []})
        del firebase.users[ADMIN.uid]  # the mirror shows no admin

        set_user_role("u1", "runner", ADMIN.uid, deps)

        assert ("mirror", "u1", "runner") in firebase.calls

    def test_restores_the_mirror_when_the_claims_cannot_be_written(self, deps, firebase):
        firebase.add_user("admin-2", ADMIN_CLAIMS)
        firebase.failing.add("set_custom_claims")

        with pytest.raises(RuntimeError):
            set_user_role("admin-2", "runner", ADMIN.uid, deps)

        assert firebase.users["admin-2"]["role"] == "admin"
        assert firebase.claims["admin-2"] == ADMIN_CLAIMS


class TestFreshCallerClaims:
    """NEW-01: authority comes from the claims stored in Auth, not from the ID token."""

    @pytest.fixture(autouse=True)
    def _demoted_caller(self, firebase):
        firebase.roles["support"] = custom("support")
        firebase.add_user("u1")
        firebase.claims[ADMIN.uid] = {"role": "runner", "perms": []}

    @pytest.mark.parametrize(
        ("use_case", "args"),
        [
            (create_role, ({"id": "boss", "name": "Jefe", "permissions": []},)),
            (update_role, ({"id": "support", "name": "S", "permissions": []},)),
            (delete_role, ("support",)),
            (set_user_role, ("u1", "admin")),
        ],
    )
    def test_a_demoted_caller_loses_role_management_at_once(self, deps, firebase, use_case, args):
        with pytest.raises(DomainError) as error:
            use_case(*args, ADMIN.uid, deps)

        assert error.value.reason == "missing-permission"
        assert error.value.kind is ErrorKind.PERMISSION_DENIED
        assert firebase.calls == []
        assert "boss" not in firebase.roles

    def test_a_demoted_admin_is_bound_by_the_delegate_rules(self, deps, firebase):
        firebase.claims[ADMIN.uid] = {"role": "manager", "perms": ["roles.manage"]}

        assert reason_of(set_user_role, "u1", "admin", ADMIN.uid, deps) == "admin-only"

    def test_a_caller_deleted_from_auth_holds_nothing(self, deps, firebase):
        del firebase.claims[ADMIN.uid]

        assert reason_of(delete_role, "support", ADMIN.uid, deps) == "missing-permission"


class TestSystemRoleEdits:
    """NEW-02: a delegate must not push permissions to every holder of a system role."""

    def test_only_an_admin_can_edit_a_system_role(self, deps, firebase):
        widened = {"id": "runner", "name": "Corredor", "permissions": ["users.read"]}
        renamed = {"id": "runner", "name": "Otro nombre", "permissions": []}

        assert reason_of(update_role, widened, MANAGER.uid, deps) == "admin-only"
        assert reason_of(update_role, renamed, MANAGER.uid, deps) == "admin-only"
        assert firebase.roles["runner"].name == "Corredor"

    def test_an_admin_can_edit_a_system_role(self, deps, firebase):
        update_role(
            {"id": "runner", "name": "Corredor", "permissions": ["users.read"]}, ADMIN.uid, deps
        )

        assert firebase.roles["runner"].permissions == ("users.read",)


class TestMissingProfile:
    """NEW-04: a role without the `users/{uid}` mirror could never be re-synced."""

    def test_rejects_an_account_that_has_no_profile(self, deps, firebase):
        firebase.claims["auth-only"] = {"role": "runner", "perms": []}

        with pytest.raises(DomainError) as error:
            set_user_role("auth-only", "admin", ADMIN.uid, deps)

        assert error.value.reason == "user-profile-missing"
        assert error.value.kind is ErrorKind.NOT_FOUND
        assert firebase.claims["auth-only"] == {"role": "runner", "perms": []}
        assert firebase.calls == []


def test_a_caller_without_roles_manage_is_rejected(deps):
    assert reason_of(delete_role, "runner", RUNNER.uid, deps) == "missing-permission"
