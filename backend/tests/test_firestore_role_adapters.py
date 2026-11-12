"""The Firestore and Auth adapters against mocked SDK clients (no emulator)."""

from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest
from firebase_admin import auth
from google.api_core.exceptions import Conflict
from google.cloud.firestore import SERVER_TIMESTAMP

from apps.roles.application.ports import RoleChange
from apps.roles.domain.models import Rol
from apps.roles.infrastructure import firestore_role_members, firestore_role_repository
from apps.roles.infrastructure.firestore_role_members import FirestoreRoleMembers, _change_role
from apps.roles.infrastructure.firestore_role_repository import FirestoreRoleRepository
from apps.shared.application.ports import AuthUserNotFound
from apps.shared.infrastructure.firebase import auth_gateway
from apps.shared.infrastructure.firebase.auth_gateway import FirebaseAuthGateway

SUPPORT = Rol("support", "Soporte", "Mesa", ("users.read",))


def snapshot(doc_id: str, data: dict | None = None) -> SimpleNamespace:
    return SimpleNamespace(id=doc_id, exists=data is not None, to_dict=lambda: data)


class TestFirestoreRoleRepository:
    @pytest.fixture
    def roles(self, monkeypatch) -> MagicMock:
        client = MagicMock()
        monkeypatch.setattr(firestore_role_repository, "firestore_client", lambda: client)
        return client.collection.return_value

    def test_reads_from_the_roles_collection(self, roles):
        roles.document.return_value.get.return_value = snapshot("support", SUPPORT.to_document())

        assert FirestoreRoleRepository().get("support") == SUPPORT
        roles.document.assert_called_once_with("support")

    def test_a_missing_document_is_no_role(self, roles):
        roles.document.return_value.get.return_value = snapshot("ghost")

        assert FirestoreRoleRepository().get("ghost") is None

    def test_lists_every_role(self, roles):
        roles.stream.return_value = [snapshot("support", SUPPORT.to_document())]

        assert FirestoreRoleRepository().list() == [SUPPORT]

    def test_create_adds_the_server_timestamps(self, roles):
        assert FirestoreRoleRepository().create(SUPPORT) is True

        roles.document.return_value.create.assert_called_once_with(
            {
                "name": "Soporte",
                "description": "Mesa",
                "permissions": ["users.read"],
                "system": False,
                "createdAt": SERVER_TIMESTAMP,
                "updatedAt": SERVER_TIMESTAMP,
            }
        )

    def test_create_reports_a_taken_id(self, roles):
        roles.document.return_value.create.side_effect = Conflict("exists")

        assert FirestoreRoleRepository().create(SUPPORT) is False

    def test_update_refreshes_updated_at_only(self, roles):
        FirestoreRoleRepository().update(SUPPORT)

        roles.document.return_value.update.assert_called_once_with(
            {**SUPPORT.to_document(), "updatedAt": SERVER_TIMESTAMP}
        )


class TestChangeRoleTransaction:
    """NEW-03: the last-admin check and the write share one transaction."""

    @pytest.fixture
    def client(self) -> MagicMock:
        return MagicMock()

    @staticmethod
    def given(client, *, profile_exists: bool, admins: list[str]) -> MagicMock:
        users = client.collection.return_value
        users.document.return_value.get.return_value = snapshot(
            "target", {} if profile_exists else None
        )
        query = users.where.return_value.limit.return_value.select.return_value
        query.stream.return_value = [snapshot(uid, {}) for uid in admins]
        return users

    def test_writes_the_mirror_inside_the_transaction(self, client):
        users = self.given(client, profile_exists=True, admins=["target", "other"])
        transaction = MagicMock()

        outcome = _change_role(transaction, client, "target", "runner", keep_an_admin=True)

        assert outcome is RoleChange.APPLIED
        transaction.update.assert_called_once_with(
            users.document.return_value, {"role": "runner", "updatedAt": SERVER_TIMESTAMP}
        )
        users.document.return_value.get.assert_called_once_with(transaction=transaction)
        query = users.where.return_value.limit.return_value.select.return_value
        query.stream.assert_called_once_with(transaction=transaction)
        users.where.return_value.limit.assert_called_once_with(2)

    @pytest.mark.parametrize("admins", [["target"], []])
    def test_refuses_to_leave_the_mirror_without_another_admin(self, client, admins):
        self.given(client, profile_exists=True, admins=admins)
        transaction = MagicMock()

        outcome = _change_role(transaction, client, "target", "runner", keep_an_admin=True)

        assert outcome is RoleChange.LAST_ADMIN
        transaction.update.assert_not_called()

    def test_skips_the_admin_query_when_nobody_is_demoted(self, client):
        users = self.given(client, profile_exists=True, admins=[])

        outcome = _change_role(MagicMock(), client, "target", "support", keep_an_admin=False)

        assert outcome is RoleChange.APPLIED
        users.where.assert_not_called()

    def test_reports_a_missing_profile_without_writing(self, client):
        self.given(client, profile_exists=False, admins=["other"])
        transaction = MagicMock()

        outcome = _change_role(transaction, client, "target", "runner", keep_an_admin=False)

        assert outcome is RoleChange.PROFILE_MISSING
        transaction.update.assert_not_called()


class TestFirestoreRoleMembers:
    @pytest.fixture
    def users(self, monkeypatch) -> MagicMock:
        client = MagicMock()
        monkeypatch.setattr(firestore_role_members, "firestore_client", lambda: client)
        return client.collection.return_value

    def test_lists_the_ids_of_the_users_with_a_role(self, users):
        query = users.where.return_value.select.return_value
        query.stream.return_value = [snapshot("u1", {}), snapshot("u2", {})]

        assert FirestoreRoleMembers().ids_with_role("support") == ["u1", "u2"]

    def test_knows_whether_a_role_has_members(self, users):
        limited = users.where.return_value.select.return_value.limit.return_value
        limited.stream.return_value = [snapshot("u1", {})]
        assert FirestoreRoleMembers().has_members("support") is True

        limited.stream.return_value = []
        assert FirestoreRoleMembers().has_members("support") is False


class TestFirebaseAuthGateway:
    @pytest.fixture
    def client(self, monkeypatch) -> MagicMock:
        client = MagicMock()
        monkeypatch.setattr(auth_gateway, "auth_client", lambda: client)
        return client

    def test_reads_and_writes_custom_claims(self, client):
        client.get_user.return_value = SimpleNamespace(custom_claims={"role": "runner"})
        gateway = FirebaseAuthGateway()

        assert gateway.get_custom_claims("u1") == {"role": "runner"}
        gateway.set_custom_claims("u1", {"role": "admin", "perms": []})
        gateway.revoke_refresh_tokens("u1")

        client.set_custom_user_claims.assert_called_once_with("u1", {"role": "admin", "perms": []})
        client.revoke_refresh_tokens.assert_called_once_with("u1")

    def test_deletes_the_account(self, client):
        FirebaseAuthGateway().delete_user("u1")

        client.delete_user.assert_called_once_with("u1")

    @pytest.mark.parametrize(
        ("sdk_method", "call"),
        [
            ("get_user", lambda gateway: gateway.get_custom_claims("ghost")),
            ("set_custom_user_claims", lambda gateway: gateway.set_custom_claims("ghost", {})),
            ("revoke_refresh_tokens", lambda gateway: gateway.revoke_refresh_tokens("ghost")),
            ("delete_user", lambda gateway: gateway.delete_user("ghost")),
        ],
    )
    def test_an_unknown_uid_is_reported_through_the_port(self, client, sdk_method, call):
        getattr(client, sdk_method).side_effect = auth.UserNotFoundError("no user")

        with pytest.raises(AuthUserNotFound):
            call(FirebaseAuthGateway())
